import logging, uuid, requests, process_engine, json
from datetime import datetime
from datetime import date
from dateutil.relativedelta import relativedelta
from requests.auth import HTTPBasicAuth

from celery import shared_task

from django.db.models import Q

from ezedox.celery import app
from ezedox.settings import PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD, PROCESS_ENGINE_URL
from apps.org_apps.utils_urls import GET_TASK
from apps.org_users.models import ExternalUser
from apps.organisations.models import OrganisationLicense
from apps.org_config.models import ProcessInstanceCleanupLog, ProcessInstanceCleanupConfig
from utils.process_engine_proxy import call
from .flowable import get_process_id

logger = logging.getLogger(__name__)

def replace_newlines(data):
    try:
        if isinstance(data, dict):
            return {key: replace_newlines(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [replace_newlines(element) for element in data]
        elif isinstance(data, str):
            return data.replace('\r\n', ' ').replace('\n', ' ').replace('\xa0', ' ').replace('\t', '')
        else:
            return data
    except Exception:
        return data


@app.task(bind=True, name="delete_external_user")
def delete_external_user(self,engine_url, processInstanceId):
    try:
        req_body = {}
        req_body["variableName"] = "entity_email"
        req_body["processInstanceId"] = processInstanceId
        email_data = requests.get(engine_url, auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), params = req_body, headers={"Content-Type" : "application/json"})
        req_body["variableName"] = "entity_phone_number"
        phonenumber_data = requests.get(engine_url, auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), params = req_body, headers={"Content-Type" : "application/json"})
        email = email_data.json()["data"][0]["variable"]["value"]
        phonenumber = phonenumber_data.json()["data"][0]["variable"]["value"]
        if phonenumber and email:
            user = ExternalUser.objects.filter(Q(mobile = phonenumber) & Q(email__iexact = email))
            if user.exists():
                user.delete()
                logger.info("External User deleted Successfully")
            else:
                logger.info("External user doesn't exist")
        elif phonenumber and not email:
            user = ExternalUser.objects.filter(mobile = phonenumber)
            if user.exists():
                user.delete()
                logger.info("External User deleted Successfully")
            else:
                logger.info("External user doesn't exist")
        else:
            logger.info("External user doesn't exist")
    except Exception as e:
        logger.exception(e)


def task_variable_update(request,task_update_data,form):
    variables = []
    for i in task_update_data['data'].keys():
        if  i == 'e_tag':
            if  request.method == "POST" or request.method == "PUT":
                logger.info("e_tag is  = {}".format(task_update_data['data'][i]))
                task_update_data['data'][i] = str(uuid.uuid1())
                logger.info("e_tag is updated = {}".format(task_update_data['data'][i]))
                variables.append({
                    "name": i,
                    "value": replace_newlines(task_update_data['data'][i])
                })

        elif isinstance(task_update_data['data'][i], (dict,list)):
            variables.append({
                    "name": i,
                    "type" : "json",
                    "value": replace_newlines(task_update_data['data'][i])
                })
        elif i in form and form[i] == 'date':
            value = replace_newlines(task_update_data['data'][i])
            date_str = None
            if task_update_data['data'][i]:
                date_obj = datetime.strptime(value, '%d %b %Y')
                date_str = date_obj.isoformat() + "Z"
            variables.append({
                "name": i,
                "type" : "date",
                "value": date_str
            })
        else:
            variables.append({
                    "name": i,
                    "value": replace_newlines(task_update_data['data'][i])
                })
    return  variables


def task_existance_check(request,task_id, tenant):
    try:
        engine_url = OrganisationLicense.objects.get(organisation=tenant).processengine
        url = GET_TASK.format(engine_url,task_id)
        action = requests.request("GET", url, auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD),headers={"Content-Type" : "application/json"}, verify=False)
        return action
    except Exception as e:
        logger.exception(e)

@app.task(bind=True, name="bulk_task_reassign")
def bulk_task_reassign(self, from_assignee, to_assignee, tenant):
    try:
        req_body = {}
        req_body["include_process_variables"]  = False
        req_body["assignee"] = from_assignee
        req_body["size"] = 100
        response_context, response_status = call(module=process_engine.TasksApi, func=process_engine.TasksApi.list_tasks, data=req_body, tenant_id=tenant, type="get")
        if response_context["total"] > 100:
            req_body["size"] = response_context["total"]
            response_context, response_status = call(module=process_engine.TasksApi, func=process_engine.TasksApi.list_tasks, data=req_body, tenant_id=tenant, type="get")
        for item in response_context["data"]:
            flowable_data = {}
            flowable_data["assignee"] = to_assignee
            proxy_response, proxy_response_status_code = call(module=process_engine.TasksApi, func=process_engine.TasksApi.update_task, data={"task_id": item["id"], "body": flowable_data}, tenant_id=tenant, type="put")
    except Exception as e:
        logger.exception(e)

@shared_task(name="process_instance_history_cleanup", time_limit=60*60*6)
def process_instance_history_cleanup():
    logger.info("Daily process_instance_history_cleanup Received")
    CleanupConfig =  ProcessInstanceCleanupConfig.objects.first()
    batch_limit = CleanupConfig.batch_limit if CleanupConfig and CleanupConfig.batch_limit else 150000
    batch_size = CleanupConfig.batch_size if CleanupConfig and CleanupConfig.batch_size else 100
    cleanup_after_days = CleanupConfig.cleanup_after_days if CleanupConfig and CleanupConfig.cleanup_after_days else 30
    cleanup_date = date.today() - relativedelta(days=cleanup_after_days)
    cleanup_date_str = cleanup_date.strftime("%Y-%m-%d")
    url = PROCESS_ENGINE_URL + "service/history/historic-process-instances/delete"
    while batch_limit > 0:
        process_inst_list = get_process_id(process_key=None, start=0, size=batch_size, tenant=None, from_date=None, to_date=cleanup_date_str, count=False)
        if len(process_inst_list) == 0:
            break
        cleanup_obj = ProcessInstanceCleanupLog.objects.create(total_process_instances = len(process_inst_list))
        payload = json.dumps({
            "action": "delete",
            "instanceIds": process_inst_list,
            "deleteReason": "Daily History Cleanup"
        })
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }

        response = requests.request("POST", url, auth=HTTPBasicAuth(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), headers=headers, data=payload, verify=False)
        cleanup_obj.end_time = datetime.now()
        cleanup_obj.status_code = response.status_code
        if response.status_code != 204:
            cleanup_obj.failure = len(process_inst_list)
            cleanup_obj.failure_process_instance = {"instanceIds": process_inst_list}
            cleanup_obj.failure_text = response.text
        cleanup_obj.save()
        logger.info("Daily process_instance_history_cleanup Response")
        logger.info(response.status_code)
        batch_limit = batch_limit - len(process_inst_list)
    logger.info("Daily process_instance_history_cleanup Ended")


@shared_task(name="cleanup_process_instance_cleanup_logs")
def cleanup_process_instance_cleanup_logs():
    logger.info("cleanup_process_instance_cleanup_logs started")
    cutoff = datetime.now() - relativedelta(days=15)
    deleted_count, _ = ProcessInstanceCleanupLog.objects.filter(start_time__lt=cutoff).delete()
    logger.info(f"cleanup_process_instance_cleanup_logs deleted {deleted_count} records older than 15 days")