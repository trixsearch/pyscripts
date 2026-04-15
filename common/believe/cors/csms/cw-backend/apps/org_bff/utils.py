import json, requests

from ezedox.settings import PLATFORM_BASE_URL, PLATFORM_INTERNAL_TOKEN, FILE_DOMAIN_URL
from ezedox.celery import app
from utils.loggerwrapper import Logger

logger = Logger(__name__)


def get_absent_employee_list(absent_days, tenant_id, status, employee_type):
    url = PLATFORM_BASE_URL + "/api/attendance-service/org/" + tenant_id + "/absent-employee-list-paginated"

    params = {
        "status": json.dumps(status),
        "numberOfDays": absent_days,
        "employeeType": employee_type
    }
    is_count_params = params.copy()
    is_count_params["isCount"] = True

    headers = {
        "Authorization": "Bearer " + PLATFORM_INTERNAL_TOKEN,
        "Host": FILE_DOMAIN_URL
    }
    list_of_uuids = []
    is_count_response = requests.request("GET", url, params=is_count_params, headers=headers, verify=False)
    logger.info(is_count_response.status_code)
    logger.info(is_count_response.text)
    logger.info(is_count_response.url)
    if is_count_response.status_code == 200:
        error_message = None
        status_code = 200
        get_emp_params = params.copy()
        get_emp_params["limit"] = 2000
        page_number = 1
        get_emp_params["pageNumber"] = page_number
        count = is_count_response.json()[0]["employeeCount"]
        while count > 0:
            get_emp_response = requests.request("GET", url, params=get_emp_params, headers=headers, verify=False)
            if get_emp_response.status_code == 200:
                for item in get_emp_response.json():
                    list_of_uuids.append(item["empId"])
            else:
                error_message = get_emp_response.text
                status_code = get_emp_response.status_code
                break
            count = count - 1000
            page_number = page_number + 1
            get_emp_params["pageNumber"] = page_number
    else:
        status_code = is_count_response.status_code
        error_message = is_count_response.text
    response = {
        "list_of_uuids": list_of_uuids,
        "status": status_code,
        "error_message": error_message
    }
    return response


@app.task(bind=True, name="update_platform_status_async")
def update_platform_status_async(self, absent_days, tenant_id, status, employee_type):
    try:
        response = get_absent_employee_list(absent_days, tenant_id, status, employee_type)
        if response["status"] == 200:
            for item in response["list_of_uuids"]:
                pass  # TODO Update Status
        else:
            logger.info("Response Status Code for absent_employee_list :" + response.status)
    except Exception as error:
        logger.exception(error)
