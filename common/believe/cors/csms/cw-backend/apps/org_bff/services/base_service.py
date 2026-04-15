import requests
from ezedox.settings import FILE_DOMAIN_URL

class BaseService:
    def __init__(self, base_url, org_id, access_token, retry_attempts=3, logger=None, headers=None):
        self.base_url = base_url
        self.org_id = org_id
        self.authorization = f"Bearer {access_token}" if access_token else None
        self.retry_attempts = retry_attempts
        self.headers = headers
        self.logger = logger

    def invoke(self, endpoint, method, payload=None):

        if payload is None:
            payload = {}
        if self.authorization:
            headers = {
                "Authorization": self.authorization,
                "Content-Type": "application/json",
                "Host": FILE_DOMAIN_URL
            }
        elif self.headers:
            headers = self.headers
        else:
            headers = {
                "Content-Type": "application/json",
                "Host": FILE_DOMAIN_URL
            }
        if self.logger:
            self.logger.info(f"BaseService - {headers} - {endpoint} - {payload}")
        retry = 1
        while retry <= self.retry_attempts:
            try:
                if method == 'POST':
                    response = requests.post(endpoint, headers=headers, json=payload, timeout=60, verify=False)
                elif method == 'PUT':
                    response = requests.put(endpoint, headers=headers, json=payload, timeout=60, verify=False)
                elif method == 'GET':
                    response = requests.get(endpoint, headers=headers, timeout=60, verify=False)
                else:
                    if self.logger:
                        self.logger.error(f'BaseService::Requested method {method} not identified. '
                                          f'Options; [GET, PUT, POST]')
                    return None
                response_data = None
                if response.status_code in [502, 504]:
                    if retry < self.retry_attempts:
                        if self.logger:
                            self.logger.error(f"BaseService::API {endpoint} failed {response.text}. "
                                              f"Attempting retry #{retry} ")
                        retry += 1
                        continue
                elif response.status_code not in [200, 201]:
                    if self.logger:
                        self.logger.error(f"BaseService::API {endpoint} failed {response.text}")
                    response_data = response.text
                else:
                    try:
                        response_data = response.json()
                    except Exception as e:
                        response_data = response.text
                return response.status_code, response_data
            except requests.RequestException as e:
                if retry < self.retry_attempts:
                    if self.logger:
                        self.logger.exception(e)
                        self.logger.error(f"BaseService::API {endpoint} failed to respond properly. "
                                          f"Attempting retry #{retry} ")
                    retry += 1
                    continue
                return 500, {"error": f"Failed to get response from API: {endpoint}"}

        return 500, {"error": f"Failed to get response from API: {endpoint}"}
