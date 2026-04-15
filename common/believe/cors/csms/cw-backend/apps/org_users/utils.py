# Third-Party imports
import hashlib, os, csv, json, base64, psycopg2, requests

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils.crypto import get_random_string
from django.db import transaction
from django.contrib.auth.models import Permission
from django.utils import timezone
from requests.auth import HTTPBasicAuth


# Application imports
from ezedox.settings import PROCESS_ENGINE_USERPASSWORD_SALT, PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD, BACKEND_DOMAIN_URL, SSL_VERIFICATION, BASE_ORG_DOMAIN_URL, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_PASSWORD, POSTGRES_USER, PROCESS_ENGINE_URL
from ezedox.celery import app

from apps.org_apps.utils_urls import CREATE_USER, GET_PRIVILEGES, ADD_PRIVILEGES
from apps.org_users.serializers import OrganisationUserRegistrationSerializer
from apps.organisations.models import Organisation
from apps.org_users.models import OrganisationUser
from apps.org_location.models import Location
from apps.org_department.models import DepartmentDetail
from apps.org_lists.models import OrganisationLists
from apps.org_import.utils import send_updates_for_import
from apps.org_import.models import EntityImport
from apps.organisations.models import Domain

from utils.loggerwrapper import Logger, getMessage
from utils.email import ezedox_send_mail
from .internal_errors import org_users_errors

logger = Logger(__name__)

def send_account_activation_email(request, user):
    tenant = user.tenant.name
    text_content = '{0} account activation'.format(tenant)
    subject = '{0} account activation'.format(tenant)
    template_name = os.path.join(os.path.dirname(
        __file__), 'templates/email_verification.html')
    recipients = [user.email]
    kwargs = {
        "tenant": user.tenant.key,
        "uidb64": urlsafe_base64_encode(force_bytes(user.id)),
        "token": default_token_generator.make_token(user)
    }
    activation_url = reverse('users:org_user_reset_password', kwargs=kwargs)
    modified_activation_url = "/org" + "".join(activation_url.split('api')[1:])

    activate_url = "{0}://{1}{2}".format(request.scheme,
                                         request.get_host(), modified_activation_url)
    context = {
        'user': user.first_name,
        'username': user.email,
        'activate_url': activate_url,
        'domain_url': BASE_ORG_DOMAIN_URL
    }
    html_content = render_to_string(template_name, context)
    message=""
    email_type  ="multi"
    ezedox_send_mail(subject, message,recipients,email_type,text_content,html_content)

def send_forgot_password_email(request, user):
    text_content = 'Account password reset'
    subject = 'Account password reset'
    template_name = os.path.join(os.path.dirname(
        __file__), 'templates/email_forgot_password.html')
    recipients = [user.email]
    kwargs = {
        "uidb64": urlsafe_base64_encode(force_bytes(user.id)),
        "token": default_token_generator.make_token(user)
    }
    activation_url = reverse('users:org_user_reset_password', kwargs=kwargs)
    modified_activation_url = "/org" + "".join(activation_url.split('api')[1:])

    activate_url = "{0}://{1}{2}".format(request.scheme,
                                         request.get_host(), modified_activation_url)
    context = {
        'user': user.first_name,
        'username': user.email,
        'activate_url': activate_url,
        'domain_url': Domain.objects.get(tenant__id=tenant).domain
    }
    html_content = render_to_string(template_name, context)
    message=""
    email_type  ="multi"
    ezedox_send_mail(subject, message,recipients,email_type,text_content,html_content)

def send_scheduled_report(recipients, attachment_path, report_name):
    text_content = 'Scheduled Report Email'
    subject = 'Scheduled Report Email'
    template_name = os.path.join(os.path.dirname(
        __file__), 'templates/send_scheduled_report.html')
    context = {
        "report_name": report_name
    }
    mimetype = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    html_content = render_to_string(template_name, context)
    message=""
    email_type ="multi"
    ezedox_send_mail(subject, message, recipients, email_type, text_content, html_content, [], [], attachment_path, None, mimetype)

def send_report(recipients, attachment_path, report_name):
    text_content = 'Please find the attached report.'
    subject = 'Report Email - ' + report_name
    mimetype = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    message=""
    html_content = "<html><body>Please find the attached Report.</body></html>"
    email_type ="multi"
    ezedox_send_mail(subject, message, recipients, email_type, text_content, html_content, [], [], attachment_path, None, mimetype)

