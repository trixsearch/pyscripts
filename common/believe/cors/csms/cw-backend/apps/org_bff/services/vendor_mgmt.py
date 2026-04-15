import requests
from .base_service import BaseService
from ezedox.settings import FILE_DOMAIN_URL

class VendorMgmtService(BaseService):
    
    def __init__(self, base_url, org_id, access_token,logger=None):
        self.base_url = base_url
        self.org_id = org_id
        self.authorization = f"Bearer {access_token}"
        super().__init__(base_url, org_id, access_token, logger=logger)

    def get_vendor_by_vendorcode(self, vendor_code):
        endpoint = f"{self.base_url}/api/vendor-mgmt-service/org/{self.org_id}/vendor-codes?vendorCodes={vendor_code}"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data
        
    def get_workorders_for_vendor(self, vendor_id):
        endpoint = f"{self.base_url}/api/vendor-mgmt-service/org/{self.org_id}/vendor/{vendor_id}/work-orders"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data
    
    def get_workorders(self, work_order_id):
        endpoint = f"{self.base_url}/api/vendor-mgmt-service/org/{self.org_id}/work-orders/{work_order_id}"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data
    
    def get_vendor_data(self):
        endpoint = f"{self.base_url}/api/vendor-mgmt-service/org/{self.org_id}/work-orders?limit=50000"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data

    def get_license_doctype(self):
        endpoint = f"{self.base_url}/api/vendor-mgmt-service/org/{self.org_id}/vendor/document-configs"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data
        
    def get_doctype_identifiers(self):
        endpoint = f"{self.base_url}/api/vendor-mgmt-service/org/{self.org_id}/vendor/document-configs"
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data
        
    def post_document(self, vendor_id, doc_type_id, file):
        """post a document to s3 and return the object

        Args:
            vendor_id (str): vendor org UUID
            document_key (str): doc_type keys from the config
            file = {'file': open('vendor.pdf', 'rb')}

        Returns:
            dict: 
        """
        try:
            endpoint = f'{self.base_url}/api/vendor-mgmt-service/org/{self.org_id}/vendor/{vendor_id}/vendor-codes/{doc_type_id}/documents/upload'
            response = requests.post(
                url=endpoint, 
                files=file, 
                headers={"Authorization": self.authorization,"Host": FILE_DOMAIN_URL}
            )
            response_data = response.json()
            return response.status_code, response_data
        except requests.RequestException as e:
            print(f"Error post_document: {e}")
            return 500, {"error": "Internal Server Error"}
    
    def get_vendor_by_pan(self, pan_number):
        endpoint = f'{self.base_url}/api/customer-mgmt/org/search?docNumber={pan_number}'
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data
        

    def get_vendor_by_name(self, vendor_name):
        endpoint = f'{self.base_url}/api/customer-mgmt/org/search?key={vendor_name}'
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data

    def create_vendor_org(self, payload):
        endpoint = f'{self.base_url}/api/customer-mgmt/org'
        status_code, response_data = self.invoke(endpoint, 'POST', payload)
        return status_code, response_data
    
    def map_vendor_to_client(self, payload):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{self.org_id}/vendor"
        status_code, response_data = self.invoke(endpoint, 'POST', payload)
        return status_code, response_data
        
    def approve_vendor_for_client(self, vendor_id, payload):
        endpoint = f"{self.base_url}/api/customer-mgmt/org/{vendor_id}/client/{self.org_id}"
        status_code, response_data = self.invoke(endpoint, 'PUT', payload)
        return status_code, response_data

    def create_vendor_code_for_vendor(self, vendor_id, payload):
        endpoint = f'{self.base_url}/api/vendor-mgmt-service/org/{self.org_id}/vendor/{vendor_id}/vendor-codes'
        status_code, response_data = self.invoke(endpoint, 'POST', payload)
        return status_code, response_data
        
    def get_all_work_orders_for_vendor(self, vendor_id):
        endpoint = f'{self.base_url}/api/vendor-mgmt-service/org/{self.org_id}/vendor/{vendor_id}/work-orders?limit=10000'
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data

    def get_work_order_details(self, work_order_id):
        endpoint = f'{self.base_url}/api/vendor-mgmt-service/org/{self.org_id}/work-orders/{work_order_id}'
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data
    
    def create_work_order_for_vendor(self, vendor_id, payload):
        endpoint = f'{self.base_url}/api/vendor-mgmt-service/org/{self.org_id}/vendor/{vendor_id}/work-orders'
        status_code, response_data = self.invoke(endpoint, 'POST', payload)
        return status_code, response_data
    
    def create_document_for_vendor_code(self, vendor_id, vendor_code_id, payload):
        endpoint = f'{self.base_url}/api/vendor-mgmt-service/org/{self.org_id}/vendor/{vendor_id}/vendor-codes/{vendor_code_id}/documents'
        status_code, response_data = self.invoke(endpoint, 'POST', payload)
        return status_code, response_data
    
    def get_all_vendor_code_by_vendor_id(self, vendor_id):
        endpoint = f'{self.base_url}/api/vendor-mgmt-service/org/{self.org_id}/vendor/{vendor_id}/vendor-codes'
        status_code, response_data = self.invoke(endpoint, 'GET', None)
        return status_code, response_data
        
    def update_vendorcode(self, vendor_uuid, vendorcode_id, payload):
        endpoint = f"{self.base_url}/api/vendor-mgmt-service/org/{self.org_id}/vendor/{vendor_uuid}/vendor-codes/{vendorcode_id}"
        status_code, response_data = self.invoke(endpoint, 'PUT', payload)
        return status_code, response_data

    
