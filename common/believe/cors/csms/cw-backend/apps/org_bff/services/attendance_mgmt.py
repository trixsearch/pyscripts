import requests
from ezedox.settings import FILE_DOMAIN_URL

class AttendanceMgmtService:
    def __init__(self, base_url, org_id, access_token):
        self.base_url = base_url
        self.org_id = org_id
        self.authorization = f"Bearer {access_token}"

    def get_shifts_by_site_id(self, site_id):
        endpoint = f"{self.base_url}/api/attendance-service/org/{self.org_id}/site/{site_id}/shift"
        headers = {
            "Authorization": self.authorization,
            "Content-Type": "application/json",
            "Host": FILE_DOMAIN_URL
        }

        try:
            response = requests.get(endpoint, headers=headers)
            response_data = response.json()
            return response.status_code, response_data
        except requests.RequestException as e:
            print(f"Error searching shifts: {e}")
            return 500, {"error": "Internal Server Error"}
        
    def create_attendance_log(self, employee_id, data):
        endpoint = f"{self.base_url}/api/attendance-service/org/{self.org_id}/emp/{employee_id}/edit-logs-reliance"
        headers = {
            "Authorization": self.authorization,
            "Content-Type": "application/json",
            "Host": FILE_DOMAIN_URL
        }

        try:
            response = requests.post(endpoint, headers=headers, json=data)
            response_data = response.json()
            return response.status_code, response_data
        except requests.RequestException as e:
            print(f"Error creating attendance: {e}")
            return 500, {"error": "Internal Server Error"}
        
    def update_log_status(self, log_id, data):
        endpoint = f"{self.base_url}/api/attendance-service/org/{self.org_id}/log-status/update/{log_id}"
        headers = {
            "Authorization": self.authorization,
            "Content-Type": "application/json",
            "Host": FILE_DOMAIN_URL
        }

        try:
            response = requests.post(endpoint, headers=headers, json=data)
            response_data = response.json()
            return response.status_code, response_data
        except requests.RequestException as e:
            print(f"Error updating attendance log: {e}")
            return 500, {"error": "Internal Server Error"}