def send_entity_report(recipients, report_link, report_name):
    subject = 'Report Email - ' + report_name
    html_content = "<html><body>Please click on the link to download <a href=' " + report_link + "'>" + report_name + "</a> .</body></html>"
    email_type ="normal"
    ezedox_send_mail(subject, html_content, recipients, email_type, "", "")

def send_ezedox_activation_email(request, ezedox_admin, ezedox_admin_password):
    text_content = 'Admin Activation Email'
    subject = 'Admin Activation Email'
    template_name = os.path.join(os.path.dirname(
        __file__), 'templates/ezedox_admin_activation.html')
    recipients = [settings.EZEDOX_INTERNAL_EMAIL]

    admin_url = "{0}://{1}{2}".format(request.scheme,
                                      request.get_host(), '/api/admin/')

    context = {
        'admin_email': ezedox_admin.email,
        'admin_password': ezedox_admin_password,
        'admin_url': admin_url
    }
    html_content = render_to_string(template_name, context)
    message=""
    email_type  ="multi"
    ezedox_send_mail(subject, message,recipients,email_type,text_content,html_content)

def otp_via_email(request, user, generated_OTP, tenant):
    subject = "Login OTP"
    template_name = os.path.join(os.path.dirname(
        __file__), 'templates/otp_via_email.html')
    recipients = [user.email]
    context = {
        'user': user.first_name,
        'generated_OTP': generated_OTP,
        'org_name': tenant
    }
    text_content=""
    email_type="normal"
    html_content = render_to_string(template_name, context)
    ezedox_send_mail(subject,html_content,recipients,email_type,text_content,html_content)

def task_notification_via_email(request, task_details, notification_details):
    subject = task_details['subject']
    template_name = os.path.join(os.path.dirname(
        __file__), 'templates/task_notification_via_email.html')

    recipients = [notification_details.recipient.email]
    context = {
        'task_assignor': task_details['data']['assignor'],
        'task_message': task_details['message'],
        'task_url': task_details['data']['url'],
        'org_name': request.tenant.name
    }

    html_content = render_to_string(template_name, context)
    text_content=""
    email_type="normal"
    html_content = render_to_string(template_name, context)
    ezedox_send_mail(subject,html_content,recipients,email_type,text_content,html_content)


def password_hash(password):
    salt = PROCESS_ENGINE_USERPASSWORD_SALT
    hashed_password = hashlib.sha512((password + salt).encode()).hexdigest()
    return hashed_password


def get_tenant(request, tenant):
    return Domain.objects.get(tenant__id=tenant).domain.split(".")[0]

