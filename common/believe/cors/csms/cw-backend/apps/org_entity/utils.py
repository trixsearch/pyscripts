import logging
import time
import uuid
import operator
from functools import reduce
from django.db.models import Q
from collections import OrderedDict
from ezedox.celery import app
import process_engine
from apps.org_form.models import OrganisationFile, get_default_bucket
from utils import storage_utils
from utils.process_engine_proxy import call
from .serializers import OrganisationEntityAuditLogViewSerializer
from django.db import connection, transaction
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.validators import FileExtensionValidator
from apps.organisations.models import Organisation
from apps.org_entity.models import OrganisationEntityMasterData
from apps.org_form.models import OrganisationFile
from apps.org_entity.serializers import OrganisationEntityMasterDataSerializer, UpdateDataSerializer
from django.forms import ValidationError
from apps.org_form.models import OrganisationFile

logger = logging.getLogger(__name__)

@app.task(bind=True, name="Add Audit log for Entity.")
def add_entity_audit_log(self, request_data, entity_id, tenant_id=None):
    serializer_class = OrganisationEntityAuditLogViewSerializer

    # TODO: Rethink about this approach, this adds delay of 30 secs because, flowable returns
    # incomplete data if we query it immediately, so querying it after certain delay would have complete data.
    time.sleep(30)
    try:
        # Return if either of entity_id or processInstanceId is missing.
        if not entity_id:
            logger.error("Failed to add audit log, Entity Id not found.")
            return

        if 'processInstanceId' not in request_data:
            logger.info("Unable to add audit log, Process Instance Id was not found for Entity Id {}".format(entity_id))
            return

        # Construct url with tenant's engine url and proxy url
        History = process_engine.HistoryApi
        list_historic_activity_instances = History.list_historic_activity_instances
        # url = engine_url + HISTORIC_ACTIVITY_INSTANCES

        # Query params for process-engine , processInstId and activityType
        query_params = {
            "process_instance_id": request_data['processInstanceId'],
            "activity_type": "userTask"
        }

        response_context, response_status = call(module=History, func=list_historic_activity_instances, data=query_params, type="get", tenant_id=tenant_id)

        # Extract data from response
        audit_log_data = response_context['data']

        if response_status < 300:
            logger.info("{}, Audit Log of Process instance retrieved successfully.".format(request_data['processInstanceId']))
        else:
            logger.error("{}, Failed to get Audit Log of Process instance.".format(request_data['processInstanceId']))

        # Iterate and save the audit log
        array_log = []
        for log in audit_log_data:

            log_data = {}
            log_data['name']          = log['activityName']
            log_data['activity_type'] = log['activityType']
            log_data['assignee']      = log['assignee']
            log_data['end_time']      = log['endTime']
            log_data['entity']        = str(entity_id)
            array_log.append(log_data)

        serializer = serializer_class(data=array_log, many=True)
        if serializer.is_valid():
            try :
                serializer.save()
            except Exception as e:
                logger.exception(e)
        else:
            logger.error('Failed to add log due to, {}'.format(serializer.errors))
    except Exception as e:
        logger.exception(e)


def search_json(obj, search):
    # import ipdb; ipdb.set_trace()
    if "and" in search:
        if "and" in search["and"] or "or" in search["and"]:
            temp_obj= search_json(obj,search["and"])

            # if search["and"].keys()
        else:
            obj = obj.filter(entity_data__contains=search["and"])
    elif "or" in search:
        if "and" in search["or"] or "or" in search["or"]:
            search_json(obj,search["or"])
        else:
            or_condition = reduce(operator.or_, (Q(**{"entity_data__contains":{keys:search["or"][keys]}}) for keys in search["or"]))
            # import ipdb; ipdb.set_trace()
            obj = obj.filter(or_condition)
    else:
        obj = obj.filter(entity_data__contains=search)
    return obj


@app.task(bind=True, name="update_entity_id_in_files")
def update_entity(self, request_data):
    try:
        files = request_data['files']
        entity_id = request_data['entity_id']
        logger.info("Updating files with entity Id {}".format(entity_id))
        for file_id in files:
            try:
                file_obj = OrganisationFile.objects.get(id = file_id)
                file_obj.entity_id = entity_id
                file_obj.save()
                logger.info("file name {} updated with entity_id {}".format(file_obj.name, entity_id))
            except Exception as error:
                logger.exception(error)
    except Exception as error:
        logger.exception(error)


def remove_extra_keys(entity_data):
    redundant_keys = ['transaction_id', 'processInstanceId','e_tag', 'X-Api-Key']
    process_engine_redundant_keys = ['sid', 'responseProtocol', 'responseReason', 'responseStatusCode', 'responseHeaders', 'responseBody', 'errorMessage']
    for redundant_key in redundant_keys:
        if redundant_key in entity_data:
            del entity_data[redundant_key]

    entity_data_keys = list(entity_data)
    for entity_data_key in entity_data_keys:
        for process_engine_redundant_key in process_engine_redundant_keys:
            if process_engine_redundant_key in entity_data_key:
                del entity_data[entity_data_key]
    

