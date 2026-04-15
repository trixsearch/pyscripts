import requests
import json
import process_engine
from utils.loggerwrapper import Logger
from apps.org_users.models import OrganisationUser
from utils.process_engine_proxy import call
from ezedox.celery import app
from ezedox.settings import DJANGO_ADMIN_DOMAIN_URL
logger = Logger('__name__')

def get_headers():
    headers = {
        'Content-Type': 'application/json',
    }
    return headers

def send_notification_api(data, tenantId):
    if tenantId:
        url = "https://"+DJANGO_ADMIN_DOMAIN_URL+"/cw/"+ str(tenantId) +"/apps/send_notification"
        headers = get_headers()
        payload = json.dumps({'payload': data})
        response = requests.request('POST', url, data=payload,headers=headers)
        if response.status_code == 200:
            logger.info("Success Sending Notification..")
        else:
            logger.info("Failed Sending Notification..")

@app.task(bind=True, name="setup_daily_task_reminder")
def daily_task_report(self):
    try:
        logger.info("Daily Task Reminder CRON Running")
        users = OrganisationUser.objects.all()
        for user in users:
            req_body_historic = {}
            req_body_historic['task_assignee'] = user.email
            req_body_historic['finished'] = "true"
            historic =  call(module=process_engine.HistoryTaskApi,func= process_engine.HistoryTaskApi.list_historic_task_instances,data=req_body_historic,type="get", tenant_id=str(user.tenant_id))
            req_body_active = {}
            req_body_active['assignee'] = user.email
            active =  call(module=process_engine.TasksApi,func= process_engine.TasksApi.list_tasks,data=req_body_active, tenant_id=str(user.tenant_id), type="get")
            data = {
                "type":"EMAIL",
                "templateId":"USER_SUMMARY",
                "subject":'User specific summary',
                "taskPending":active[0]['total'],
                "taskDone":historic[0]['total'],
                "vendorUsers": user.email,
                "email":[user.email],
                "taskGroup":"Task"
            }
            send_notification_api(data, user.tenant_id)
        return {}
    except Exception as error:
        logger.exception(str(error))
        return {}

# schedule, created = IntervalSchedule.objects.get_or_create(
#     every=1,
#     period=IntervalSchedule.MINUTES,
# )

# # Periodic Tasks
# PeriodicTask.objects.get_or_create(interval=schedule,name='Daily Interview Reminder Tasks(D-1)',task='setup_daily_interview_reminder_next_day')
# PeriodicTask.objects.get_or_create(interval=schedule,name='Daily Interview Reminder Tasks',task='setup_daily_interview_reminder')
# PeriodicTask.objects.get_or_create(interval=schedule,name='Daily Joining Reminder Tasks',task='setup_daily_joining_reminder')
# PeriodicTask.objects.get_or_create(interval=schedule,name='Daily Task Reminder Tasks',task='setup_daily_task_reminder')