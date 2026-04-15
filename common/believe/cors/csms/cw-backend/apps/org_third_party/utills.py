import json
from utils.loggerwrapper import Logger
logger = Logger(__name__)

def get_file_response_obj(file_obj, request_schema, domain_url):
    try:
        var_response = {}
        var_response["originalName"] = file_obj.name
        var_response["type"] = file_obj.content_type
        var_response["name"] = file_obj.name
        var_response["size"] = file_obj.file.size
        var_response["storage"] = "url"
        var_response["url"] = "{0}://{1}{2}".format(request_schema, domain_url, "/api/forms/files/" + str(file_obj.id))
        var_response["data"] = {}
        var_response["data"]["name"] = file_obj.name
        var_response["data"]["form"] = ""
        var_response["data"]["baseUrl"] = ""
        var_response["data"]["size"] = file_obj.file.size
        var_response["data"]["url"] = "{0}://{1}{2}".format(request_schema, domain_url, "/api/forms/files/" + str(file_obj.id))
        var_response["data"]["project"] = ""
        return var_response
    except Exception as error:
        logger.error("failed to create file response object due to: {}".format(str(error)))
        return {}
        