def transfer_entity(org_from, org_to, data, destination_entity_model, destination_file_path):
    try:
        FILE_VARIABLES = ["entity_photo","attachResume","acknowledgement_induction","employee_payroll_form","aadhaarCard","panCard","dlUrl","currentAddressProof","permanentAddressProof","educationalProofs","previousEmploymentLetter","agreement","employee_payroll_form_signed","acknowledgment_induction_signed","employee_information_form","form_2","form_11","form_ESI","form_f","appointment_letter","code_of_conduct_doc","employee_information_form_signed","form_2_signed","form_11_signed","form_ESI_signed","form_f_signed","appointment_letter_signed","code_of_conduct_doc_signed","employee_payroll_form_signed"]

        counter = 1
        
        for empcode, new_empcode in data.items():
            try:
                logger.info("COUNTER : {0} ITEM : {1} STARTED.".format(str(counter),str(empcode)))
                with transaction.atomic():
                    #Connection set to from tenant
                    connection.set_tenant(Organisation.objects.get(schema_name="ezedox_" + org_from))
                    
                    # Get Entity data
                    entity = OrganisationEntityMasterData.objects.get(entity_data__employeeCode=empcode)
                    data_from_org = OrganisationEntityMasterDataSerializer(entity).data.copy()
                    file_mapping = {}
                    file_length = {}
                    for file_var in data_from_org["entity_data"].keys():
                        if type(data_from_org["entity_data"][file_var]) == list and len(data_from_org["entity_data"][file_var])>0 and "url" in data_from_org["entity_data"][file_var][0]:
                            file_length[file_var] = len(data_from_org["entity_data"][file_var])
                            for file_var_item in data_from_org["entity_data"][file_var]:
                                file_mapping[file_var_item["url"].split('/')[-1]] = file_var
                    files = list(OrganisationFile.objects.filter(entity_id=entity.id).values("id","name","file","file_label","content_type","doc_type","tags__name"))

                    # Update EmployeeCode
                    data_from_org["entity_data"]["old_employeeCode"] = str(empcode)
                    data_from_org["entity_data"]["employeeCode"] = str(new_empcode)
                    data_from_org["entity_model"] = destination_entity_model

                    #connection set to TO tenant
                    connection.set_tenant(Organisation.objects.get(schema_name="ezedox_" + org_to))

                    #Writing Entity data
                    if OrganisationEntityMasterData.objects.filter(entity_data__employeeCode=new_empcode).exists():
                        logger.info("COUNTER : {0} ITEM(old empcode) : {1} ALREADY EXISTS.".format(str(counter),str(empcode)))
                        continue
                    serializer = UpdateDataSerializer(data=data_from_org)
                    if serializer.is_valid() == True:
                        result = serializer.save()
                        logger.info(result)
                        result_entity_data = OrganisationEntityMasterDataSerializer(result).data["entity_data"].copy()
                        for file_item in files:
                            try:
                                #Copy file in S3
                                spilt_old_file_key = file_item["file"].split("/")
                                new_file_key = "ezedox_" + org_to + "/entity_id_" + str(result.id) + "/" + spilt_old_file_key[2] + "/" + spilt_old_file_key[3]
                                storage_utils.copy_file(
                                    None,
                                    get_default_bucket(),
                                    'files/' + new_file_key,
                                    copy_source=get_default_bucket() +'/files/' + file_item["file"]
                                )

                                #create File object in Destination Tenant
                                file_upload = OrganisationFile.objects.create(
                                    name = file_item["name"],
                                    file_label = file_item["file_label"],
                                    content_type = file_item["content_type"],
                                    file = new_file_key,
                                    doc_type = file_item["doc_type"],
                                    entity_id=result.id
                                )
                                file_key = file_mapping[str(file_item["id"])]
                                result_entity_data[file_key][file_length[file_key] - 1]["url"] = destination_file_path + str(file_upload.id)
                                result_entity_data[file_key][file_length[file_key] - 1]["data"]["url"] = destination_file_path + str(file_upload.id)
                                file_length[file_key] = file_length[file_key] - 1
                                file_upload.tags.add(file_item["tags__name"])
                            except Exception as e:
                                logger.exception("File transferred failed")
                                logger.exception(e)
                        result.entity_data = result_entity_data
                        result.save()
                        logger.info("File Operation Successful.")
                    
                     #Connection set to from tenant
                    connection.set_tenant(Organisation.objects.get(schema_name="ezedox_" + org_from))
                    entity = OrganisationEntityMasterData.objects.get(entity_data__employeeCode=empcode)
                    entity.delete()                    
                logger.info("COUNTER : {0} ITEM : {1} DONE.".format(str(counter),str(empcode)))
            except Exception as e:
                logger.exception(e)
                logger.info("Unexpected error occcured for {0} - {1}".format(empcode,e))
                logger.info("COUNTER : {0} ITEM : {1} FAILED.".format(str(counter),str(empcode)))
            counter = counter + 1
        logger.info("Operation Successful.")
    except Exception as e:
        logger.exception(e)
        logger.info("Unexpected error occcured - {0}".format(e))