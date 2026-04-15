import uuid, requests
from datetime import datetime

from celery.schedules import crontab
from utils.loggerwrapper import Logger
from ezedox.celery import app
from .communication_kafka import raise_kafka_event
from ezedox.settings import SENDER_EMAIL_ID,COMMUNICATION_SERVICE_TOPIC,DJANGO_ADMIN_DOMAIN_URL

logger = Logger(__name__)


def generate_email_payload(reciever_email, data, subject, templateId, attachments):
    return {
            "product": "CW",
            "eventId": str(uuid.uuid4()),
            "templateId": templateId,
            "message": {
                        "from": SENDER_EMAIL_ID,
                        "to": reciever_email,
                        "subject": subject,
                        "data": data,
                        "attachments": attachments,
                }
            }


def generate_sms_payload(reciever_phone, data, templateId):
    return {
            "product": "HIRE",
            "eventId": str(uuid.uuid4()),
            "templateId": templateId,
            "message": {
                    "phone": str(reciever_phone),
                    "data": data
            }
        }

def send_notification(user_obj, type, subject, templateId, attachments=[]):
    try:
        if type =="EMAIL":
            if user_obj and user_obj['email']:
                logger.info("Raising event for email ...")
                payload = generate_email_payload(user_obj['email'], user_obj, subject, templateId, attachments)
                raise_kafka_event(COMMUNICATION_SERVICE_TOPIC+'-email', payload)
            else:
                logger.info("No email found for given user..")
        if type == "SMS":
            if user_obj and user_obj['phoneNumber']:
                # TODO:- Send synamic data according to template payload
                logger.info("Raising event for sms ...")
                payload = generate_sms_payload(user_obj['phoneNumber'], user_obj, templateId)
                raise_kafka_event(COMMUNICATION_SERVICE_TOPIC+'-sms', payload)
            else:
                logger.info("No phone number found for given user..")
    except Exception as error:
        logger.error("Error occured while sending notification..")



# TODO :- Send notifications to supervisors store supervisors in advance config

def get_headers():
    headers = {
        'Content-Type': 'application/json',
    }
    return headers

# @app.task(bind=True, name="send_cycle_start_alerts")
# def send_cycle_start_alerts(self):
#     logger.info("Inside cycle start alerts..")
#     try:
#         today = datetime.today()
#         filtered_query_set = AdvanceConfig.objects.filter(start_day=today.day)
#         for config in filtered_query_set:
#             logger.info("Sending cycle start alerts..")
#             tenant = str(config.orgId.id)
#             url = "http://"+DJANGO_ADMIN_DOMAIN_URL+"/ewa/"+tenant+"/advanceConfig/email_alerts"
#             response = requests.request('POST', url, data={},headers=get_headers())
#             if response.status_code == 200:
#                 logger.info("Success Sending Email..")
#             else:
#                 logger.info("Failed Sending Email..")
#     except Exception as error:
#         logger.error("Error occured while sending start cycle alerts..")


# @app.on_after_configure.connect
# def setup_periodic_tasks(sender, **kwargs):

#     #IN UTC FORMAT
#     HOURS = 11
#     MINUTES = 0

#     # runs everyday at 5:30 AM IST
#     sender.add_periodic_task(crontab(hour=HOURS, minute=MINUTES), send_cycle_start_alerts.s(), name='send_email_test')