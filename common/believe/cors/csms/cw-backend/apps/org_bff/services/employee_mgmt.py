from .base_service import BaseService


class EmployeeMgmtService(BaseService):
    def __init__(self, base_url, org_id, access_token, logger=None):
        super().__init__(base_url, org_id, access_token, logger=logger)

    def search_employee(self, params=None):
        endpoint = f"{self.base_url}/api/employee-mgmt/org/{self.org_id}/employee/search"
        if params:
            endpoint += "?" + "&".join([f"{key}={value}" for key, value in params.items()])
        status_code, response_data = self.invoke(endpoint, 'GET')
        return status_code, response_data

    # TODO : Take Params as Param Dict
    def put_employee_profile(self, uuid, update_payload):
        endpoint = f"{self.base_url}/api/employee-mgmt/org/{self.org_id}/employee/{uuid}?skipWorkFlow=true"
        status_code, response_data = self.invoke(endpoint, 'PUT', update_payload)
        return status_code, response_data

    # TODO : Take Params as Param Dict
    def patch_employee_profile(self, uuid, update_payload):
        endpoint = f"{self.base_url}/api/employee-mgmt/org/{self.org_id}/employee/{uuid}/update?skipWorkFlow=true"
        status_code, response_data = self.invoke(endpoint, 'PUT', update_payload)
        return status_code, response_data

    # TODO : Take Params as Param Dict
    def post_employee_profile(self, update_payload):
        endpoint = f"{self.base_url}/api/employee-mgmt/org/{self.org_id}/employee?skipWorkFlow=true"
        status_code, response_data = self.invoke(endpoint, 'POST', update_payload)
        return status_code, response_data

    def get_employee_details(self, uuid_value):
        endpoint = f"{self.base_url}/api/employee-mgmt/org/{self.org_id}/employee/{uuid_value}"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data

    def get_schema(self):
        endpoint = f"{self.base_url}/api/employee-mgmt/org/{self.org_id}/get-json-schema"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data

    def update_terminated_profile(self, uuid, update_payload):
        endpoint = f"{self.base_url}/api/employee-mgmt/org/{self.org_id}/employee" \
                   f"/{uuid}?updateTerminatedEmp=true&skipWorkFlow=true"
        status_code, response_data = self.invoke(endpoint, 'PUT', update_payload)
        return status_code, response_data

    def raise_domain_update(self, uuid, update_payload):
        endpoint = f"{self.base_url}/api/employee-mgmt/org/{self.org_id}/employee/{uuid}/raise-domain-update"
        status_code, response_data = self.invoke(endpoint, 'POST', update_payload)
        return status_code, response_data

    def get_listing_employee_data(self, update_payload, params=None):
        endpoint = f"{self.base_url}/api/employee-mgmt/org/{self.org_id}/employees"
        if params:
            endpoint += "?" + "&".join([f"{key}={value}" for key, value in params.items()])
        status_code, response_data = self.invoke(endpoint, 'POST', update_payload)
        return status_code, response_data
