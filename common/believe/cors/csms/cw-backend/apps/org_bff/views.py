import json, process_engine
from urllib.parse import urlparse, urlencode, urlunparse, parse_qsl

import requests
from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status, viewsets

from utils.loggerwrapper import Logger

from .services.employee_mgmt import EmployeeMgmtService
from .services.customer_mgmt import CustomerMgmtService
from .services.vendor_mgmt import VendorMgmtService
from .services.base_service import BaseService
from utils.serializers import EmptySerializer
from ezedox.settings import PLATFORM_BASE_URL, PLATFORM_INTERNAL_TOKEN, CW_BASE_URL, HIGH_PRIORITY_TASK
from utils.process_engine_proxy import call
from .utils import get_absent_employee_list, update_platform_status_async

from apps.proxy_bpm.flowable import get_tasks

logger = Logger(__name__)


class GetEmpViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @staticmethod
    def list(request, tenant):
        try:
            employee_mgmt_service = EmployeeMgmtService(PLATFORM_BASE_URL, tenant, PLATFORM_INTERNAL_TOKEN)
            employee_get_statuscode, employee_get_response = employee_mgmt_service.get_employee_details(
                request.query_params["emp"])
            context = {"success": "True", "message": "Employee Retreived Successfully", "data": employee_get_response}
            return Response(context, status=employee_get_statuscode)
        except Exception as error:
            logger.exception(error)
            context = {'error': error}
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetEmpFlattenedViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request, tenant):
        try:
            logger.info(f"Starting GetEmpFlattenedViewSet list function for tenant: {tenant}")

            # Initialize services
            logger.info("Initializing services for employee, customer, and vendor management.")
            employee_mgmt_service = EmployeeMgmtService(PLATFORM_BASE_URL, tenant, PLATFORM_INTERNAL_TOKEN)
            cust_mgmt_service = CustomerMgmtService(PLATFORM_BASE_URL, tenant, PLATFORM_INTERNAL_TOKEN)
            vendor_mgmt_service = VendorMgmtService(PLATFORM_BASE_URL, tenant, PLATFORM_INTERNAL_TOKEN)

            # Predefined keys and projection fields
            keys_to_pop = ['employeeIdMetaData', 'shared_tags', 'tagAssignment', 'addresses', 'deploymentStatus', 'familyRefs']
            default_projection = ['vendor', 'tag', 'gate', 'workskill', 'manager']

            # Helper function to flatten tags
            def flatten_tag(uuid, category):
                flattened = {}
                if not uuid:
                    logger.warning(f"Missing UUID for tag in category {category}")
                    return flattened
                logger.info(f"Fetching parent info for tag with UUID: {uuid} in category: {category}")
                tag_status, tag_response = cust_mgmt_service.get_parent_info(uuid, category)
                if tag_status not in [200, 201]:
                    logger.warning(f"Failed to fetch tag parent info for UUID: {uuid} in category: {category}, status: {tag_status}")
                    return flattened

                for parent in tag_response.get('parents', []):
                    flattened[parent['type']] = {'name': parent['name'], 'uuid': parent['uuid']}
                flattened[tag_response['type']] = {
                    'name': tag_response['name'],
                    'uuid': tag_response['uuid'],
                    'attributes': tag_response.get('attributes')
                }
                logger.info(f"Successfully flattened tag for UUID: {uuid} in category: {category}")
                return flattened

            # Parse request parameters
            emp_uuid = request.query_params.get('emp', None)
            org_identifier = request.query_params.get('orgname', 'o2c')
            projection = request.query_params.get('project', default_projection)
            expand_terminate = request.query_params.get('expand_terminate', '0')

            logger.info(f"Request parameters - emp_uuid: {emp_uuid}, org_identifier: {org_identifier}, projection: {projection}, expand_terminate: {expand_terminate}")

            if not emp_uuid:
                logger.error("Employee identifier is missing from the request.")
                return Response({'error': 'employee identifier missing'}, status=status.HTTP_400_BAD_REQUEST)

            # Fetch employee details
            logger.info(f"Fetching employee details for emp_uuid: {emp_uuid}")
            emp_status, emp_response = employee_mgmt_service.get_employee_details(emp_uuid)
            if emp_status not in [200, 201]:
                logger.error(f"Employee not found for emp_uuid: {emp_uuid}")
                return Response({'error': 'employee not found'}, status=status.HTTP_404_NOT_FOUND)

            logger.info(f"Employee details fetched successfully for emp_uuid: {emp_uuid}")

            is_active = emp_response.get('isActive', False)
            if not is_active and expand_terminate != '1':
                logger.info(f"Employee is terminated, expand_terminate is not set. Returning early.")
                return Response({'error': 'employee is terminated and expand_terminate is not set'}, status=status.HTTP_400_BAD_REQUEST)

            # Fetch vendor details if requested
            vendor_details = {}
            if 'vendor' in projection:
                logger.info(f"Fetching vendor details for employee.")
                vendor_details = self._fetch_vendor_details(vendor_mgmt_service, emp_response)

            # Fetch tags: role and location if requested
            role_details, location_details = {}, {}
            if 'tag' in projection:
                logger.info(f"Fetching role and location details for employee.")
                role = emp_response.get('defaultRole')
                location = emp_response.get('defaultLocation')
                role_details = flatten_tag(role, 'functional') if role else {}
                location_details = flatten_tag(location, 'geographical') if location else {}

            # Fetch gates if requested
            gate_details = []
            if 'gate' in projection:
                logger.info(f"Fetching gate details for employee.")
                gates = emp_response.get('Gate', [])
                for gate in gates:
                    gate_info = flatten_tag(gate, 'geographical')
                    if gate_info and "Gate" in gate_info:
                        gate_details.append(gate_info.get("Gate"))

            # Fetch workskill details if requested
            workskill_details = {}
            if 'workskill' in projection:
                logger.info(f"Fetching workskill details for employee.")
                workskill = emp_response.get('workSkill')
                if workskill:
                    workskill_tag_details = flatten_tag(workskill, 'functional')
                    workskill_details = workskill_tag_details.get('Workskill', {})

            # Fetch manager details if requested
            manager_details = {}
            if 'manager' in projection:
                logger.info(f"Fetching manager details for employee.")
                manager_uuid = emp_response.get('reportsTo')
                if manager_uuid:
                    manager_status, manager_response = employee_mgmt_service.get_employee_details(manager_uuid)
                    if manager_status in [200, 201]:
                        manager_details = {k: v for k, v in manager_response.items() if k not in keys_to_pop}

            # Remove unnecessary keys from employee response
            logger.info(f"Removing unnecessary keys from employee response.")
            for key in keys_to_pop:
                emp_response.pop(key, None)

            # Add fetched data to employee response
            logger.info(f"Adding fetched data to employee response.")
            emp_response.update({
                'vendor_details': vendor_details,
                'role_details': role_details,
                'location_details': location_details,
                'gate_details': gate_details,
                'workskill_details': workskill_details,
                'manager_details': manager_details,
            })

            context = {"success": "True", "message": "Employee Retrieved Successfully", "data": emp_response}
            logger.info("Returning final response.")
            return Response(context, status=status.HTTP_200_OK)

        except KeyError as e:
            logger.error(f"KeyError occurred: {str(e)}")
            return Response({'error': 'Invalid response data'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.exception(f"Exception occurred: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _fetch_vendor_details(self, vendor_mgmt_service, emp_response):
        """Fetches vendor details for the employee, handling missing values gracefully and ensuring work orders are always fetched."""
        try:
            logger.info("Fetching vendor details for employee.")
            
            # Get the vendor org ID and vendor code ID
            vendor_org_id = emp_response.get('origin_org')
            vendor_code_id = emp_response.get('vendorCode')
            work_order_id = emp_response.get('workOrderId')

            logger.info(f"Vendor details - vendor_org_id: {vendor_org_id}, vendor_code_id: {vendor_code_id}, work_order_id: {work_order_id}")

            # Initialize an empty vendor details object
            vendor_details = {
                'CLRA': [],
                'WC': [],
                'WO': []  # Work orders will be fetched regardless of vendor_code_id
            }

            # Fetch work orders first, regardless of vendor_code_id
            if work_order_id:
                logger.info(f"Fetching work order details for work_order_id: {work_order_id}")
                workorder_status, workorder_response = vendor_mgmt_service.get_work_order_details(work_order_id)
                if workorder_status in [200, 201] and workorder_response:
                    vendor_details['WO'].append(workorder_response)
                    logger.info(f"Work order details fetched successfully for work_order_id: {work_order_id}")
                else:
                    logger.warning(f"Failed to fetch work orders or response is empty for work_order_id: {work_order_id}")

            # If vendor_code_id is missing, return vendor details with work orders only
            if not vendor_code_id:
                logger.info("Vendor code ID is missing, returning work orders only.")
                return vendor_details

            # Fetch document type identifiers (CLRA Licence, Employee Compensation Policy)
            logger.info("Fetching document type identifiers for vendor.")
            _, doct_response = vendor_mgmt_service.get_doctype_identifiers()
            clra_iden = next((doct['_id'] for doct in doct_response if doct['name'] == "CLRA Licence"), None)
            ecpolicy_iden = next((doct['_id'] for doct in doct_response if doct['name'] == "Employee Compensation Policy"), None)

            if not all([clra_iden, ecpolicy_iden]):
                logger.warning("Document type identifiers for CLRA Licence or Employee Compensation Policy are missing.")

            # Fetch vendor details using the vendor org ID
            logger.info(f"Fetching vendor codes for vendor_org_id: {vendor_org_id}")
            vcode_status, vcode_response = vendor_mgmt_service.get_all_vendor_code_by_vendor_id(vendor_org_id)
            if vcode_status not in [200, 201] or not vcode_response:
                logger.warning("Failed to fetch vendor codes or response is empty.")
            else:
                # Filter the relevant vendor details using vendor_code_id
                vendor_data = next((vendor_code for vendor_code in vcode_response if vendor_code['uuid'] == vendor_code_id), None)
                if vendor_data:
                    logger.info(f"Vendor details found for vendor_code_id: {vendor_code_id}")
                    # Extract CLRA and Employee Compensation Policy documents
                    vendor_details['CLRA'] = [doc for doc in vendor_data.get('documents', []) if doc['documentTypeId'] == clra_iden]
                    vendor_details['WC'] = [doc for doc in vendor_data.get('documents', []) if doc['documentTypeId'] == ecpolicy_iden]
                    # Add vendor code to data
                    vendor_details.update(vendor_data)
                else:
                    logger.warning(f"No vendor details found for vendor code ID: {vendor_code_id}")

            # Return vendor details with fetched or empty values
            return vendor_details

        except Exception as e:
            logger.error(f"Error fetching vendor details: {str(e)}")
            return {
                'CLRA': [],
                'WC': [],
                'WO': []  # Ensure work orders are included even if an error occurs
            }


class PlatformDataViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    serializer_class = EmptySerializer

    @staticmethod
    def post(request, tenant):
        try:
            data = request.data
            url = data["url"]
            body = data["body"]
            method = data["method"]
            source = data["source"]
            service = BaseService(url, tenant, PLATFORM_INTERNAL_TOKEN, logger=logger)
            status_code, response_data = service.invoke(url, method, payload=json.dumps(body))
            return Response(response_data, status=status_code)
        except Exception as error:
            logger.exception(error)
            context = {'error': error}
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GetTaskListViewSet(viewsets.ViewSet):
    """
    ViewSet for getting a filtered task list with specific projection within variables.
    """
    permission_classes = [AllowAny]
    # serializer_class = EmptySerializer
    @staticmethod
    def post(request, tenant):
        try:
            req_body = request.data
            projection = req_body.get('variableProjection', None)
            if not projection:
                return Response({"error": "variableProjection missing"}, status=status.HTTP_400_BAD_REQUEST)
            req_body['includeProcessVariables'] = False
            base_service = BaseService("DUMMY_BASE_URL", "DUMMY", None, retry_attempts=3, logger=logger, headers={})
            status_code, response_data = base_service.invoke(f"{CW_BASE_URL}/cw/{tenant}/proxy-bpm/all-tasks/", method="POST", payload=req_body)
            if status_code not in [200, 201]:
                return Response({"error": "Error fetching the task list"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            list_process_ids = []
            tasks_process_map = {}
            tasks = []
            req_get_body = {}
            req_get_body["includeProcessVariables"] = True
            req_get_body["sort"] = "startTime"
            req_get_body["order"] = "desc"
            if "batch_size" not in req_body:
                batch_size = 300
            else:
                batch_size = req_body["batch_size"]
            Query = process_engine.QueryApi
            query_historic_process = Query.query_historic_process_instance
            for item in response_data['data']['data']:
                list_process_ids.append(item["processInstanceId"])
                tasks_process_map[item["processInstanceId"]] = item["id"]
                if len(list_process_ids) >= batch_size or item == response_data['data']["data"][-1]:
                    req_get_body["processInstanceIds"] = list_process_ids
                    req_get_body["size"] = batch_size
                    action = call(module = Query, func= query_historic_process, data=req_get_body, tenant_id= tenant, type="post")[0]
                    for batch_process in action["data"]:
                        batch_process["processInstanceId"] = batch_process["id"]
                        batch_process["id"] = tasks_process_map[batch_process["processInstanceId"]]
                        variables = batch_process.get('variables', [])
                        variables = [V for V in variables if V['name'] in projection]
                        batch_process['variables'] = variables
                    tasks.extend(action["data"])
                    list_process_ids = []   
            context = {"success": True, "data": tasks, "total" : response_data["data"]["total"]}
            return Response(context, status=200)
        except Exception as error:
            internal_error = 1002
            context = {'error': str(error), 'success': False,
                       "internal_error": internal_error}
            logger.exception(error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GetTasksViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    @staticmethod
    def post(request, tenant):
        try:
            req_body = request.data
            name = req_body.get('nameLike', None)
            order = req_body.get("order",'asc')
            sort = req_body.get("sort",'createTime')
            start = req_body.get('start',0)
            size = req_body.get('size',0)
            process_key = req_body.get('processDefinitionKey', None)
            assignee = req_body.get('assignee', None)
            groups = req_body.get('groups', None)
            completed = req_body.get('completed', False)
            var_body = req_body.get('query_data', [])
            includeProcessVariable = req_body.get('includeProcessVariable', False)
            projection = req_body.get('variableProjection', None)
            result = get_tasks(name, process_key, assignee, groups, start, size, order, sort, tenant, var_body, includeProcessVariable, completed)
            if projection:
                for batch_process in result["data"]:
                    variables = batch_process.get('variables', [])
                    variables = [V for V in variables if V['name'] in projection]
                    batch_process['variables'] = variables
            context = {"success": True, "data": result, "total" : result["total"]}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 1002
            context = {'error': str(error), 'success': False,
                       "internal_error": internal_error}
            logger.exception(error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GetO2CEmpCategoryViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @staticmethod
    def list(request, tenant):
        # todo: put this in utils
        def flatten_tag(uuid, category):
            flattened = {}
            tag_status, tag_reponse = cust_mgmt_service.get_parent_info(uuid, category)
            if tag_status not in [200, 201]:
                return flattened

            for parent in tag_reponse['parents']:
                flattened[parent['type']] = {'name': parent['name'], 'uuid': parent['uuid']}
            flattened[tag_reponse['type']] = {'name': tag_reponse['name'], 'uuid': tag_reponse['uuid'],
                                              'attributes': tag_reponse.get('attributes')}
            return flattened

        employee_mgmt_service = EmployeeMgmtService(PLATFORM_BASE_URL, tenant, PLATFORM_INTERNAL_TOKEN)
        cust_mgmt_service = CustomerMgmtService(PLATFORM_BASE_URL, tenant, PLATFORM_INTERNAL_TOKEN)
        vendor_mgmt_service = VendorMgmtService(PLATFORM_BASE_URL, tenant, PLATFORM_INTERNAL_TOKEN)

        emp_uuid = request.query_params.get('emp', None)
        if not emp_uuid:
            context = {'error': 'employee identifier missing'}
            return Response(context, status=status.HTTP_400_BAD)

        try:
            emp_response = {}
            emp_status, emp_response = employee_mgmt_service.get_employee_details(emp_uuid)

            if emp_status not in [200, 201]:
                raise

            default_location = emp_response.get('defaultLocation')
            print('default_location', default_location)
            location_details = flatten_tag(default_location, 'geographical')
            print('location_details', location_details)

            mfg_site = location_details['Mfg Site']['name']
            print('mfg_site', mfg_site)

            addresses = emp_response.get('addresses')
            state, district, taluka, village = None, None, None, None
            if addresses and len(addresses):
                address = addresses[0]
                state, district, taluka, village = address.get('state', None), address.get('district', None), address.\
                    get('taluka', None), address.get('village', None)

            emp_category = 'D'
            result = cust_mgmt_service.get_root_tags('custom')
            parent = None
            Matches = []
            for tag in result['result']['tagList']:
                if tag['name'] == mfg_site:
                    parent = tag
                    Matches.append(mfg_site)
                    break

            tag_categories = ['State', 'District', 'Taluka', 'Village-Category A']
            tokens = [state, district, taluka, village]
            match_categories = ['C', 'C', 'B', 'A']

            for index, cat in enumerate(tag_categories):
                if not parent or not tokens[index]:
                    break

                result = cust_mgmt_service.get_sub_tags('custom', parent['uuid'])
                for tag in result['result']['tagList']:
                    if tag['name'] == tokens[index]:
                        parent = tag
                        emp_category = match_categories[index]
                        Matches.append(tokens[index])
                        break

            context = {"success": "True", "message": "Employee Retreived Successfully",
                       "data": {'match_category': emp_category, 'matches': Matches}}
            return Response(context, status=200)
        except Exception as error:
            logger.exception(error)
            context = {'error': error}
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProxyViewSet(viewsets.ViewSet):
    """
    A simple ViewSet for proxying requests to external services.
    """
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        # This method will handle POST requests
        logger.info(f"ProxyViewSet - Received Data - {request.data}")
        target_url = request.data.get('url')
        method = request.data.get('method', 'post').upper()
        headers_name = request.data.get('headers_name', None)
        user_base_service_without_retry = request.data.get('user_base_service_without_retry', False)
        # Extract the 'data' key if it's part of the request
        data_to_forward = request.data.get('data', {})
        if not target_url:
            return Response({"error": "URL parameter is missing"}, status=status.HTTP_400_BAD_REQUEST)
        # Encode the URL to handle special characters properly
        target_url = self.encode_url(target_url)
        # Determine which headers to apply
        system_headers = settings.DEFAULT_HEADERS.copy()

        # Get the host from the request
        request_host = request.headers.get('X-Forwarded-Host', request.get_host())
        allowed_hosts_for_cw_headers = settings.ALLOWED_HOST_FOR_CW_HEADERS.copy()

        response = None

        try:
            retry_count = 3
            if user_base_service_without_retry:
                retry_count = 1

            token = None
            logger.info(f"ProxyViewSet - Received Details - {headers_name} - "
                        f"{request_host} - {allowed_hosts_for_cw_headers}")
            if headers_name and request_host in allowed_hosts_for_cw_headers:
                token = system_headers.get(headers_name.upper())
                base_service = BaseService("DUMMY_BASE_URL", "DUMMY", token,
                                           retry_attempts=retry_count, logger=logger)
            elif "headers" in request.data:
                # Retrieve custom headers from the request, if any
                headers = request.data.get("headers", {})
                base_service = BaseService("DUMMY_BASE_URL", "DUMMY", None,
                                           retry_attempts=retry_count, logger=logger, headers=headers)
            elif request.headers:
                headers = dict(request.headers.copy())
                if "Host" in headers:
                    headers.pop("Host")
                if "Content-Length" in headers:
                    headers.pop("Content-Length")
                if "Jwt-Token" in headers:
                    headers.pop("Jwt-Token")
                base_service = BaseService("DUMMY_BASE_URL", "DUMMY", None,
                                           retry_attempts=retry_count, logger=logger, headers=headers)
            else:
                base_service = BaseService("DUMMY_BASE_URL", "DUMMY", None,
                                           retry_attempts=retry_count, logger=logger, headers=None)
            status_code, response = base_service.invoke(target_url, method, payload=data_to_forward)
            return Response(response, status=status_code)
        except requests.exceptions.HTTPError as e:
            # Handle specific HTTP errors if needed, otherwise propagate them
            logger.error(f"ProxyViewSet - HTTP error from external service: {str(e)}")
            # Extract the response body for client, handle cases where the response cannot be decoded as JSON
            error_content = {}
            try:
                error_content = response.json()
            except ValueError:
                error_content = {'error': response.text}
            return Response(error_content, status=response.status_code)
        except requests.exceptions.RequestException as e:
            # Handle other request issues, like network problems
            logger.error(f"ProxyViewSet - Request failed: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @staticmethod
    def encode_url(url):
        """
        Encodes the query parameters of the URL to ensure they are correctly escaped.
        """
        url_parts = urlparse(url)
        query = dict(parse_qsl(url_parts.query))
        query_encoded = urlencode(query)
        url_encoded = urlunparse(
            (
                url_parts.scheme, url_parts.netloc, url_parts.path, url_parts.params, query_encoded,
                url_parts.fragment
            )
        )
        return url_encoded


class AttendanceViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @staticmethod
    def create(request, tenant):
        try:
            data = request.data
            absent_days = data.get("numberOfDays")
            req_status = data.get("req_status")
            employeeType = data.get("employeeType")
            update_platform_status = data.get("update_platform_status", False)
            if update_platform_status is True:
                update_platform_status_async.apply_async(args=[absent_days, tenant, req_status, employeeType],
                                                         priority=HIGH_PRIORITY_TASK)
                context = {"success": True, "data": [], "message": "Request Accepted to Update Employee Status"}
                return Response(context, status=status.HTTP_200_OK)
            response = get_absent_employee_list(absent_days, tenant, req_status, employeeType)
            if response["status"] == 200:
                context = {"success": True, "data": response["list_of_uuids"]}
                return Response(context, status=status.HTTP_200_OK)
            else:
                context = {"success": False, "data": []}
                return Response(context, status=response["status"])
        except Exception as error:
            logger.exception(error)
            context = {'error': error}
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