@app.task(bind=True, name="bulk_import_user")
def import_user(self,request_body, engine_url, tenant, request_data, roles_index,custom_attribs, tenant_id):
    try:
        serializer_class = OrganisationUserRegistrationSerializer
        with open(request_body["csv_path"], encoding="utf8") as csv_file:
            obj_org = OrganisationUser.default_manager.get(id=request_body["user"])
            import_obj = EntityImport.objects.create(
                transaction_id  = self.request.id,
                started_at      = timezone.now(),
                status          = EntityImport.STATUS_CHOICES[0][0],
                entity_type     = "user",
                user_id         = obj_org.id
            )
            total_count = 0
            success_count = 0
            failed_count = 0
            import_result = {}
            err_logs = {}
            extra_info_list = []
            file_data = csv.reader(csv_file)
            for index, user_data_row in enumerate(file_data): # pylint: disable=too-many-nested-blocks
                error_flag = False
                if index ==0:
                    user_data_length = len(user_data_row)
                    extra_info_list = user_data_row[8:user_data_length]
                if index > 1:
                    is_valid_role = False
                    is_first_name = False
                    is_last_name = False
                    is_email = True
                    is_extra_field_valid = False
                    is_extra_field_exists = False
                    data_validation = []
                    req_json = {}
                    total_count += 1
                    #Checking for First Name
                    if user_data_row[2]:
                        req_json["first_name"] = user_data_row[2]
                        is_first_name = True
                    data_validation.append(is_first_name)
                    if not is_first_name:
                        err_message = "First Name not provided at row no. {}".format(index+1)
                        err_logs['Invalid'] = err_message
                        internal_error = 23079
                        logger.error(getMessage(org_users_errors, internal_error).format(index+1), internal_error)
                        continue
                    #Checking for role field
                    if user_data_row[1]:
                        value = user_data_row[1]
                        if int(value) in roles_index:
                            is_valid_role = True
                            req_json["roles"] = [value]
                        else:
                            err_message = "Incorrect Role Id for user {} at row no {}".format(req_json["first_name"], (index+1))
                            err_logs[req_json["first_name"]] = err_message
                            internal_error = 23080
                            logger.error(getMessage(org_users_errors, internal_error).format(req_json["first_name"], (index+1)), internal_error)
                            continue
                    data_validation.append(is_valid_role)
                    #Checking for manager
                    if user_data_row[4]:
                        manager_data = user_data_row[4]
                        manager = OrganisationUser.default_manager.filter(email__iexact=manager_data)
                        if manager.exists():
                            req_json["manager"] = str(manager[0].id)
                        else:
                            err_message = "Incorrect Manager email found for user {} at row no. {}".format(req_json["first_name"], (index+1))
                            err_logs[req_json["first_name"]] = err_message
                            internal_error = 23081
                            logger.error(getMessage(org_users_errors, internal_error).format(req_json["first_name"], (index+1)), internal_error)
                            continue
                    #Checking for department
                    if user_data_row[5]:
                        dept = user_data_row[5]
                        department = DepartmentDetail.objects.filter(department__name=dept)
                        if department.exists():
                            req_json["department"] = str(department[0].department.id)
                        else:
                            err_message = " Incorrect Department for user {} at row no. {}".format(req_json["first_name"], (index+1))
                            err_logs[req_json["first_name"]] = err_message
                            internal_error = 23082
                            logger.error(getMessage(org_users_errors, internal_error).format(req_json["first_name"], (index+1)), internal_error)
                            continue
                    #Checking for location
                    if user_data_row[6]:
                        location = user_data_row[6]
                        location_obj = Location.objects.filter(name=location)
                        if location_obj.exists():
                            req_json["location"] = str(location_obj[0].location.id)
                        else:
                            err_message = " Incorrect Location for user {} at row no {}".format(req_json["first_name"], (index+1))
                            err_logs[req_json["first_name"]] = err_message
                            internal_error = 23083
                            logger.error(getMessage(org_users_errors, internal_error).format(req_json["first_name"], (index+1)), internal_error)
                            continue
                    if user_data_row[7]:
                        phone_number = user_data_row[7]
                        req_json["mobile"] = '+' + phone_number
                    if len(user_data_row)>7:
                        is_extra_field_exists = True
                        extra_info_data = user_data_row[8:user_data_length]
                        error_flag = False
                        extra_attr = {}
                        for (extra_info_value, extra_info_key) in zip(extra_info_data, extra_info_list):
                            if extra_info_value:
                                for custom_attrib in  custom_attribs:
                                    if custom_attrib['type'] =='number' and custom_attrib['key'] == extra_info_key:
                                        extra_info_value = int(extra_info_value)
                                        break
                                    if custom_attrib['type'] =='list' and custom_attrib['key'] == extra_info_key:
                                        is_multi = custom_attrib['isMulti']
                                        list_id = custom_attrib['list_type']
                                        list_obj = OrganisationLists.objects.filter(id = list_id)
                                        selected_list_data = list_obj[0].list
                                        extra_info_change_value = {}
                                        for check_data in selected_list_data:
                                            if extra_info_value == check_data['value']:
                                                extra_info_change_value = {'key':check_data['key'],'value':extra_info_value}
                                                if is_multi:
                                                    extra_info_value = [extra_info_change_value]
                                                else:
                                                    extra_info_value = extra_info_change_value
                                                break
                                        if not extra_info_change_value:
                                            error_flag = True
                                            break
                            if not error_flag:
                                extra_attr[extra_info_key] = extra_info_value
                            else:
                                break
                    #checking for extra field
                    if is_extra_field_exists:
                        if not error_flag:
                            is_extra_field_valid = True
                            req_json["extra_fields"] = extra_attr
                        data_validation.append(is_extra_field_valid)
                    #Checking for email
                    if user_data_row[0]:
                        is_email = True
                        req_json["email"] = user_data_row[0].lower()
                    data_validation.append(is_email)
                    #Checking for Last Name
                    if user_data_row[3] :
                        req_json["last_name"] = user_data_row[3]
                        is_last_name = True
                    data_validation.append(is_last_name)
                    req_json["password"] = get_random_string(length=8)
                    req_json["groups"] = []
                    req_json["middle_name"] = None
                    req_json["employee_id"] = None
                    req_json["is_active"] = False
                    if False not in data_validation:
                        serializer = serializer_class(data=req_json)
                        if serializer.is_valid():
                            with transaction.atomic():
                                try:
                                    user = serializer.save()
                                    send_activation_email(request_data, tenant, user)
                                    request_user_permissions_list = Permission.objects.filter(
                                                        group__user=user).values_list('codename', flat=True)
                                    if 'change_organisationworkflow' in request_user_permissions_list:
                                        get_modeller_access(engine_url, user, tenant)
                                    success_count += 1
                                    logger.info("User {} imported Successfully".format(req_json["first_name"]))
                                except Exception as e:
                                    err_message = "error for user {} is {}".format(req_json["first_name"], str(e))
                                    err_logs[req_json["first_name"]] = err_message
                                    internal_error = 23084
                                    logger.exception(getMessage(org_users_errors, internal_error).format(req_json["first_name"], str(e)), internal_error)
                        else:
                            err_message = "error for user {} is {}".format(req_json["first_name"], serializer.errors)
                            err_logs[req_json["first_name"]] = err_message
                            internal_error = 23085
                            logger.error(getMessage(org_users_errors, internal_error).format(req_json["first_name"], serializer.errors), internal_error)
                    else:
                        err_message = "Data insufficient for user {} at row no. {}".format(req_json["first_name"], (index+1))
                        err_logs[req_json["first_name"]] = err_message
                        internal_error = 23086
                        logger.error(getMessage(org_users_errors, internal_error).format(req_json["first_name"], (index+1)), internal_error)
            failed_count = total_count - success_count
            import_result["success"] = success_count
            import_result["failed"] = failed_count
            import_result["error_results"] = err_logs
            import_obj.completed_at = timezone.now()
            import_obj.result = import_result
            if failed_count:
                import_obj.status = EntityImport.STATUS_CHOICES[2][0]
            else:
                import_obj.status = EntityImport.STATUS_CHOICES[1][0]
            import_obj.save()
            print("csv_path : {0}".format(request_body["csv_path"]))
            os.remove(request_body["csv_path"])
            print("File removed")
            send_updates_for_import(Organisation.objects.get(id=tenant_id), import_obj)
    except Exception as e:
        internal_error = 23087
        logger.exception(getMessage(org_users_errors, internal_error).format(e), internal_error)

