import json
import copy
import os, requests
import tempfile
import csv
import shutil
from datetime import datetime, timedelta
from django.db.models.expressions import RawSQL
import xlsxwriter
from requests.auth import HTTPBasicAuth
import qrcode
from io import BytesIO
import base64

# from celery.decorators import periodic_task
from celery.schedules import crontab
from django.template import Template, Context
from django.db.models import Q, Sum
from django.template.loader import render_to_string
from django.core.files import File
from django.utils.translation import gettext as _
from weasyprint import HTML
import dateutil.parser as parser

import process_engine
from ezedox.celery import app
from ezedox.settings import MEDIUM_PRIORITY_TASK, AWS_STORAGE_BUCKET_NAME, PROCESS_ENGINE_URL, PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD, DEADLETTERJOBS_EMAIL, BASE_ORG_DOMAIN_URL, FILE_DOMAIN_URL
from ezedox.custom_storage import FileStorage
from utils import storage_utils
from utils.email import ezedox_send_mail
from utils.sms import send_sms
from utils.process_engine_proxy import call
from utils.loggerwrapper import Logger, getMessage, getLogMessage

from apps.org_form.models import OrganisationFile, Transaction, get_default_bucket
from apps.org_group.models import OrganisationGroup
from apps.org_apps.utils import report_csv, parse_json, utc_date_conversion, ist_date_conversion, get_system_filter_value
from apps.org_users.models import OrganisationUser
from apps.org_location.models import Location

from apps.notifications.notification import send_updates
from apps.notifications.constants import UpdatesConstant
from apps.organisations.models import Organisation
from apps.org_users.utils import send_report, send_entity_report, send_report_email
from apps.org_entity.models import OrganisationEntityMasterModel, OrganisationEntityMasterData

from .email_service import schedule_report_and_email
from .models import EmailDigest
from .internal_errors import org_config_errors

logger = Logger(__name__)


@app.task(name="bulk_email")
def send_bulk_email_sms(request_body):
    request = json.loads(request_body)
    EMAIL = "EMAIL"
    SMS = "SMS"
    BOTH = "BOTH"
    if (request['data']['sms_check'] and request['data']['email_check']):
        notification_mode = BOTH
    elif request['data']['sms_check']:
        notification_mode = SMS
    else:
        notification_mode = EMAIL

    for data in request['data']['contacts']:

        if notification_mode == SMS or notification_mode == BOTH:
            if 'phone' in data and 'sms_body' in request['data'] and 'dltid' in request['data']:
                PhoneNumber=data['phone']
                Message=request['data']['sms_body']
                DLT_TE_ID = request['data']['dltid']
                send_sms(PhoneNumber, Message, DLT_TE_ID, request)

        if notification_mode == EMAIL or notification_mode == BOTH:
            message = request['data']['email_body']
            email = data['email']
            subject = request['data']['subject']
            recipient_list = [email,]

            email_type ="normal"
            text_content=""
            html_content=""
            ezedox_send_mail(subject,message,recipient_list,email_type,text_content,
            html_content)
        else:
            context = {"success": True, "message": _("Notification mode improperly passes")}
            logger.info(context)


# @periodic_task(run_every=timedelta(minutes=1), bind=True, name="trigger_reports_and_emails")
@app.task(bind=True, name="trigger_reports_and_emails")
def trigger_reports_and_emails(self):
    schedule_report_and_email()


def get_report_data(query, selected_fields, engine_url, tenant, process_key, COMPARISION, sheet_name=None):
    req_body = {}
    req_body["processDefinitionKey"] = process_key
    variables = []
    for d in query['query']:
        values = {}
        if d["type"] == "processSpecific":
            values["value"] = d['value']
            values["variableOperation"] = d['comparision']
            values["name"] = d['attribute']
            values["operation"] = COMPARISION[d['comparision']]
            variables.append(values)
        elif d["type"] == "common":
            req_body[d['attribute']] = d['value']
    # req_body["finished"] = True
    req_body["variables"] = variables
    req_body["includeProcessVariables"] = False
    req_body["sort"] = "startTime"
    req_body["order"] = "desc"
    req_body["size"] = 1000
    Query = process_engine.QueryApi
    query_historic_process = Query.query_historic_process_instance
    action = call(module = Query, func= query_historic_process, data= req_body, tenant_id= tenant, type="post", read_replica=True)[0]
    if action["total"] > 1000:
        req_body["size"] = action["total"]
        action = call(module = Query, func= query_historic_process, data= req_body, tenant_id= tenant, type="post", read_replica=True)[0]
    request_body = {}
    request_body["engineurl"] = engine_url
    request_body["process_key"] = process_key
    request_body["tenantId"] = tenant
    request_body["data"] = action["data"]
    request_body["selected_items"] = selected_fields
    if sheet_name is not None:
        request_body["sheet_name"] = sheet_name
    return request_body

