from .base_service import BaseService
from ezedox.settings import FILE_DOMAIN_URL

# tag_endpoint = authority+"/customer-mgmt/org/{org_id}/tag?category={category}"
# subtag_endpoint = authority+"/customer-mgmt/org/{org_id}/tag/{parent_tag_id}/subtag?category={category}"
# taglist_endpoint = authority+"/customer-mgmt/org/{org_id}/tags/list?category={category}&type={type}"


class CustomerMgmtService(BaseService):
    def __init__(self, base_url, org_id, access_token, logger=None):
        super().__init__(base_url, org_id, access_token, logger=logger)
        self.headers = {
            "Authorization": self.authorization,
            "Content-Type": "application/json",
            "Host": FILE_DOMAIN_URL
        }

    def search_site(self, search_key):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/tags/" \
                   f"search?category=geographical&key={search_key}"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data
        
    def get_root_tags(self, category):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/tag/masters?category={category}"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        result = {
            "status": status_code,
            "result": response_data
        }
        return result

    def get_sub_tags(self, category, parent):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/tag/{parent}/subtag?category={category}"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        result = {
            "status": status_code,
            "result": response_data
        }
        return result

    def get_tags(self, tagId):
        endpoint = f"{self.base_url}/api/customer-mgmt/tag?tagId={tagId}"
        status_code, response_data = self.invoke(endpoint, 'GET')
        return status_code, response_data

        
    def get_tag_list(self, category, type, params=None):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/tags/list?category={category}&type={type}"
        if params:
            param_str = "&".join([f"{key}={val}" for key,val in params.items()])
            endpoint = f"{endpoint}&{param_str}"

        status_code, response_data = self.invoke(endpoint, 'GET', None)
        result = {'result': response_data, 'status': status_code}
        if status_code not in [200,201]:
            print(f"Error fetching tag list:(get_tag_list) {response_data}")
        return result
        
    def get_tag_list_reduced(self, category):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/client/{self.org_id}/tag?category={category}"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data
        
    def create_tag(self, category, payload):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/tag?category={category}"
        status_code, response_data = self.invoke(endpoint, 'POST', payload)
        result = {
            "status": status_code,
            "result": response_data
        }
        return result

    def create_subtag(self, category, parent, payload):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/tag/{parent}/subtag?category={category}"
        status_code, response_data = self.invoke(endpoint, 'POST', payload)
        result = {
            "status": status_code,
            "result": response_data
        }
        return result

    def search_role(self, search_key):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/tags/" \
                   f"search?category=functional&key={search_key}"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data
        
    def update_tag(self, tag_uuid, category, payload):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/tag/{tag_uuid}?category={category}"
        status_code, response_data = self.invoke(endpoint, 'PUT', payload)
        return status_code, response_data
        
    def terminate_employee(self, payload):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/employee/terminate"
        status_code, response_data = self.invoke(endpoint, 'PUT', payload)
        return status_code, response_data
        
    def get_vendor_details(self, vendor_id):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/vendor/{vendor_id}"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data
        
    def share_tags_with_vendor(self, vendor_org_uuid, category, payload):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/vendor/{vendor_org_uuid}/" \
                   f"share_tags?category={category}"
        status_code, response_data = self.invoke(endpoint, 'POST', payload)
        return status_code, response_data
        
    def share_tags_with_vendor_v2(self, vendor_org_uuid, category, payload):
        endpoint = f"{self.base_url}/api/customer-mgmt/v2/org/{self.org_id}/vendor/{vendor_org_uuid}/" \
                   f"share_tags?category={category}"
        status_code, response_data = self.invoke(endpoint, 'POST', payload)
        return status_code, response_data
        
    def get_vendors(self, params={}):
        from functools import reduce
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/vendor"
        if params:
            param_string = reduce(lambda x, y: str(x)+"="+str(y))
            endpoint = f"{endpoint}?{param_string}"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data

    def fetch_address_details_by_pincode(self, pincode):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/tags/search/internal?" \
                   f"category=address_master&type=Pincode&key={pincode}"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data

    def fetch_cityvillage_details(self, pincode_uuid, params=None):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/tag/{pincode_uuid}/subtag/" \
                   f"internal?category=address_master"
        if params:
            endpoint += "&" + "&".join([f"{key}={value}" for key, value in params.items()])
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data
        
    def get_org_count(self):
        endpoint = f"{self.base_url}/api/customer-mgmt/org?isCount=true"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data
        
    def search_customtag(self, search_key):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/tags/search?category=custom&key={search_key}"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data
    
    def get_vendor_list(self, params=None):
        if params is None:
            params = {}
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/vendors-list"
        if params:
            param_str = "&".join([f"{key}={val}" for key,val in params.items()])
            endpoint = f"{endpoint}?{param_str}"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data
    
    def get_parent_info(self, taguuid, category):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/tag/{taguuid}?category={category}"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data
