from utils.loggerwrapper import Logger
from utils.process_engine_proxy import call
import process_engine
from apps.organisations.models import Organisation
logger = Logger(__name__)


def is_process_completed(pid, tenant_id):
    try:
        req_body = {
            'processInstanceId': pid,
        }
        process_data, response_code = call(module = process_engine.QueryApi,
                            func = process_engine.QueryApi.query_historic_process_instance,
                            data=req_body,
                            tenant_id= tenant_id,
                            type="post")
        if response_code < 300:
            return not not process_data["data"][0]['endTime']
        return False
    except Exception as e:
        logger.exception(str(e))
        return False

def get_tenant_model():
    return Organisation

def get_phone_number(mobile):
    mobile_number = None
    if mobile == "#":
        return mobile_number
    if mobile is not None:
        if len(mobile) == 10:
            mobile_number = "+91" + mobile
        else:
            mobile_number = mobile
    return mobile_number