def get_modeller_access(engine_url, user_obj, tenant):
    url = CREATE_USER.format(engine_url)
    req_body = {}
    req_body["id"] = base64.b64encode(bytes(user_obj.userId, 'utf-8')).decode("utf-8")
    req_body["firstName"] = user_obj.first_name
    req_body["lastName"] = user_obj.last_name
    req_body["displayName"] = user_obj.first_name + " " + user_obj.last_name
    req_body["email"] = user_obj.email
    req_body["tenantId"] = tenant
    req_body["password"] = password_hash(user_obj.userId)
    action = requests.post(url, auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), data=json.dumps(req_body), headers={'Content-Type': "application/json"}, verify=SSL_VERIFICATION)

    #Get Privileges id for modeler access
    url = GET_PRIVILEGES.format(engine_url)
    action = requests.get(url, auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), verify=SSL_VERIFICATION)
    for privilege in action.json()["data"]:
        if privilege["name"] == "access-modeler":
            privilege_id = privilege["id"]
            break
    #Add privileges For users to access modeler
    url = ADD_PRIVILEGES.format(engine_url, privilege_id)
    req_body = {}
    req_body["userId"] = base64.b64encode(bytes(user_obj.userId, 'utf-8')).decode("utf-8")
    action = requests.post(url, auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), data=json.dumps(req_body), headers={'Content-Type': "application/json"}, verify=SSL_VERIFICATION)

def send_activation_email(request, tenant, user):
    text_content = '{0} account activation'.format(tenant)
    subject = '{0} account activation'.format(tenant)
    template_name = os.path.join(os.path.dirname(
        __file__), 'templates/email_verification.html')
    recipients = [user.email]
    kwargs = {
        "uidb64": urlsafe_base64_encode(force_bytes(user.id)),
        "token": default_token_generator.make_token(user)
    }
    activation_url = reverse('users:org_user_reset_password', kwargs=kwargs)
    modified_activation_url = "/org" + "".join(activation_url.split('api')[1:])

    activate_url = "{0}://{1}{2}".format(request["scheme"],
                                         request["host"], modified_activation_url)
    context = {
        'user': user.first_name,
        'username': user.email,
        'activate_url': activate_url,
        'domain_url': request["tenant"]
    }
    html_content = render_to_string(template_name, context)
    message=""
    email_type  ="multi"
    ezedox_send_mail(subject, message,recipients,email_type,text_content,html_content)

