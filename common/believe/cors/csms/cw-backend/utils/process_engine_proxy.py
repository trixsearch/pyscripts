import json
import time
import process_engine

from http import HTTPStatus
from apps.organisations.models import OrganisationLicense
from utils.loggerwrapper import Logger
from ezedox.settings import PROCESS_ENGINE_PASSWORD, PROCESS_ENGINE_USER
from process_engine.rest import ApiException

logger = Logger(__name__)


class ResponseFailedException(Exception):
    pass


def call(**kwargs):
    user_email = None
    response_data = dict()
    response = None
    try:
        if "user_email" in kwargs:
            user_email = kwargs.get("user_email")
        else:
            user_email = kwargs["request"].user.email if "request" in kwargs and \
                                                         hasattr(kwargs["request"].user, 'email') else "AnonymousUser"
        start = time.time()
        tenant_id = kwargs["tenant_id"]
        method_type = kwargs["type"]
        logger.info("{} requested for process engine api" .format(user_email))

        if tenant_id is not None:
            org_license  = OrganisationLicense.objects.get(organisation=tenant_id)
            engine_url = org_license.processengine
            if 'read_replica' in kwargs and kwargs['read_replica'] is True:
                if org_license.processengine_read_replica is not None:
                    engine_url = org_license.processengine_read_replica
            configuration = process_engine.Configuration()
            configuration.username = PROCESS_ENGINE_USER
            configuration.password = PROCESS_ENGINE_PASSWORD
            configuration.host = engine_url + "service"
            url = kwargs["module"](process_engine.ApiClient(configuration))
            req_data = {}
            if "data" in kwargs:
                req_data = kwargs["data"]
            if method_type == "post":
                if "tenant" not in kwargs:
                    req_data["tenantId"] = tenant_id
                if "id" in kwargs:
                    req_id = kwargs["id"]
                    response = kwargs["func"](url, **req_id, body=req_data, _preload_content=False)
                else:
                    response = kwargs["func"](url, body=req_data, _preload_content=False)
            elif method_type == "get":
                req_data["tenant_id"] = tenant_id
                response = kwargs["func"](url, **req_data, _preload_content=False)
            elif method_type in ["put", "delete"]:
                response = kwargs["func"](url, **req_data, _preload_content=False)
            if "content_type" not in kwargs:
                if method_type != "delete":
                    try:
                        response_data = json.loads(response.data.decode('utf-8'))
                    except Exception as err:
                        response_data = response.data.decode('utf-8')
            else:
                response_data = response
            response_status = response.status
            if response_status < 300:
                logger.info("{}, process engine data {} successfully".format(user_email, method_type))
            else:
                logger.error("{}, Failed to {} process engine data".format(user_email, method_type))
        else:
            logger.error("{},Failed to {} process engine data, No tenant found ".format(user_email, method_type))
            raise ResponseFailedException("Failed to {} process engine data, No tenant passed".format(method_type))
        logger.info("Response time: {0:.0f} ms".format((time.time() - start)*1000))
        return response_data, response_status
    except ResponseFailedException as error:
        logger.exception("{}, Failed to get process engine data Due to response failed exception: {}".
                         format(user_email, str(error)))
        return error, HTTPStatus.INTERNAL_SERVER_ERROR
    except ApiException as error:
        try:
            response_data = json.loads(error.body.decode('utf-8'))
        except Exception as err:
            response_data = error.body.decode('utf-8')
        if error.status != HTTPStatus.NOT_FOUND:
            logger.exception('{}, Failed to get process engine data Due to {}'.format(user_email, str(response_data)))
        return response_data, error.status
    except Exception as error:
        logger.exception('{}, Failed to get process engine data Due to exception: {}'.format(user_email, str(error)))
        return error, HTTPStatus.INTERNAL_SERVER_ERROR


# Note:
# 1.Flowable ignores TenantId for all GET calls having an ID in the URL.
# 2.POST /runtime/process-instance: this post call dosen't allow to pass TanantId with processDefinitionId.
