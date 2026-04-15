import json
import requests
from enum import Enum
from kafka import KafkaConsumer

from kafka_utils import get_env_value, get_logger, get_phone_number

logger = get_logger("domain_updates.log")

consumer = KafkaConsumer('{}-domain-updates'.format(get_env_value('ENV')),
                         group_id='cw_emp_sync_group',
                         bootstrap_servers=get_env_value('KAFKA_BROKERS'),
                         enable_auto_commit=True,
                         auto_offset_reset='earliest',
                         )


class UserHandler:
    @staticmethod
    def handle_platform_user(data, is_delete=False):
        try:
            url = "{}/cw/{}/users/org_users/platform_user_sync".format(get_env_value('BACKEND_DOMAIN_URL'),data['tenant'])
            if is_delete is True:
                url = url + "?delete=true"
            payload = json.dumps(data)
            headers = {"Content-Type": "application/json"}
            response = requests.request('POST', url, data=payload, headers=headers, verify=get_env_value('SSL_VERIFICATION') == 'True')
            return response
        except Exception as e:
            logger.exception(
                "Unexpected error occurred while handling application update event - {0}".format(e))

    @staticmethod
    def format_to_cw_user(employee):
        try:
            cw_user = {
                "employee_id": employee.get("empId") or "",
                "first_name": employee.get("firstName") or "",
                "last_name": employee.get("lastName") or "",
                "email": employee.get("email") or "",
                "tenant": employee.get("orgId") or None,
                "mobile":  get_phone_number(employee.get("mobileNumber") or None),
                "userId": employee.get("userId"),
                "is_superuser" :  True if employee.get("userGroup", "")  == "SUPER_ADMIN" and employee.get("isActive") else False
            }
            return cw_user
        except Exception as e:
            logger.info(
                "Unexpected error format_to_cw_user - {0}".format(e))
            return None


class PlatformEmpDomainName(Enum):
    USER = 'USER'
    EMPLOYEE = 'EMPLOYEE'


class PlatformEmpDomainAction(Enum):
    CREATE = 'CREATE'
    UPDATE = 'UPDATE'
    DELETE = 'DELETE'


print("Listening to Domain Updates kafka events...")
for msg in consumer:
    try:
        try:
            value = json.loads(msg.value)
            logger.info("Action : " + value["action"])
            logger.info("domainName : " + value["domainName"])
            user_sync = False 
            if value["domainName"].upper() == PlatformEmpDomainName.USER.value:
                if value["action"].upper() == PlatformEmpDomainAction.UPDATE.value or value["action"].upper() == PlatformEmpDomainAction.CREATE.value:
                    if "user" in value["data"] and value["data"]["user"]:
                        if "permissions" in value["data"] and value["data"]["permissions"]:
                            for item in value["data"]["permissions"].keys():
                                if item.startswith("CW_SERVICE_"):
                                    user_sync = True
                                    break
                            if user_sync is True:
                                employee_payload = UserHandler.format_to_cw_user(value["data"]["user"])
                                if employee_payload:
                                    response = UserHandler.handle_platform_user(employee_payload)
                                    logger.info(response.status_code)
                                else:
                                    logger.info("Error while generating employee payload")
                if value["action"].upper() == PlatformEmpDomainAction.DELETE.value:
                    if "user" in value["data"] and value["data"]["user"]:
                        UserHandler.handle_platform_user({"userId" : value["data"]["user"]["userId"], "tenant" : value["data"]["user"]["orgId"]}, is_delete=True)
        except Exception as error:
            logger.exception('Error parsing domain update event', str(error))
    except Exception as e:
        logger.exception("Unexpected error occurred while creating domain update event - {0}".format(str(e)))