#for sending any simple email with only text
def send_simple_email(email, subject, message, message2, message3):
    if email and message and subject:
        text_content = ''
        template_name = os.path.join(os.path.dirname(__file__), 'templates/simple_email.html')
        recipients = [email]
        context = {
            'message': message,
            'message2': message2,
            'message3': message3,
        }
        html_content = render_to_string(template_name, context)
        message=""
        email_type  ="multi"
        ezedox_send_mail(subject, message,recipients,email_type,text_content,html_content, tenant_mail=False)


def is_owner_or_superadmin(user):
    return user.groups.all().first().name in ['Owner','Super Administrator']


#for sending task details to users
def send_task_email(email, subject, domain_url, overdue_tasks, today_tasks, upcoming_tasks):
    if email and subject:
        text_content = ''
        template_name = os.path.join(os.path.dirname(__file__), 'templates/task_details_template.html')
        recipients = [email]
        base_domain = os.environ.get('BASE_ORG_DOMAIN_URL')
        scheme = 'http' if base_domain == 'codzelocal.com' else 'https'
        base_url =  '{}://{}/org/tasks/'.format( scheme, domain_url)
        context = {
            'overdue': overdue_tasks,
            'today': today_tasks,
            'upcoming': upcoming_tasks,
            'base_url': base_url,
        }
        html_content = render_to_string(template_name, context)
        message=""
        email_type  ="multi"
        ezedox_send_mail(subject, message,recipients,email_type,text_content,html_content, tenant_mail=False)

def send_report_email(receipts_list,attachments,org_id):
    try:
        url = "{}/cw/{}/apps/send_notification".format(
            BACKEND_DOMAIN_URL,
            org_id)
        logger.info(url)
        att=[attachments]
        body = {
            "payload": {
                "templateId": "PFA_TEMPLATE_CW",
                "type": "EMAIL",
                "subject": 'Report Email - ' + attachments["fileName"],
                "email": receipts_list,
            },
            "attachments": att
        }
        payload = json.dumps(body)
        logger.info(payload)
        headers = {"Content-Type": "application/json"}
        response = requests.request('POST', url, data=payload, headers=headers)
    except Exception as e:
        logger.exception(
            "Unexpected error occurred while sending reports email - {0}".format(e))


def send_otp_email(user,org_id,org_name, generated_otp):
    try:
        url = "{}/cw/{}/apps/send_notification".format(
            BACKEND_DOMAIN_URL,
            org_id)
        logger.info(url)
        body = {
            "payload": {
                "templateId": "EMAIL_OTP_CW",
                "type": "EMAIL",
                "subject": 'Login OTP',
                "email": [user.email],
                'user': user.first_name,
                'generated_OTP': str(generated_otp),
                'org_name': org_name
            },
            "attachments": []
        }
        payload = json.dumps(body)
        logger.info(payload)
        headers = {"Content-Type": "application/json"}
        response = requests.request('POST', url, data=payload, headers=headers)
    except Exception as e:
        logger.exception(
            "Unexpected error occurred while sending otp email - {0}".format(e))
        