def get_all_emails(request):
    emails = []
    if 'HTTP_EMAIL' in request.META:
        email = request.META['HTTP_EMAIL']
        #TODO HAck
        if request.META['HTTP_EMAIL'][-1] == ';':
            email = request.META['HTTP_EMAIL'][:-1]
        emails = email.split(",")
    if 'HTTP_GROUP' in request.META:
        group = request.META['HTTP_GROUP']
        if request.META['HTTP_GROUP'][-1] == ';':
            group = request.META['HTTP_GROUP'][:-1]
        group = OrganisationGroup.objects.filter(name=group)
        if group.exists():
            org_users_email = group[0].users.all().values_list('email', flat=True)
            for group_email in org_users_email:
                emails.append(group_email)
    return emails

@app.task(bind=True, name="report_generation")
def report_generation(self, engine_url, tenant_id, process_key, COMPARISION, selected_fields, query, or_query, recipients, name, send_via_email,schema,host,report_id,org_user_email, transaction_id = None):
    logger.info("{}, Preparing the data to generate the process report".format(org_user_email))
    try:
        user_obj = OrganisationUser.objects.get(email=org_user_email)
        tenant = Organisation.objects.get(id=tenant_id)
        if len(or_query)>0:
            new_request_body = []
            for or_querys in or_query:
                sheet_name = ""
                if "filter" in or_querys:
                    sheet_name =  or_querys["filter"]
                new_query = copy.deepcopy(query)
                new_query["query"].append(or_querys)
                new_request_body.append(get_report_data(new_query, selected_fields, engine_url, tenant_id, process_key, COMPARISION, sheet_name))

            response_data = report_csv(new_request_body, recipients, name, send_via_email)

            file_upload = OrganisationFile.objects.create(
                name= name + ".xlsx",
                user = user_obj,
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                file=File(open(response_data, 'rb'), name=name + ".xlsx"),
                doc_type=OrganisationFile.TYPE_CHOICES[3][0],
                tenant=tenant
            )
            shutil.rmtree(response_data.replace("/Reports.xlsx",""))
            # if file_storage.
            new_file_key = file_upload.file.name
            try:
                storage_utils.load_file(file_upload)
                logger.info("{}, The process file successfully uploaded".format(user_obj.email))
            except Exception as error:
                if error.response['Error']['Code'] == "404":
                    internal_error = 8074
                    logger.error(getMessage(org_config_errors, internal_error).format(user_obj.email, error), internal_error)
            if send_via_email:
                logger.info("{}, The process report preparing to send over email.".format(user_obj.email))
                #call send notification api
                attachment = {
                    "s3": {
                        "bucket": file_upload.aws_bucket,
                        "key": new_file_key
                    },
                    "fileName": name+ ".xlsx",
                    "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    }
                send_report_email(recipients,attachment,tenant_id)
            else:
                data = {
                    "url" : "{0}://{1}{2}".format(schema,host, "/api/forms/files/" + str(file_upload.id)),
                    "id": report_id,
                    "transaction_id": transaction_id,
                    "success":True,
                    "message":""
                }
                send_updates(tenant_id,user_obj, UpdatesConstant.CELERY_REPORT, data)
        else:
            request_body = get_report_data(query, selected_fields, engine_url, tenant_id, process_key, COMPARISION)
            response_data =  report_csv(request_body, recipients, name, send_via_email)
            file_upload = OrganisationFile.objects.create(
                name= name + ".xlsx",
                user = user_obj,
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                file=File(open(response_data, 'rb'), name=name + ".xlsx"),
                doc_type=OrganisationFile.TYPE_CHOICES[3][0],
                tenant=tenant
            )
            shutil.rmtree(response_data.replace("/Reports.xlsx",""))

            new_file_key = file_upload.file.name
            logger.info(new_file_key)
            try:
                storage_utils.load_file(file_upload)
                logger.info("{}, The process file successfully uploaded".format(user_obj.email))
            except Exception as error:
                if error.response['Error']['Code'] == "404":
                    internal_error = 8075
                    logger.error(getMessage(org_config_errors, internal_error).format(user_obj.email, error), internal_error)
            if send_via_email:
                logger.info("{}, The process report preparing to send over email.".format(user_obj.email))
                # call send notification api
                attachment = {
                    "s3": {
                        "bucket": file_upload.aws_bucket,
                        "key": new_file_key
                    },
                    "fileName": name + ".xlsx",
                    "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                }
                send_report_email(recipients, attachment, tenant_id)
            else:
                data = {
                    "url" : "{0}://{1}{2}".format(schema,host, "/api/forms/files/" + str(file_upload.id)),
                    "id": report_id,
                    "transaction_id": transaction_id,
                    "success":True,
                    "message":""
                }
                send_updates(tenant_id,user_obj, UpdatesConstant.CELERY_REPORT, data)
        logger.info("{}, process report generated successfully.".format(user_obj.email))
    except Exception as error:
        data = {
                "url" : "",
                "id": report_id,
                "transaction_id": transaction_id,
                "success":False,
                "message":"Failed to generate report."
            }
        send_updates(tenant,user_obj, UpdatesConstant.CELERY_REPORT, data)
        internal_error = 8076
        logger.exception(getMessage(org_config_errors, internal_error).format(user_obj.email, error), internal_error)


def tenantwise_send_daily_digest(org):
    from django.db import connection
    connection.set_tenant(org)

    to_lists = []
    time_threshold = datetime.now() - timedelta(hours=24)
    old_list = list(EmailDigest.objects.filter(created_at__gte=time_threshold).values_list('to',flat=True).distinct())
    for i in old_list:
        for j in i:
            if j not in to_lists:
                to_lists.append(j)
    title = "Activity Updates from " + org.name
    subject = '{} - {}'.format(title, datetime.now().strftime("%d/%m/%y"))
    text_content = title
    template_name = os.path.join(os.path.dirname(__file__), 'templates/email_digest.html')
    for tos in to_lists:
        context = {
            "obj" : EmailDigest.objects.all().filter(to__contains=[tos],created_at__gte=time_threshold)
        }
        html_content = render_to_string(template_name, context)
        text_content=""
        email_type="normal"
        ezedox_send_mail(subject, html_content,[tos],email_type,text_content,html_content)

def generate_qr_code(data):
    img = qrcode.make(data, box_size=10)
    stream = BytesIO()
    img.save(stream, format="PNG")
    qr_code_base64_url="data:image/png;base64,"+base64.b64encode(stream.getvalue()).decode("utf-8")
    return qr_code_base64_url

def doc_generator(data, obj,processInstanceId, request, tags, doc_type='pdf', tenant_id=None):
    if 'qr_url' in data:
        data['qr_code'] = generate_qr_code(data['qr_url'])
    
    document = {
        "data" :data
    }
    name = obj.name
    tag_list = tags.split(",")
    dirpath = tempfile.mkdtemp()
    temp_file_directory_address = dirpath + "/"
    if doc_type == "png":
        temp_file = temp_file_directory_address + name + ".png"
    else:
        temp_file = temp_file_directory_address + name + ".pdf"
    logger.info(temp_file)
    template_string = obj.html
    template = Template(template_string)
    context = Context(document)
    html_string = template.render(context)
    html = HTML(string=html_string)
    logger.info("HTML rendering done successfully.")
    if doc_type == "png":
        html.write_png(target=temp_file,presentational_hints=True)
        logger.info("PNG created successfully.")
        file_name = name + '.png'
        content_type = "image/png"
    else:
        html.write_pdf(target=temp_file,presentational_hints=True)
        logger.info("PDF created successfully.")
        file_name = name + '.pdf'
        content_type = "application/pdf"
    
    transaction_obj =  Transaction.objects.filter(process_instance_id = processInstanceId, tenant__id=tenant_id).first()
    org_obj = Organisation.objects.get(pk=tenant_id)
    aws_bucket = get_default_bucket()
    file_path = request.query_params.get('file_path', None)
    if file_path:
        aws_bucket, file_path = file_path.split(':')
    if not transaction_obj: 
        transaction_obj = Transaction.objects.create(tenant=org_obj)
    file_upload = OrganisationFile.objects.create(
                name= file_name,
                process_instance_id=processInstanceId,
                content_type=content_type,
                file=File(open(temp_file, 'rb'), name=file_name),
                doc_type=OrganisationFile.TYPE_CHOICES[2][0],
                transaction_id = transaction_obj,
                tenant=org_obj,
                aws_bucket=aws_bucket,
                file_path=file_path
            )
    for tag in tag_list:
        file_upload.tags.set(tag)
    new_file_key = file_upload.file.name
    logger.info( new_file_key)
    try:
        storage_utils.load_file(file_upload)
    except Exception as error:
        if error.response['Error']['Code'] == "404":
            internal_error = 8077
            logger.error(getMessage(org_config_errors, internal_error), internal_error)
    logger.info("Generated Document Id : {}".format(str(file_upload.id)))
    var_response = {}
    var_response["originalName"] = file_upload.name
    var_response["type"] = file_upload.content_type
    var_response["name"] = file_upload.name
    var_response["size"] = file_upload.file.size
    var_response["storage"] = "url"
    var_response["url"] = "{0}://{1}/api/cw/{2}/forms/files/{3}".format(request.scheme, FILE_DOMAIN_URL, tenant_id, str(file_upload.id))
    var_response["file_path"] = new_file_key
    var_response["data"] = {}
    var_response["data"]["name"] = file_upload.name
    var_response["data"]["form"] = ""
    var_response["data"]["baseUrl"] = ""
    var_response["data"]["size"] = file_upload.file.size
    var_response["data"]["url"] = "{0}://{1}/api/cw/{2}/forms/files/{3}".format(request.scheme, FILE_DOMAIN_URL, tenant_id, str(file_upload.id))
    var_response["data"]["project"] = ""
    var_response["data"]["file_path"] = "file/download/" + new_file_key
    shutil.rmtree(dirpath)
    return var_response

@app.task(bind=True, name="update_custom_attribute")
def celery_update_custom_attribute(self, cus_type, cus_data, tenant):
    try:
        logger.info("Updating.... Custom Attribute For {}.".format(cus_type))
        if cus_type == 'users':
            data_obj = OrganisationUser.objects.all(tenant__id=tenant)
        if cus_type == 'locations':
            data_obj = Location.objects.all(tenant__id=tenant)
        if data_obj.exists():
            for sel_data in data_obj:
                data_keys=[]
                if sel_data.extra_fields:
                    data_keys = sel_data.extra_fields.keys()
                for cus_val in cus_data:
                    key = cus_val['key']
                    if key not in data_keys:
                        sel_data.extra_fields[key] = ''
                sel_data.save()
            logger.info("Successfully Updated Custom Attribute For {}.".format(cus_type))
        else:
            logger.info("No {} data found to update Custom Attribute.".format(cus_type))
        return cus_type
    except Exception as error:
        internal_error = 8078
        logger.exception(getMessage(org_config_errors, internal_error).format(str(error)), internal_error)


def update_custom_attribute(cus_type,cus_data, tenant):
    celery_update_custom_attribute.apply_async(args=[cus_type, cus_data, tenant], priority=MEDIUM_PRIORITY_TASK)

def create_entity_report(report_path, request_body, user=None, sheet_name="Sheet 1"):
    logger.info("{}, Preparing the data to generate entity report excel.".format(user))
    try:
        with open(report_path, 'a+', newline='') as write_obj:
            csv_writer = csv.writer(write_obj)
            form_fields = []
            entity_fields = []
            if "selected_fields" in request_body["selected_items"]:
                form_fields = request_body["selected_items"]["selected_fields"]
                if "entity_fields" in request_body["selected_items"]:
                    entity_fields = request_body["selected_items"]["entity_fields"]
            combine_field = form_fields + entity_fields
            # combine_query_field = ["entity_data"] + [i["key"] for i in entity_fields] + [i["key"] for i in form_fields]
            csv_writer.writerow([item["name"] for item in combine_field])
            req_data = request_body["data"]
            req_data["query_json"]["entity_model"] = req_data["master_model_id"]
            if req_data["exclude_string"] == "":
                data_set = OrganisationEntityMasterData.objects.all_with_deleted().annotate(**req_data["annotate_query_json"]).filter(Q(**req_data["query_json"])).filter(~Q(**req_data["not_query_json"]))
            else:
                data_set = OrganisationEntityMasterData.objects.all_with_deleted().exclude(eval(req_data["exclude_string"])).annotate(**req_data["annotate_query_json"]).filter(Q(**req_data["query_json"])).filter(~Q(**req_data["not_query_json"]))
            data_set_count = data_set.count()
            for i in range(0,data_set_count,1000):
                for data_instance in data_set.values()[i:i+1000].iterator():
                    row = []
                    for headers in combine_field:
                        if headers["key"] in data_instance["entity_data"]:
                            row.append(parse_json(data_instance["entity_data"][headers["key"]]))
                        elif headers["key"] == "created_at" or headers["key"] == "deleted_at" or headers["key"] == "updated_at":
                            date_str = data_instance[headers["key"]]
                            if date_str:
                                date_str = ist_date_conversion(date_str.strftime("%Y-%m-%dT%H:%M:%S.%fZ"))
                            row.append(parse_json(date_str))
                        elif headers["key"] in data_instance and data_instance[headers["key"]] is not None:
                            if headers["key"] == "date_of_birth" or headers["key"] == "date_of_joining":
                                row.append(data_instance[headers["key"]].strftime("%d %b %Y"))
                            else:
                                row.append(parse_json(data_instance[headers["key"]]))
                        else:
                            row.append("")
                    if not(len(set(row)) == 1 and set(row) == {''}):
                        csv_writer.writerow(row)
        logger.info("{}, entity report excel generated successfully.".format(user))
    except Exception as error:
        internal_error = 8079
        logger.exception(getMessage(org_config_errors, internal_error).format(user, error), internal_error)


def entity_report_generation(request_body, tenant, recipients, name, send_via_email, schema, host, report_id, user_obj, transaction_id = None):
    logger.info("{}, Preparing the data to generate entity report.".format(user_obj.email))
    try:
        dirpath = tempfile.mkdtemp()
        report_path = dirpath + "/Reports.csv"
        create_entity_report(report_path, request_body, user_obj.email)
        file_upload = OrganisationFile.objects.create(
            name= name + ".csv",
            user = user_obj,
            content_type="text/csv",
            file=File(open(report_path, 'rb'), name=name + ".csv"),
            doc_type=OrganisationFile.TYPE_CHOICES[3][0]
        )
        new_file_key = file_upload.file.name
        logger.info("/files/" + new_file_key)
        try:
            storage_utils.load_file(file_upload)
            logger.info("{}, The entity file successfully uploaded.".format(user_obj.email))
        except Exception as error:
            if error.response['Error']['Code'] == "404":
                internal_error = 8080
                logger.error(getMessage(org_config_errors, internal_error).format(user_obj.email, error), internal_error)
        if send_via_email:
            logger.info("{}, The entity report preparing to send over email.".format(user_obj.email))
            report_link = storage_utils.get_presigned_url(file_upload)
            send_entity_report(recipients, report_link, name)
        else:
            data = {
                "url" : file_upload.file.url,
                "id": report_id,
                "success":True,
                "message":"",
                "transaction_id": transaction_id
            }
            send_updates(tenant,user_obj, UpdatesConstant.CELERY_REPORT, data)
        shutil.rmtree(dirpath)
        logger.info("{}, entity report generated successfully.".format(user_obj.email))
    except Exception as error:
        shutil.rmtree(dirpath)
        internal_error = 8081
        logger.exception(getMessage(org_config_errors, internal_error).format(user_obj.email, error), internal_error)
        data = {
                "url" : "",
                "id": report_id,
                "success":False,
                "message":"Failed to generate report.",
                "transaction_id": transaction_id
            }
        send_updates(tenant,user_obj, UpdatesConstant.CELERY_REPORT, data)



def get_date_string(attribute, date_str):
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    new_date = ''
    if attribute == "startedAfter":
        new_date_obj = date_obj + timedelta(days=1)
        date_str = datetime.strftime(new_date_obj, "%Y-%m-%d")
        new_date = utc_date_conversion(date_str)
        return new_date
    if attribute == "startedBefore":
        new_date = utc_date_conversion(date_str)
        return new_date
    if attribute == "finishedAfter":
        new_date_obj = date_obj + timedelta(days=1)
        date_str = datetime.strftime(new_date_obj, "%Y-%m-%d")
        new_date = utc_date_conversion(date_str)
        return new_date
    if attribute == "finishedBefore":
        new_date = utc_date_conversion(date_str)
        return new_date
    return new_date



def create_master_data_report(workbook, request_body,sheet_name="Sheet 1"):
    worksheet = workbook.add_worksheet(sheet_name)
    row = 0
    col = 0
    form_fields = []
    if "selected_fields" in request_body["selected_items"]:
        form_fields = request_body["selected_items"]["selected_fields"]
    flag = 0
    for headers in form_fields:
        worksheet.write(row, col,headers["type"])
        col = col+1
    row = row + 1
    col = 0
    for headers in form_fields:
        worksheet.write(row, col,headers["key"])
        col = col+1
    row = row + 1
    col = 0
    worksheet.set_row(0, None, None, {'hidden': True})
    worksheet.set_row(1, None, None, {'hidden': True})
    for headers in form_fields:
        worksheet.write(row, col,headers["name"])
        col = col+1
    row = row + 1
    col = 0
    for data_instance in request_body["data"]:
        for headers in form_fields:
            if headers["key"] in data_instance["entity_data"]:
                flag = 1
                if type(data_instance["entity_data"][headers["key"]]) == bool:
                    if data_instance["entity_data"][headers["key"]] == True :
                        data_instance["entity_data"][headers["key"]] = "TRUE"
                    else :
                        data_instance["entity_data"][headers["key"]] = "FALSE"
                worksheet.write(row, col,parse_json(data_instance["entity_data"][headers["key"]]))
            col = col + 1
        if flag == 1:
            row = row + 1
            col = 0
            flag = 0

@app.task(bind=True, name="entity_report_creation")
def entity_report_creation(self, master_model_id, tenant_id, name, user_filter, send_via_email, data, scheme, host, report_id, org_user_email, transaction_id = None):
    try:
        user_obj = OrganisationUser.objects.get(email=org_user_email)
        tenant = Organisation.objects.get(id=tenant_id)
        try:
            master_model_obj = OrganisationEntityMasterModel.objects.get(id=master_model_id)
        except Exception as error:
            internal_error = 8017
            logger.error(getLogMessage(org_config_errors, internal_error).format(org_user_email, report_id, error), internal_error)
            data = {
                "url" : "",
                "id": report_id,
                "success":False,
                "message":"Failed to generate report.",
                "transaction_id": transaction_id
            }
            send_updates(tenant, user_obj, UpdatesConstant.CELERY_REPORT, data)
            return None
        
        fields_in_master_data_model = []
        not_list = ["organisationentityauditlog", 'organisationentityeducationalrecord', 'organisationentitypreviousemploymentrecord', 'organisationentityprofessionalreference', 'id', 'created_at', 'updated_at', 'is_deleted', 'deleted_at', 'entity_data', 'entity_model']
        for item in OrganisationEntityMasterData._meta.get_fields():
            if item.name not in not_list:
                fields_in_master_data_model.append(item.name)
        query = data['query']
        selected_fields = data['selected_fields']
        query_json = {}
        not_query_json = {}
        annotate_query_json = {}
        exclude_string = ""
        org_user = OrganisationUser.default_manager.filter(email=org_user_email)
        if user_filter and len(user_filter) > 0:
            user_filters = user_filter[0]
            key = "entity_data__" + user_filters
            if user_filters in fields_in_master_data_model:
                key = user_filters
            query_json[key + "__in"] = get_system_filter_value(user_filters, org_user)
        for q in query['query']:
            key = "entity_data__" + q["attribute"]
            if q["attribute"] in fields_in_master_data_model:
                key = q["attribute"]
            if q["type"] == "processSpecific":
                if 'field_type' in q.keys() and q['field_type'] == 'date' and q["attribute"] != "date_of_birth" and q["attribute"] != "date_of_joining":
                    compare_field = key + '__' + 'exact'
                    if exclude_string == "":
                        exclude_string = exclude_string + 'Q(**{"' + compare_field + '":""}) | Q(**{"' + compare_field + '":None})'
                    else:
                        exclude_string = exclude_string + ' | Q(**{"' + compare_field + '":""}) | Q(**{"' + compare_field + '":None})'
                    str_date = q['value']
                    date_obj = parser.parse(str_date)
                    formated_date=date_obj.isoformat()
                    date_query = "(entity_data->>'"+q['attribute']+"')::timestamptz"
                    if q['comparision'] == 'EQUALS':
                        after_date = date_obj + timedelta(days=1)
                        formated_after_date=after_date.isoformat()
                        after_date_query = q['attribute']+'__lt'
                        filter_variable = q['attribute']+'__gte'
                        annotate_query_json[q['attribute']] = RawSQL(date_query, [])
                        query_json[filter_variable] = formated_date
                        query_json[after_date_query] = formated_after_date
                    elif q['comparision'] == 'NOT_EQUALS':
                        after_date = date_obj + timedelta(days=1)
                        formated_after_date=after_date.isoformat()
                        after_date_query = q['attribute']+'__gte'
                        filter_variable = q['attribute']+'__lt'
                        annotate_query_json[q['attribute']] = RawSQL(date_query, [])
                        not_query_json[filter_variable] = formated_after_date
                        not_query_json[after_date_query] = formated_date
                    elif q['comparision'] == 'GREATER_THAN':
                        filter_variable = q['attribute'] + '__gt'
                        query_json[filter_variable] = formated_date
                        annotate_query_json[q['attribute']] = RawSQL(date_query, [])
                    elif q['comparision'] == 'GREATER_THAN_OR_EQUALS':
                        filter_variable = q['attribute'] + '__gte'
                        query_json[filter_variable] = formated_date
                        annotate_query_json[q['attribute']] = RawSQL(date_query, [])
                    elif q['comparision'] == 'LESS_THAN':
                        filter_variable = q['attribute'] + '__lt'
                        query_json[filter_variable] = formated_date
                        annotate_query_json[q['attribute']] = RawSQL(date_query, [])
                    else:
                        # this block is for LESS_THAN_OR_EQUALS'
                        filter_variable = q['attribute'] + '__lte'
                        query_json[filter_variable] = formated_date
                        annotate_query_json[q['attribute']] = RawSQL(date_query, [])
                else:
                    if q['comparision'] == "EQUALS":
                        query_filters = key + '__' + 'exact'
                        query_json[query_filters] = q['value']
                    elif q['comparision'] == "NOT_EQUALS":
                        query_filters = key + '__' + 'exact'
                        not_query_json[query_filters] = q['value']
                    elif q['comparision'] == "EQUALS_IGNORE_CASE":
                        query_filters = key + '__' + 'iexact'
                        query_json[query_filters] = q['value']
                    elif q['comparision'] == "NOT_EQUALS_IGNORE_CASE":
                        query_filters = key + '__' + 'iexact'
                        not_query_json[query_filters] = q['value']
                    elif q['comparision'] == 'GREATER_THAN':
                        query_filters = key +'__' + 'gt'
                        query_json[query_filters] = q['value']
                    elif q['comparision'] == 'GREATER_THAN_OR_EQUALS':
                        query_filters = key + '__' + 'gte'
                        query_json[query_filters] = q['value']
                    elif q['comparision'] == 'LESS_THAN':
                        query_filters = key + '__' + 'lt'
                        query_json[query_filters] = q['value']
                    elif q['comparision'] == 'LESS_THAN_OR_EQUALS':
                        query_filters = key + '__' + 'lte'
                        query_json[query_filters] = q['value']
                    elif q['comparision'] == "LIKE":
                        query_filters = key + '__' + 'contains'
                        query_json[query_filters] = q['value']
                    else:
                        #this block is for LIKE_IGNORE_CASE
                        query_filters = key + '__' + 'icontains'
                        query_json[query_filters] = q['value']
            else:
                date_obj = datetime.strptime(q['value'], "%Y-%m-%d")
                if q['attribute'] == 'deletedBefore':
                    new_date_obj = date_obj
                else:
                    new_date_obj = date_obj + timedelta(days=1)
                date_str = datetime.strftime(new_date_obj, "%Y-%m-%d")
                utc_date = utc_date_conversion(date_str)

                if q['attribute'] == 'activeOn':
                    query_json["created_at__lt"] = utc_date
                    not_query_json["deleted_at__lte"] = utc_date
                elif q['attribute'] == 'deletedAfter':
                    query_json["deleted_at__gte"] = utc_date
                else:
                    #this block is for deletedBefore
                    query_json["deleted_at__lt"] = utc_date
        request_body = {}
        var_json = {}
        var_json["master_model_id"] = master_model_id
        var_json["query_json"] = query_json
        var_json["annotate_query_json"] = annotate_query_json
        var_json["exclude_string"] = exclude_string
        var_json["not_query_json"] = not_query_json
        request_body["data"] = var_json
        # list(master_data_queryset.values('entity_data', 'created_at', 'deleted_at', 'updated_at'))
        request_body["selected_items"] = selected_fields

        if send_via_email:
            logger.info("{}, Report successfully sent to generate for entity report for id: {}".format(org_user_email, report_id))
            entity_report_generation(request_body,tenant, [org_user_email], name, True, scheme, host, report_id, user_obj, transaction_id)
        else:
            logger.info("{}, Report successfully sent to generate for entity report for id: {}".format( org_user_email, report_id))
            entity_report_generation(request_body,tenant, [org_user_email], name, False, scheme, host, report_id, user_obj, transaction_id)
    except Exception as error:
        internal_error = 8082
        logger.exception(getMessage(org_config_errors, internal_error).format(org_user_email, error), internal_error)
        data = {
                "url" : "",
                "id": report_id,
                "success":False,
                "message":"Failed to generate report.",
                "transaction_id": transaction_id
            }
        send_updates(tenant, user_obj, UpdatesConstant.CELERY_REPORT, data)


#IN UTC FORMAT
# HOURS = 00
# MINUTES = 00
# @periodic_task(run_every=crontab(minute=MINUTES, hour=HOURS), name="trigger_deadletterjobs_report")
@app.task(bind=True, name="trigger_deadletterjobs_report")
def trigger_deadletterjobs_report():
    try:
        time_threshold = datetime.now() - timedelta(hours=24)
        duedateAfter = str(time_threshold.date()) + "T05:30:00Z"
        url = PROCESS_ENGINE_URL + "service/management/deadletter-jobs?sort=tenantId&order=asc&size=100&dueAfter=" + duedateAfter
        data = requests.get(url, auth=HTTPBasicAuth(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), headers={"Content-Type" : "application/json"})
        if data.json()["total"] == 0:
            logger.info("No DeadLetter Jobs for today.")
        else:
            context = {
                'data' : data.json()["data"],
                'total' : data.json()["total"]
            }
            subject = 'DeadLetter Jobs Report - {}'.format(datetime.now().strftime("%d/%m/%y"))
            template_name = os.path.join(os.path.dirname(__file__), 'templates/deadletterjobs_report.html')
            html_content = render_to_string(template_name, context)
            text_content=""
            email_type="normal"
            tos = DEADLETTERJOBS_EMAIL
            ezedox_send_mail(subject, html_content,tos,email_type,text_content,html_content, tenant_mail=False)
    except Exception as e:
        logger.info(e)