@app.task(bind=True, name="userwise_data_update")
def userwise_data_update(self, table_name):
    sucess = None
    try:
        connection = psycopg2.connect(user=POSTGRES_USER, password=POSTGRES_PASSWORD, host=POSTGRES_HOST, port=POSTGRES_PORT, database='flowable')
        cursor = connection.cursor()
        logger.info("Updating Data for " + table_name)

        email_userid_mapping = {}
        for item in OrganisationUser.objects.all():
            if item.email and item.userId:
                email_userid_mapping[item.email] = item.userId

        # act_hi_detail
        if table_name == "act_hi_detail":
            logger.info("Updating Table : act_hi_detail")
            postgreSQL_select_Query = "truncate table act_hi_detail"
            cursor.execute(postgreSQL_select_Query)
            connection.commit()

        # act_hi_comment
        elif table_name == "act_hi_comment":
            pass
        #     logger.info("Updating Table : act_hi_comment")
        #     for item in email_userid_mapping:
        #         postgreSQL_select_Query = "update act_hi_comment set message_ = REPLACE(message_, '{old}', '{new}') where user_id_ = '{old}'".format(old = item, new = email_userid_mapping[item])
        #         cursor.execute(postgreSQL_select_Query)
        #         connection.commit()

        else:
            total_count = len(email_userid_mapping)
            count = 1
            for item in email_userid_mapping:
                # act_hi_actinst
                if table_name == "act_hi_actinst":
                    postgreSQL_select_Query = "update act_hi_actinst set assignee_ = '{new}' where assignee_ = '{old}'".format(old = item, new = email_userid_mapping[item])
                    cursor.execute(postgreSQL_select_Query)
                    connection.commit()

                # act_hi_identitylink
                if table_name == "act_hi_identitylink":
                    postgreSQL_select_Query = "update act_hi_identitylink set user_id_ = '{new}' where user_id_='{old}'".format(old = item, new = email_userid_mapping[item])
                    cursor.execute(postgreSQL_select_Query)
                    connection.commit()

                # act_hi_taskinst
                if table_name == "act_hi_taskinst":
                    postgreSQL_select_Query = "update act_hi_taskinst set assignee_ = '{new}' where assignee_ = '{old}'".format(old = item, new = email_userid_mapping[item])
                    cursor.execute(postgreSQL_select_Query)
                    connection.commit()
                
                # act_id_user
                if table_name == "act_id_user":
                    # userId = str(base64.b64encode(bytes(email_userid_mapping[item], 'utf-8')).decode("utf-8"))
                    # password = password_hash(email_userid_mapping[item])
                    # url = PROCESS_ENGINE_URL + "idm-api/users/" + userId
                    # body = {"password": password}
                    # res = requests.post(url, auth=HTTPBasicAuth(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), headers={"Content-Type" : "application/json"}, json=body)
                    # logger.info(res)
                    postgreSQL_select_Query = "update act_id_user set pwd_ = '{password}' where id_ = '{userId}'".format(password = password_hash(email_userid_mapping[item]), userId = base64.b64encode(bytes(email_userid_mapping[item], 'utf-8')).decode("utf-8"))
                    cursor.execute(postgreSQL_select_Query)
                    connection.commit()

                # act_ru_actinst
                if table_name == "act_ru_actinst":
                    postgreSQL_select_Query = "update act_ru_actinst set assignee_ = '{new}' where assignee_ = '{old}'".format(old = item, new = email_userid_mapping[item])
                    cursor.execute(postgreSQL_select_Query)
                    connection.commit()
                
                # act_ru_identitylink
                if table_name == "act_ru_identitylink":
                    postgreSQL_select_Query = "update act_hi_identitylink set user_id_ = '{new}' where user_id_ = '{old}'".format(old = item, new = email_userid_mapping[item])
                    cursor.execute(postgreSQL_select_Query)
                    connection.commit()
                
                # act_ru_task
                if table_name == "act_ru_task":
                    postgreSQL_select_Query = "update act_ru_task set assignee_ = '{new}' where assignee_ = '{old}'".format(old = item, new = email_userid_mapping[item])
                    cursor.execute(postgreSQL_select_Query)
                    connection.commit()
                
                # act_ru_variable
                if table_name == "act_ru_variable":
                    postgreSQL_select_Query = "update act_ru_variable set text_ = '{new}' where name_ = 'initiator' and text_ = '{old}'".format(old = item, new = email_userid_mapping[item])
                    cursor.execute(postgreSQL_select_Query)
                    connection.commit()

                # act_hi_varinst
                if table_name == "act_hi_varinst":
                    postgreSQL_select_Query = "update act_hi_varinst set text_ = '{new}' where name_ = 'initiator' and text_ = '{old}'".format(old = item, new = email_userid_mapping[item])
                    cursor.execute(postgreSQL_select_Query)
                    connection.commit()
                logger.info("Updating Table : " + table_name + " - > " + str(count) + "/" + str(total_count))
                count = count + 1
        logger.info("Mission Accomplished !!!!! - " + table_name)
        sucess = True
    except (Exception, psycopg2.Error) as error:
        logger.info("Error while fetching data from PostgreSQL - " + table_name)
        logger.exception(error)
        sucess = False
    finally:
        # closing database connection.
        if connection:
            cursor.close()
            connection.close()
            logger.info("PostgreSQL connection is closed")
            return sucess