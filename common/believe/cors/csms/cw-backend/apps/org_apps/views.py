# Third-Party imports
import base64
import calendar
import io
import json
import uuid
from calendar import monthrange
from datetime import datetime, timedelta
from collections import OrderedDict
from operator import itemgetter
import xlsxwriter
from django.db.models import Q
from requests.auth import HTTPBasicAuth

import requests
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.utils.translation import gettext as _
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets, mixins, filters
from rest_framework.decorators import action
from rest_framework.exceptions import NotAuthenticated, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import filters
from rest_framework_api_key.permissions import HasAPIKey
from collections import OrderedDict
from operator import itemgetter
from rest_framework.exceptions import NotFound

import process_engine
from apps.license.decorators import permission_and_license_required
from apps.org_form.models import OrganisationForm
from apps.org_form.utils import (GetComponentsController,
                                 FormPreviewController,
                                 get_reporting_label, get_label, get_key_type, get_reporting_view, get_nonhidden_label, get_nonhidden_key_type, get_non_hidden_required_labels)
from apps.org_users.utils import get_tenant, password_hash
from apps.organisations.models import OrganisationLicense
from apps.org_group.models import OrganisationGroup
from apps.org_portals.models import Portals
from apps.org_filter.models import OrganisationFilter
from apps.org_filter.serializers import CreateFilterSerializer
from apps.org_users.models import OrganisationUser
from apps.org_config.models import CustomAttribute
from apps.url_shortner.utils import create_short_url_firebase
from apps.org_import.serializers import EntityImportCreateSerializer
from apps.org_import.models import EntityImport
from apps.org_entity.models import OrganisationEntityMasterModel
from apps.proxy_bpm.utils import task_variable_update
from apps.proxy_bpm.flowable import get_tasks
from ezedox.custom_storage import read_sample_bulk_file
from ezedox.settings import (PROCESS_ENGINE_PASSWORD, PROCESS_ENGINE_USER,
                             MEDIUM_PRIORITY_TASK, DEFAULT_SCHEME, HIGH_PRIORITY_TASK)
from utils.serializers import EmptySerializer
# from ezedox.celery import bulk_task_create
from utils.prime_generic_methods import get_custom_field_errors
from utils.loggerwrapper import Logger, getMessage, getLogMessage
from utils.process_engine_proxy import call
from utils.CustomSearch import CustomSearchFilter, get_filter_fields
from utils.communication_alerts import send_notification

from .models import OrganisationWorkflow, ProcessView, WorkflowAccess
from .serializers import (OrganisationWorkflowPortalSerializer,
                          OrganisationWorkflowSerializer, ProcessViewSerializer, WorkflowAccessSerializer)
from .utils import (COMPARISION, bulk_task_create, determine_partition, get_process_key_util,
                    get_uploaded_file, launch_process_util, months, launch_bulk_process_util,
                    get_system_filter_value, get_filter_task_title, process_data, utc_date_conversion, bulk_task_complete)
from .utils_urls import (APP_DEFINITION, DEPLOYMENT_REPOSITORY,
                         GET_PROCESS_DEFINITION,
                         IDM_AUTHENTICATION, IMPORT_APP,
                         MODELER_APP_DEFINITION,
                         PUBLISH_APP)
from .internal_errors import org_apps_errors
from .filters import OrganisationWorkflow__filter_fields, OrganisationWorkflowAccess__filter_fields

# Create your views here.
logger = Logger(__name__)

class OrganisationWorkflowViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationWorkflow
    queryset = OrganisationWorkflow.objects.all()
    serializer_class = OrganisationWorkflowSerializer
    serializer_class_filter = CreateFilterSerializer
    portal_update_serializer_class = OrganisationWorkflowPortalSerializer
    filter_backends = (DjangoFilterBackend,
                       CustomSearchFilter, filters.OrderingFilter,)
    search_fields = OrganisationWorkflow__filter_fields
    filter_fields = get_filter_fields(OrganisationWorkflow__filter_fields)
    ordering_fields = OrganisationWorkflow__filter_fields

    # TODO :  For a normal user and user management this should return list of workflows for which he has access to.
    #  For other user roles it should return all the workflows
    # For external users it should raise an error

    def list(self, request, tenant=None):
        email=get_email(request)
        logger.info("{} request to access to any of your organisation workflows for tenant: {}".format(
            tenant, email))
        try:
            worklow_query_set = self.filter_queryset(self.get_queryset().filter(tenant=tenant))
            if not request.user.is_superuser:
                platform_policies = request.user.platform_policy.all().filter(tenant__id=tenant)
                from_task_page = request.GET.get("from_task_page", "")
                
                if from_task_page:
                    worklowacess_query_set = WorkflowAccess.objects.filter(app__in=worklow_query_set, policy__in=platform_policies, filter_on_task=True).values_list('app', flat=True).distinct()
                else:
                    worklowacess_query_set = WorkflowAccess.objects.filter(app__in=worklow_query_set, policy__in=platform_policies).filter(Q(view=True) | Q(initiate=True) | Q(bulk_initiate=True)).values_list('app', flat=True).distinct()
                access = request.GET.get("access", "")
                if access != "get-all":
                    worklow_query_set = OrganisationWorkflow.objects.filter(id__in=list(worklowacess_query_set))
                
            pagination_data = None
            worklow_query_set = worklow_query_set.order_by('order_id', 'name')
            page = self.paginate_queryset(worklow_query_set)
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(worklow_query_set, many=True)          
            context = {"success": True, "message": _(
                "Organisation Workflow data returned successfully."), "data": serializer.data,  "pagination_data": pagination_data}
            logger.info("{}, Organisation Workflow data returned successfully for tenant: {}.".format(
                tenant, email))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6004
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(tenant, error, email), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(license_required(["org_apps.view_organisationworkflow", ]))
    def retrieve(self, request, pk=None, tenant=None):
        email=get_email(request)
        logger.info("{} request to retrive Organisation Workflow details for id: {} for tenant: {}".format(
            tenant, pk, email))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except PermissionDenied as error:
                internal_error = 6005
                context = {'error': str(error), 'success': False, 'message': _(
                    error.detail), 'internal_error': internal_error}
                logger.error(getMessage(org_apps_errors, internal_error).format(
                    pk, tenant, error, email), internal_error)
                return Response(context, status=status.HTTP_403_FORBIDDEN)
            except NotAuthenticated as error:
                internal_error = 6006
                context = {'error': str(error), 'success': False, 'message': _(
                    error.detail), 'internal_error': internal_error}
                logger.error(getMessage(org_apps_errors, internal_error).format(
                    pk, tenant, error, email), internal_error)
                return Response(context, status=status.HTTP_401_UNAUTHORIZED)
            except Exception as error:
                internal_error = 6007
                context = {'error': str(error), 'success': False, 'message': _(
                    getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    pk, tenant, error, email), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            context = {"request_user": request.user,
                       "request_user_permissions_list": []}

            serializer = self.serializer_class(obj, context=context)
            context = {"success": True, "message": _(
                "Organisation Workflow details retrieved successfully."), "data": serializer.data}
            logger.info("{} Organisation Workflow details retrieved successfully for id: {} for tenant: {}".format(
                pk, tenant, email))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6008
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                pk, tenant, error, email), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], name="list_by_topic")
    def list_by_topic(self, request, pk=None, tenant=None,):
        email = get_email(request)
        logger.info("{} request to access to any of your organisation workflows for tenant: {}".format(
            tenant, email))
        try:
            workflow_id_list = self.model.objects.filter(tenant=tenant, kafka_topic=pk).values_list('pk', flat=True)
            context = {"success": True, "message": _(
                "Organisation Workflow data returned successfully."), "data": workflow_id_list}
            logger.info("{}, Organisation Workflow data returned successfully for tenant: {}.".format(
                tenant, email))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6004
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(tenant, error, email), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_apps.add_organisationworkflow", ]))
    def create(self, request, tenant=None):
        email=get_email(request)
        logger.info("{} sent data to create Organisation Workflow details for tenant: {}.".format(
            email, tenant))
        try:
            # TODO exception handling for Process Engine Calls
            # TODO name,description,icon for workflows
            engine_url = OrganisationLicense.objects.get(
                organisation=request.tenant)
            data = request.data
            app_to_deploy = ""
            req_data = {}

            # Auth for modeler
            url = IDM_AUTHENTICATION.format(engine_url.process_idm)
            user_id = get_tenant(request) + "_" + email
            hashed_password = password_hash(email)
            payload = "j_username=" + base64.b64encode(bytes(user_id, 'utf-8')).decode(
                "utf-8") + "&j_password=" + hashed_password + "&_spring_security_remember_me=true"
            headers = {'Content-Type': "application/x-www-form-urlencoded"}
            response = requests.request(
                "POST", url, data=payload, headers=headers)
            cookie = response.cookies

            if "app_key" in data and data["app_key"]:
                url = MODELER_APP_DEFINITION.format(engine_url.process_modeler)
                payload = {"tenantId": get_tenant(request)}
                response = requests.get(url, data=payload, cookies=cookie)
                # filter depending on tenantId

                for app_data in response.json()["data"]:
                    if app_data["tenantId"] == get_tenant(request) and data["app_key"] == app_data["key"]:
                        app_to_deploy = app_data["id"]

            # publish app
            url = PUBLISH_APP.format(engine_url.process_modeler, app_to_deploy)
            payload = {"comment": ""}
            response = requests.post(url, data=json.dumps(payload), cookies=cookie, headers={
                                     'Content-Type': "application/json"})

            # Get Parent Deployment Id
            url = APP_DEFINITION.format(engine_url.processengine)
            query_params = {}
            query_params["key"] = response.json()["appDefinition"]["key"]
            query_params["tenantId"] = get_tenant(request)
            response_app = requests.get(url, auth=(
                PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), params=query_params)

            # Get Deployment Id
            url = DEPLOYMENT_REPOSITORY.format(engine_url.processengine)
            query_params = {}
            query_params["parentDeploymentId"] = response_app.json()[
                "data"][0]["deploymentId"]
            query_params["tenantId"] = get_tenant(request)
            response_key = requests.get(url, auth=(
                PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), params=query_params)

            # Get Process Definition ID
            url = GET_PROCESS_DEFINITION.format(engine_url.processengine)
            query_params = {}
            query_params["deploymentId"] = response_key.json()["data"][0]["id"]
            response_definition = requests.get(url, auth=(
                PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), params=query_params)

            # Store app definition key
            req_data["process_key"] = response_definition.json()[
                "data"][0]["key"]
            req_data["app_key"] = response.json()["appDefinition"]["key"]

            # Associate this workflow with default Portal
            default_portal = Portals.objects.filter(
                name__istartswith='Welcome').first()
            if default_portal:
                req_data["portal"] = default_portal.id

            # Storing WorkflowRegistry Details in Our DB
            serializer = self.serializer_class(data=req_data)

            if serializer.is_valid():
                serializer.save()

                context = {"success": True, "message": _(
                    "Organisation Workflow deployed successfully."), "data": serializer.data}
                logger.info("{}, Organisation Workflow deployed successfully for tenant: {}.".format(
                    email, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 6009
            context = {'error': get_custom_field_errors(serializer.errors), "success": False, "message": _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.error(getLogMessage(org_apps_errors, internal_error).format(
                email, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 6010
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_apps.change_organisationworkflow", ]))
    def update(self, request, pk=None, tenant=None):
        email=get_email(request)
        logger.info("{} sent data to update workflow details for id: {}".format(
            email, pk))
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 6011
                context = {'error': str(error), 'success': False, 'message': getMessage(
                    org_apps_errors, internal_error), 'internal_error': internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    pk, email, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(
                obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {"success": True, "message": _(
                    "Workflow details updated successfully."), "data": serializer.data}
                logger.info("{}, Workflow details updated successfully for id: {} for tenant: {}".format(
                    email, pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _("Failed to update workflow details.")}
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 6012
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                pk, email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, name='workflow-task-list')
    def user_task_list(self, request, pk=None, tenant=None):
        email=get_email(request)
        logger.info("{} requested Task List in this organisation workflow for id: {} for tenant: {}".format(
            email, pk, tenant))
        try:
            # TODO exception handling for Process Engine Calls
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                context = {'error': str(
                    error), 'success': False, 'message': _('ID not found')}
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            list_task = []
            ProcessDefinitions = process_engine.ProcessDefinitionsApi
            list_process = ProcessDefinitions.list_process_definitions
            req_body = {}
            req_body["latest"] = True
            req_body["key"] = obj.process_key
            action, response_status_code = call(
                module=ProcessDefinitions, func=list_process, data=req_body, tenant_id=tenant, request=request, type="get", read_replica=True)
            if response_status_code > 300:
                internal_error = 6013
                context = {"success": False, "message": _(getMessage(
                    org_apps_errors, internal_error)), "data": action, 'internal_error': internal_error}
                logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                    pk, email, action), internal_error)
                return Response(context, status=response_status_code)
            processDefinitionId = action["data"][0]["id"]
            get_bpmn_model = ProcessDefinitions.get_bpmn_model_resource
            query_params = {}
            query_params['process_definition_id'] = processDefinitionId
            action, response_status_code = call(
                module=ProcessDefinitions, func=get_bpmn_model, data=query_params, tenant_id=tenant, request=request, type="get", read_replica=True)
            if response_status_code > 300:
                internal_error = 6014
                context = {"success": False, "message": _(getMessage(
                    org_apps_errors, internal_error)), "data": action, 'internal_error': internal_error}
                logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                    pk, email, action), internal_error)
                return Response(context, status=response_status_code)
            tasks = action["processes"]
            for task in tasks:
                for flow_element_map in task["flowElementMap"]:
                    if "formKey" in task["flowElementMap"][flow_element_map].keys() and "name" in task["flowElementMap"][flow_element_map].keys() and len(task["flowElementMap"][flow_element_map]["incomingFlows"]) > 0:
                        list_task.append(task["flowElementMap"][flow_element_map]["name"]
                                         if task["flowElementMap"][flow_element_map]["name"] != None else "NONAME")
            list_task = list(set(list_task))
            context = {"success": True, "message": _(
                "User task Lists in this organisation workflow returned successfully."), "data": list_task}
            logger.info("{} User task Lists in this organisation workflow returned successfully for id: {}".format(
                email, pk))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6015
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                pk, email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, name='workflow-config-view')
    def config_view(self, request, pk=None, tenant=None):
        email=get_email(request)
        logger.info("{} requested Form labels in this organisation workflow for id: {} for tenant: {}".format(
            email, pk, tenant))
        try:
            # TODO exception handling for Process Engine Calls
            if 'type' in request.query_params:
                if request.query_params['type'] == 'entity':
                    try:
                        master_model_obj = OrganisationEntityMasterModel.objects.get(
                            id=pk)
                    except Exception as error:
                        internal_error = 6016
                        context = {'error': str(error), 'success': False, 'message': _(
                            getLogMessage(org_apps_errors, internal_error))}
                        logger.error(getLogMessage(org_apps_errors, internal_error).format(
                            pk, email, error), internal_error)
                        return Response(context, status=status.HTTP_404_NOT_FOUND)
                    list_form = master_model_obj.entity_forms.all()
                    if not list_form:
                        context = {"success": True, "message": _(
                            "No forms are selected for this view."), "data": []}
                        logger.info("No forms are selected for this view.")
                        return Response(context, status=status.HTTP_200_OK)
            else:
                try:
                    obj = self.model.objects.get(id=pk)
                except Exception as error:
                    context = {'error': str(
                        error), 'success': False, 'message': _('ID not found')}
                    return Response(context, status=status.HTTP_404_NOT_FOUND)
                list_form = []
                ProcessDefinitions = process_engine.ProcessDefinitionsApi
                list_process = ProcessDefinitions.list_process_definitions
                req_body = {}
                req_body["latest"] = True
                req_body["key"] = obj.process_key
                action, response_status_code = call(
                    module=ProcessDefinitions, func=list_process, data=req_body, tenant_id=tenant, request=request, type="get", read_replica=True)
                if response_status_code > 300:
                    internal_error = 6017
                    context = {"success": False, "message": _(getMessage(
                        org_apps_errors, internal_error)), 'internal_error': internal_error, "data": action}
                    logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                        pk, email, action), internal_error)
                    return Response(context, status=response_status_code)
                processDefinitionId = action["data"][0]["id"]
                get_bpmn_model = ProcessDefinitions.get_bpmn_model_resource
                query_params = {}
                query_params['process_definition_id'] = processDefinitionId
                action, response_status_code = call(
                    module=ProcessDefinitions, func=get_bpmn_model, data=query_params, tenant_id=tenant, request=request, type="get", read_replica=True)
                if response_status_code > 300:
                    internal_error = 6018
                    context = {"success": False, "message": _(getMessage(
                        org_apps_errors, internal_error)), "data": action, 'internal_error': internal_error}
                    logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                        email, pk, action), internal_error)
                    return Response(context, status=response_status_code)
                tasks = action["processes"]
                for task in tasks:
                    for flow_element_map in task["flowElementMap"]:
                        for key in task["flowElementMap"][flow_element_map]:
                            if key == "formKey" and task["flowElementMap"][flow_element_map][key]:
                                list_form.append(
                                    task["flowElementMap"][flow_element_map][key])
            response = {}
            for form in list_form:
                if 'type' in request.query_params:
                    if request.query_params['type'] == 'entity':
                        form_data = OrganisationForm.objects.filter(
                            id=str(form.id)).first()
                else:
                    actual_form_key, form_version = form.split("::")
                    try:
                        form_data = OrganisationForm.objects.get(
                            key=actual_form_key, version=form_version)
                    except NotFound as error:
                        internal_error = 6019
                        context = {'error': str(error), 'success': False, 'message': _(
                            getMessage(org_apps_errors, internal_error)), "internal_error": internal_error}
                        logger.exception(
                            "Form not found for " + form, internal_error)
                        return Response(context, status=status.HTTP_400_BAD_REQUEST)
                key_label = get_reporting_label(form_data.keytypepair)
                sorted_value = OrderedDict()
                if key_label:
                    sorted_value = OrderedDict(
                        sorted(key_label.items(), key=lambda kv: (kv[1], kv[0])))
                response[form_data.name] = sorted_value
            new_response = {}
            for data in response:
                if len(response[data].keys()) > 0:
                    new_response[data] = response[data]

            context = {"success": True, "message": _(
                "Form labels in this organisation workflow returned successfully."), "data": new_response}
            logger.info("{} Form labels in this organisation workflow returned successfully for id: {} for tenant: {}".format(
                email, pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6019
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                pk, email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_config.view_reporttemplate"]))
    @action(detail=True, name='workflow-report-variables-view')
    def report_view(self, request, pk=None, tenant=None):
        email=get_email(request)
        logger.info("{} requested Form labels in this organisation workflow for id: {} for tenant: {}".format(
            email, pk, tenant))
        try:
            # TODO exception handling for Process Engine Calls
            if 'type' in request.query_params:
                if request.query_params['type'] == 'entity':
                    try:
                        master_model_obj = OrganisationEntityMasterModel.objects.get(
                            id=pk, tenant=tenant)
                    except Exception as error:
                        internal_error = 6020
                        context = {'error': str(error), 'success': False, 'message': _(
                            getMessage(org_apps_errors, internal_error))}
                        logger.error(getLogMessage(org_apps_errors, internal_error).format(
                            pk, email, error), internal_error)
                        return Response(context, status=status.HTTP_404_NOT_FOUND)
                    list_form = master_model_obj.entity_forms.all()
                    if not list_form:
                        context = {"success": True, "message": _(
                            "No forms are selected for this view."), "data": []}
                        logger.info("No forms are selected for this view.")
                        return Response(context, status=status.HTTP_200_OK)
            else:
                try:
                    obj = self.model.objects.get(id=pk, tenant=tenant)
                except Exception as error:
                    internal_error = 6021
                    context = {'error': str(error), 'success': False, 'message': _(
                        getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_apps_errors, internal_error).format(
                        pk, email, error), internal_error)
                    return Response(context, status=status.HTTP_404_NOT_FOUND)
                list_form = []
                ProcessDefinitions = process_engine.ProcessDefinitionsApi
                list_process = ProcessDefinitions.list_process_definitions
                req_body = {}
                req_body["latest"] = True
                req_body["key"] = obj.process_key
                action, response_status_code = call(
                    module=ProcessDefinitions, func=list_process, data=req_body, tenant_id=tenant, request=request, type="get", read_replica=True)
                if response_status_code > 300:
                    internal_error = 6022
                    context = {"success": False, "message": _(getMessage(
                        org_apps_errors, internal_error)), "data": action, "internal_error": internal_error}
                    logger.error(getLogMessage(org_apps_errors, internal_error).format(
                        pk, email, action), internal_error)
                    return Response(context, status=response_status_code)
                processDefinitionId = action["data"][0]["id"]
                get_bpmn_model = ProcessDefinitions.get_bpmn_model_resource
                query_params = {}
                query_params['process_definition_id'] = processDefinitionId
                action, response_status_code = call(
                    module=ProcessDefinitions, func=get_bpmn_model, tenant_id=tenant, data=query_params, request=request, type="get", read_replica=True)
                if response_status_code > 300:
                    internal_error = 6023
                    context = {"success": False, "message": _(getMessage(
                        org_apps_errors, internal_error)), "data": action, "internal_error": internal_error}
                    logger.error(getLogMessage(org_apps_errors, internal_error).format(
                       tenant, pk, email, action), internal_error)
                    return Response(context, status=response_status_code)
                tasks = action["processes"]
                for task in tasks:
                    for flow_element_map in task["flowElementMap"]:
                        for key in task["flowElementMap"][flow_element_map]:
                            if key == "formKey" and task["flowElementMap"][flow_element_map][key]:
                                list_form.append(
                                    task["flowElementMap"][flow_element_map][key])
            key_label = []
            for form in list_form:
                if 'type' in request.query_params:
                    if request.query_params['type'] == 'entity':
                        form_data = OrganisationForm.objects.filter(
                            id=str(form.id), tenant=tenant).first()
                else:
                    actual_form_key, form_version = form.split("::")
                    try:
                        form_data = OrganisationForm.objects.get(
                            key=actual_form_key, version=form_version, tenant=tenant)
                    except NotFound as error:
                        internal_error = 6024
                        context = {'error': str(error), 'success': False, 'message': _(
                            getMessage(org_apps_errors, internal_error)), "internal_error": internal_error}
                        logger.exception(
                            "Form not found for " + form, internal_error)
                        return Response(context, status=status.HTTP_400_BAD_REQUEST)
                key_label = key_label + \
                    get_reporting_view(form_data.keytypepair)
            sorted_key_label = []
            if key_label:
                sorted_key_label = sorted(key_label, key=itemgetter('name'))
                sorted_key_label = list(OrderedDict(
                    (dict_data['key'], dict_data) for dict_data in sorted_key_label).values())
            response = sorted_key_label
            context = {"success": True, "message": _(
                "Form labels in this organisation workflow returned successfully."), "data": response}
            logger.info("{} Form labels in this organisation workflow returned successfully for id: {} for tenant: {}".format(
                email, pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6024
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                pk, email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_portals.change_portals", "org_apps.change_organisationworkflow"]))

    @action(detail=False, methods=['put'], name='workflow-portal-mapping')
    def set_portal(self, request, tenant=None):
        logger.info("{} requested to change Workflows portal".format(
            request.user.email))
        try:
            all_workflows = self.get_queryset().filter(tenant=tenant)
            if not all_workflows:
                internal_error = 6025
                context = {'error': None, 'success': False, 'message': _(getMessage(
                    org_apps_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    request.user.email), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.portal_update_serializer_class(
                all_workflows, data=request.data, many=True, partial=True, fields=('id', 'portal'))
            if serializer.is_valid():
                modified_objects = serializer.save()
                serialized_data = self.serializer_class(
                    modified_objects, many=True).data
                context = {"success": True, "message": _(
                    "Workflows portal changed successfully"), "error": None, "data": serialized_data}
                logger.info("{} Workflows portal changed successfully for tenant: {}".format(
                    request.user.email, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 6026
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_apps_errors, internal_error)), "internal_error": internal_error}
            logger.error(internal_error.format(
                request.user.email, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 6027
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], name='launch-new-process')
    def launch_process(self, request, pk=None, tenant=None):
        try:
            # TODO exception handling for Process Engine Calls
            response = launch_process_util(request, tenant)
            return response

        except Exception as error:
            internal_error = 6028
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(pk, request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], name='launch-bulk-process')
    def launch_bulk_process(self, request, tenant=None):
        user_email = "AnonymousUser"
        try:
            # TODO exception handling for Process Engine Calls
            response = []
            if hasattr(request, "user"):
                user = request.user
                if hasattr(user, "email"):
                    user_email = user.email
            target_uuid = uuid.uuid4()
            if "variables" in request.data:
                variables = request.data.get("variables")
                if "uuid" in variables:
                    target_uuid = variables.get("uuid")
                elif "user" in variables:
                    target_uuid = variables.get("user").get("userId")

            queue_count = int(settings.CELERY_QUEUE_COUNT)  # Set the number of queues

            selected_queue = determine_partition(target_uuid, queue_count)

            print(f"Selected partition for UUID {target_uuid}: {selected_queue}")

            # Following exists condition makes sure, we pass data in queue only and only if the received message
            # belongs to registered tenant
            if OrganisationWorkflow.objects.filter(kafka_topic=request.data["kafka_topic"], tenant__id=tenant).exists():
                # Below condition is used to make sure we distribute the queue in case of domain name
                domain_name = request.data["domain_name"] if "domain_name" in request.data else None
                if domain_name and domain_name.upper() == "EMPVERIFY":
                    launch_bulk_process_util.apply_async(
                        args=[request.data],
                        kwargs={"tenant": tenant, "user_email": user_email},
                        queue="launch_process_emp_verify_bulk_queue",
                        priority=HIGH_PRIORITY_TASK
                    )
                else:
                    launch_bulk_process_util.apply_async(
                        args=[request.data],
                        kwargs={"tenant": tenant, "user_email": user_email},
                        queue="launch_process_bulk_queue_{0}".format(str(selected_queue)),
                        priority=HIGH_PRIORITY_TASK
                    )
                context = {"success": True, "message": "Bulk process launch successfully accepted"}
                return Response(context, status=status.HTTP_200_OK)
            else:
                internal_error = 6104
                context = {'error': "No workflow found for tenant and kafka topic combination",
                           'success': False, 'message': _(getMessage(org_apps_errors, internal_error)),
                           "internal_error": internal_error}
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 6104
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(user_email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], name="send-notification")
    def send_notification(self, request, tenant=None):
        try:
            request_body = request.data
            if "ezeurl" in request_body:
                request_body["payload"][request_body["ezeurl"]] = create_short_url_firebase(
                    request_body["payload"][request_body["ezeurl"]], request)
            if request_body and 'payload' in request_body and\
                    'subject' in request_body["payload"] and\
                    'templateId' in request_body["payload"] and\
                    request_body["payload"]["type"] in ('EMAIL', 'SMS'):
                response = send_notification(user_obj=request_body["payload"], type=request_body["payload"]["type"],
                                             subject=request_body["payload"]["subject"],
                                             templateId=request_body["payload"]["templateId"],
                                             attachments=request_body.get('attachments',[]))
                return Response(response, status=status.HTTP_200_OK)
            if request_body and 'payload' in request_body and\
                    'subject' in request_body["payload"] and\
                    'email_templateId' in request_body["payload"] and \
                    'sms_templateId' in request_body["payload"] and \
                    request_body["payload"]["type"] == 'EMAIL_SMS':
                send_notification(user_obj=request_body["payload"], type='EMAIL',
                                  subject=request_body["payload"]["subject"],
                                  templateId=request_body["payload"]["email_templateId"],
                                  attachments=request_body.get('attachments', []))
                response = send_notification(user_obj=request_body["payload"], type='SMS',
                                             subject=request_body["payload"]["subject"],
                                             templateId=request_body["payload"]["sms_templateId"],
                                             attachments=request_body.get('attachments', []))
                return Response(response, status=status.HTTP_200_OK)
            else:
                context = {'error': "Invalid Body", 'success': False, 'message': _(
                    getMessage(org_apps_errors, 6102)), "internal_error": 6102}
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 6101
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                '', tenant, error, email=get_email(request)), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['post'], name="launch-open-process")
    def launch_open_process(self, request, pk=None, tenant=None):
        try:
            # TODO exception handling for Process Engine Calls
            response = launch_process_util(request, tenant)
            return response

        except Exception as error:
            internal_error = 6029
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                pk, request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], name='search_process')
    def search(self, request, pk=None, tenant=None):
        logger.info("{} requested to search process Instance for id: {} for tenant: {}".format(
            get_email(request), pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 6030
                context = {'error': str(error), 'success': False, 'message': _(
                    getMessage(org_apps_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    pk, get_email(request), error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            data = request.data
            process_type = request.query_params['process_type']
            response = {}
            req_body = {}
            var_body = []
            req_body["name"] = data["name"]
            req_body["operation"] = "likeIgnoreCase"
            req_body["value"] = data["value"]
            req_body["variableOperation"] = "LIKE_IGNORE_CASE"
            var_body.append(req_body)
            req_body = {}
            req_body["processDefinitionKey"] = obj.process_key
            req_body["variables"] = var_body
            req_body["tenantId"] = tenant
            req_body["sort"] = "startTime"
            req_body["order"] = "desc"
            # Ongoing
            req_body["finished"] = False
            if 'operation' in data:
                req_body["variables"][0]["operation"] = COMPARISION[data["operation"]]
                req_body["variables"][0]["variableOperation"] = data["operation"]
            if 'size' in request.query_params:
                req_body['size'] = request.query_params['size']
            if 'sort' in request.query_params:
                req_body['sort'] = request.query_params['sort']
            if 'start' in request.query_params:
                req_body['start'] = request.query_params['start']

            req_body_filter = {}
            req_body_filter["variables"] = []
            # org_user = OrganisationUser.default_manager.get(
            #     email=request.user.email)
            get_active_filter_data = OrganisationFilter.objects.filter(
                user=str(request.user.id), active_filter=True)
            if get_active_filter_data and obj.process_key == get_active_filter_data[0].processDefinitionKey:
                filter_query = get_active_filter_data[0].filter_query
                if filter_query:
                    for filter_data in filter_query:
                        req_body["variables"].append(
                            {"name": filter_data, "operation": "equals", "variableOperation": "EQUALS", "value": filter_query[filter_data]})
            if obj.custom_default_filter and "vendor" in obj.custom_default_filter and tenant != str(request.user.tenant.id):
                req_body_filter["variables"].append({"name": obj.custom_default_filter["vendor"], "operation": "equals", "variableOperation": "EQUALS", "value": tenant})
            Query = process_engine.QueryApi
            query_historic_process = Query.query_historic_process_instance

            def get_data(modified_reqbody):
                response_data, status_code = call(
                    module=Query, func=query_historic_process, data=modified_reqbody, request=request, type="post",tenant_id=modified_reqbody["tenantId"], read_replica=True)
                processInstanceIds = []
                for process in response_data['data']:
                    processInstanceIds.append(process['id'])
                if len(processInstanceIds) > 0:
                    modified_reqbody['includeProcessVariables'] = True
                    modified_reqbody['processInstanceIds'] = processInstanceIds
                    if 'start' in modified_reqbody:
                        modified_reqbody.pop('start')
                    process_data = call(module=Query, func=query_historic_process,
                                        data=modified_reqbody, request=request, type="post", tenant_id=modified_reqbody['tenantId'], read_replica=True)
                    response_data['data'] = process_data[0]['data']
                    status_code = process_data[1]
                return response_data, status_code

            if process_type == "Ongoing process":
                action_ongoing = get_data(req_body)
                response["ongoing"] = action_ongoing[0]
            elif process_type == "Completed process":
                req_body["finished"] = True
                req_body["deleted"] = False
                action_completed = get_data(req_body)
                response["completed"] = action_completed[0]
            else:
                req_body["deleted"] = True
                req_body["finished"] = True
                action_withdrawn = get_data(req_body)
                response["withdrawn"] = action_withdrawn[0]
            context = {"success": True, "message": _(
                "Search Result Found Successfully"), "data": response}
            logger.info("{}, Search Result Found Successfully for id: {} for tenant: {}".format(
                get_email(request), pk, tenant))
            statusCode = status.HTTP_200_OK
            return Response(context, status=statusCode)
        except Exception as error:
            internal_error = 6031
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                pk, get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_users.manage_tasks"]))
    @action(detail=False, methods=['post'], name='search_task')
    def search_task(self, request, pk=None, tenant=None):
        logger.info("{} requested to search process Instance for id: {} for tenant: {}".format(
            get_email(request), pk, tenant))
        try:
            if 'processDefinitionKey' in request.query_params:
                try:
                    obj = self.model.objects.get(
                        process_key=request.query_params['processDefinitionKey'], tenant__id=tenant)
                except Exception as error:
                    internal_error = 6032
                    context = {'error': str(error), 'success': False, 'message': _(
                        getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_apps_errors, internal_error).format(
                        pk, get_email(request), error), internal_error)
                    return Response(context, status=status.HTTP_404_NOT_FOUND)
            data = request.data
            var_body = []
            req_body = {}
            # add all query params as filter options
            internal_params = ['task_type']
            for k, v in request.query_params.items():
                if k in internal_params:
                    continue
                req_body[k] = v
            get_data = {}
            temp_req_body = {}
            if "or_query" in data:
                if 'task_type' in request.query_params and request.query_params['task_type'] == 'completed_tasks':
                    pass
                else:
                    name = request.query_params.get('nameLike', None)
                    order = req_body.get("order",'asc')
                    sort = req_body.get("sort",'create_time_')
                    start = request.query_params.get('start')
                    size = request.query_params.get('size')
                    process_key = request.query_params.get('processDefinitionKey', None)
                    task_type = request.query_params.get('task_type', None)
                    includeProcessVariable = request.query_params.get('includeProcessVariable', False)
                    if task_type == 'tasks':
                        assignee = request.user.userId
                        groups = None
                    else:
                        if task_type == 'group_tasks':
                            groups = []
                            groups = OrganisationGroup.objects.filter(users=request.user, tenant=tenant).distinct().values_list('key', flat=True)
                        assignee = None
                    filter_body = data["or_query"]
                    for item in filter_body:
                        item["variableOperation"] = "IN"
                    result = get_tasks(name, process_key, assignee, groups, start, size, order, sort, tenant, filter_body, includeProcessVariable)
                    final_result = {
                        "success": True,
                        "message": "Task Result Found Successfully",
                        "data": result,
                        "filterData": {}
                        }
                    return Response(final_result, status=status.HTTP_200_OK)
            if "search" in data:
                if "search_data" in data:
                    var_body = data["search_data"]
                else:
                    temp_req_body["name"] = data["name"]
                    temp_req_body["operation"] = "likeIgnoreCase"
                    temp_req_body["value"] = data["value"]
                    temp_req_body["variableOperation"] = "LIKE_IGNORE_CASE"
                    var_body.append(temp_req_body)

            if 'task_type' in request.query_params:
                if request.query_params['task_type'] == 'tasks':
                    req_body["assignee"] = request.user.userId
                if request.query_params['task_type'] == 'group_tasks':
                    groups = []
                    if 'group_id' in request.query_params:
                        group_id = request.query_params['group_id']
                        groups.append(group_id)
                        try:
                            group_data = OrganisationGroup.objects.filter(
                                tenant__id=tenant).filter(Q(id=group_id) | Q(key=group_id))[0]
                        except Exception as error:
                            internal_error = 6099
                            context = {'error': str(error), 'success': False, 'message': _(
                                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
                            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                                get_email(request), group_id, error), internal_error)
                            return Response(context, status=status.HTTP_400_BAD_REQUEST)
                        groups.append(group_data.key)
                    else:
                        for group in OrganisationGroup.objects.filter(tenant__id=tenant):
                            if group.users.filter(id=request.user.id).exists():
                                groups.append(str(group.id))
                                groups.append(group.key)
                    if groups:
                        req_body["candidateGroupIn"] = groups
                    else:
                        req_body["candidateGroup"] = ""


            req_body["processInstanceVariables"] = var_body
            req_body["tenantId"] = tenant
            req_body["order"] = req_body.get("order",'asc')
            if not "search" in data:
                if 'nameLike' in request.query_params:
                    req_body["nameLike"] = get_filter_task_title(
                        request.query_params["nameLike"])
            if 'includeProcessVariables' in request.query_params:
                if request.query_params['includeProcessVariables'] == 'true':
                    req_body["includeProcessVariables"] = True
            if 'operation' in data:
                req_body["processInstanceVariables"][0]["operation"] = COMPARISION[data["operation"]]
                req_body["processInstanceVariables"][0]["variableOperation"] = data["operation"]

            if 'task_type' in request.query_params and request.query_params['task_type'] == 'completed_tasks':
                if "taskCandidateGroup" in data:
                    req_body["taskInvolvedGroups"] = data["taskCandidateGroup"]
                else:
                    req_body["taskAssignee"] = request.user.userId
                req_body["finished"] = "true"
                req_body["processVariables"] = req_body["processInstanceVariables"]
                Query = process_engine.HistoryTaskApi
                queryTask = Query.query_historic_task_instance
            else:
                Query = process_engine.QueryApi
                queryTask = Query.query_tasks

            action, response_status_code = call(
                module=Query, func=queryTask, data=req_body, request=request, tenant_id=tenant, type="post", read_replica=True)
            if response_status_code == 200:
                context = {"success": True, "message": _(
                    "Task Result Found Successfully"), "data": action, "filterData": get_data}
                logger.info("{}, Task Result Found Successfully.".format(
                    get_email(request)))
                statusCode = status.HTTP_200_OK
            else:
                internal_error = 6037
                message = _(getMessage(
                    org_apps_errors, internal_error))
                if 'exception' in action:
                    message = "Task Result Failed due to {}.".format(action['exception'])
                context = {"success": False, "message": message, "internal_error": internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    get_email(request)), internal_error)
                statusCode = response_status_code
            return Response(context, status=statusCode)
        except Exception as error:
            internal_error = 6038
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, name='step-progress')
    def step_progress(self, request, tenant=None):
        logger.info("{} requested to return Progress for the process for tenant: {}".format(get_email(request), tenant))
        logger.info("{0} is started :  {1}".format(
            request.query_params["processInstanceId"], datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")))
        try:
            # TODO exception handling for Process Engine Calls
            response = {}
            response["current"] = []
            processInstanceId = request.query_params["processInstanceId"]
            tasksApi = process_engine.TasksApi
            listTasks = tasksApi.list_tasks
            query_params = {}
            query_params['process_instance_id'] = processInstanceId
            res_action, response_status_code = call(
                module=tasksApi, func=listTasks, data=query_params, request=request, type="get", tenant_id=tenant, read_replica=True)
            if response_status_code > 300:
                internal_error = 6039
                context = {"success": False, "message": _(getMessage(
                    org_apps_errors, internal_error)), "data": res_action, "internal_error": internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    get_email(request)), internal_error)
                return Response(context, status=response_status_code)
            tasks = res_action["data"]
            for usertask in tasks:
                if usertask['assignee']:
                    usertask_details = dict()
                    usertask_details['name'] = usertask['name']
                    usertask_details['id'] = usertask['id']
                    usertask_details['assignee'] = usertask['assignee']
                    response["current"].append(usertask_details)
                else:
                    usertask_details = dict()
                    usertask_details['name'] = usertask['name']
                    usertask_details['id'] = usertask['id']
                    try:
                        TaskIdentityLinks = process_engine.TaskIdentityLinksApi
                        list_tasks_instance_identity = TaskIdentityLinks.list_tasks_instance_identity_links
                        req_body = {}
                        req_body["task_id"] = usertask['id']
                        action = call(module=TaskIdentityLinks, func=list_tasks_instance_identity,
                                      data=req_body, request=request, type="get", tenant_id=tenant, read_replica=True)[0]
                        group_id = action[0]['group']
                        group = OrganisationGroup.objects.get(id=group_id)
                        usertask_details['assignee'] = group.name
                    except Exception as error:
                        try:
                            group = OrganisationGroup.objects.get(key=group_id)
                            usertask_details['assignee'] = group.name
                        except Exception as error:
                            usertask_details['assignee'] = usertask['assignee']
                    response["current"].append(usertask_details)
            context = {"success": True, "message": _(
                "Progress for the process is returned successfully"), "data": response}
            logger.info("{}, Progress for the process is returned successfully for tenant: {}".format(
                get_email(request), tenant))
            logger.info("{0} is  ended :  {1}".format(
                request.query_params["processInstanceId"], datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")))
            return Response(context, status=status.HTTP_200_OK)

        except Exception as error:
            internal_error = 6040
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, name='ongoing-process-forms')
    def ongoing_process_forms(self, request, tenant=None):
        logger.info("{} requested to return Forms and Attachments for tenant: {}".format(
            get_email(request), tenant))
        try:
            # TODO exception handling for Process Engine Calls
            forms = []
            var_forms = []
            var_attachments = {}
            var_form_attachments = []
            try:
                workflow = OrganisationWorkflow.objects.get(
                    process_key=request.query_params['processDefinitionKey'])
            except Exception as error:
                internal_error = 6041
                context = {'error': str(error), 'success': False, 'message': _(
                    getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    get_email(request), error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            user_email = get_email(request)
            role_id = OrganisationUser.default_manager.filter(email=user_email)[
                0].groups.all()[0].id
            view_data = workflow.role_view.filter(role=role_id)
            if not view_data or view_data[0].selected_forms == []:
                internal_error = 6042
                context = {'success': False, 'message': _(getMessage(
                    org_apps_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    get_email(request)), internal_error)
                return Response(context, status=status.HTTP_204_NO_CONTENT)
            for form_send in view_data[0].selected_forms:
                forms.append(form_send)
            # To get External User Forms

            # To Get Form Json of all external User forms, hide file fields and Remove Forms which contains only Attachments
            for key in forms:
                # actual_form_key, form_version = key.split("::")
                form_data = OrganisationForm.objects.filter(name=key).last()
                if not form_data:
                    logger.info(
                        "No Form found with this name : {} for tenant: {}".format(key, tenant))
                else:
                    # To Get Form Json of all external User forms, hide file fields and Remove Forms which contains only Attachments
                    form_labels = get_label(form_data.keytypepair)
                    key_type = get_key_type(form_data.keytypepair)
                    flag = 0
                    file_count = 0
                    field_count = 0
                    # adding all the forms components except file components because file components are shown under docs tab
                    for i in key_type:
                        field_count = field_count + 1
                        if key_type[i] == 'file':
                            file_count = file_count + 1
                            if i not in var_attachments:
                                var_attachments[i] = form_labels[i]
                            flag = 1
                    if flag == 0:
                        var_forms.append({"name": form_data.name, "formKey": form_data.key+'::'+str(form_data.version), "content": FormPreviewController(
                            form_data.content).get_components(), "language_option": form_data.language_option})
                    if flag == 1:
                        # forms which only contains file fields
                        if file_count == field_count:
                            var_form_attachments.append(
                                {"name": form_data.name, "formKey": form_data.key+'::'+str(form_data.version)})
                        else:
                            var_forms.append({"name": form_data.name, "formKey": form_data.key+'::'+str(form_data.version), "content": FormPreviewController(
                                form_data.content).get_components(), "language_option": form_data.language_option})

            response = {}
            response["forms"] = var_forms
            response["attachments"] = var_attachments
            response["form_attachments"] = var_form_attachments
            context = {"success": True, "message": _(
                "Forms and Attachments are returned successfully"), "data": response}
            logger.info("{}, Forms and Attachments are returned successfully for tenant: {}".format(
                get_email(request), tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6043
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def get_process_forms(self, request, tenant=None):
        logger.info("{} requested to return Forms for tenant: {}".format(
            get_email(request), tenant))
        try:
            forms = []
            var_forms = []
            try:
                workflow = OrganisationWorkflow.objects.get(
                    process_key=request.query_params['processDefinitionKey'], tenant=tenant)
            except Exception as error:
                context = {'error': str(error), 'success': False, 'message': _(
                    'Workflow with process Definition Key not found')}
                logger.error("{}, Workflow with process Definition Key not found, due to: {}".format(
                    get_email(request), error))
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            user_email = get_email(request)
            role_id = OrganisationUser.default_manager.filter(email=user_email, tenant=tenant)[
                0].id
            # view_data = workflow.role_view.filter(role=role_id)
            view_data = workflow
            if not view_data or view_data.selected_forms == []:
                context = {'success': False, 'message': _(
                    'No forms selected for this process')}
                logger.info("{}, No forms selected for this process, due to: 204_NO_CONTENT for tenant: {}".format(
                    get_email(request), tenant))
                return Response(context, status=status.HTTP_200_OK)

            for form_send in view_data.selected_forms:
                forms.append(form_send)

            for key in forms:
                form_data = OrganisationForm.objects.filter(
                    name=key).order_by('-version').first()
                if not form_data:
                    logger.info(
                        "No Form found with this name : {} for tenant: {}".format(key, tenant))
                else:
                    key_type = get_key_type(form_data.keytypepair)
                    for i in key_type:
                        if key_type[i] != 'file':
                            var_forms.append(form_data.name)
                            break

            if var_forms == []:
                context = {'success': False, 'message': _(
                    'No forms selected for this process')}
                logger.error("{}, No forms selected for this process, due to: 204_NO_CONTENT".format(
                    get_email(request)))
                return Response(context, status=status.HTTP_200_OK)

            res_data = {}
            res_data['forms'] = var_forms

            context = {"success": True, "message": _(
                "Forms and Attachments are returned successfully"), "data": res_data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            context = {'error': str(error), 'success': False, 'message': _(
                'Failed to retrieve Forms for Ongoing Process.')}
            logger.exception("{}, Failed to retrieve Forms and for Ongoing Process, due to: {}".format(
                get_email(request), error))
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def get_form_data(self, request, tenant=None):
        logger.info("{} requested to return Form data and its attachment for tenant: {}".format(
            get_email(request), tenant))
        try:
            attachments = {}
            form = []
            form_attachments = []
            form_name = request.query_params.get('name', '')
            form_data = OrganisationForm.objects.filter(
                name=form_name).order_by('-version').first()
            if not form_data:
                error_msg = "No Form exists with given name."
                context = {'error': error_msg, 'success': False,
                           'message': _('Form not found')}
                logger.error("{}, Failed to get form data for name: {}, due to: {}".format(
                    get_email(request), form_name, error_msg))
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            form.append({"name": form_data.name, "formKey": form_data.key+'::'+str(form_data.version),
                         "content": FormPreviewController(form_data.content).get_components(), "language_option": form_data.language_option})
            response = {}
            response["forms"] = form
            # response["attachments"] = attachments
            # response["form_attachments"] = form_attachments
            context = {"success": True, "message": _(
                "Forms and Attachments are returned successfully"), "data": response}
            logger.info("{}, Forms and Attachments are returned successfully for tenant: {}".format(
                get_email(request), tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            context = {'error': str(error), 'success': False, 'message': _(
                'Failed to retrieve Forms and attachments for Ongoing Process.')}
            logger.exception("{}, Failed to retrieve Forms and attachments for Ongoing Process, due to: {}".format(
                get_email(request), error))
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get', 'post'], name='bulk_initiate')
    # @method_decorator(license_required(['license.bulkprocess_organisationlicense',]))
    def bulk_initiate(self, request, pk=None, tenant=None):
        logger.info("{} requested to start Bulk Process for id: {} for tenant: {}".format(
            get_email(request), pk, tenant))
        try:
            try:
                try:
                    u = uuid.UUID(pk)
                    obj = self.model.objects.get(id=pk, tenant=tenant)
                except:
                    obj = self.model.objects.get(app_key=pk, tenant=tenant)
                engine_url = OrganisationLicense.objects.get(
                    organisation=tenant).processengine
            except Exception as error:
                internal_error = 6044
                context = {'error': str(error), 'success': False, 'message': _(
                    getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    pk, get_email(request), error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            if request.method == 'GET':
                ProcessDefinitions = process_engine.ProcessDefinitionsApi
                list_process = ProcessDefinitions.list_process_definitions
                req_body = {}
                req_body["latest"] = True
                req_body["key"] = obj.process_key
                action, response_status_code = call(
                    module=ProcessDefinitions, func=list_process, data=req_body, request=request, type="get", tenant_id=tenant, read_replica=True)
                if response_status_code > 300:
                    internal_error = 6045
                    context = {"success": False, "message": _(getMessage(
                        org_apps_errors, internal_error)), "data": action, "internal_error": internal_error}
                    logger.info(getLogMessage(org_apps_errors, internal_error).format(
                        get_email(request)), internal_error)
                    return Response(context, status=response_status_code)
                iterate_process = action["data"]
                if iterate_process[0]["startFormDefined"]:
                    if obj.bulk_sample_url:
                        logger.info(
                            "Bulk Sample URL exists, returned sample import file")
                        response = HttpResponse(read_sample_bulk_file(obj), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                        response['Content-Disposition'] = 'inline; filename=' + \
                            "hello.xlsx"
                        return response
                    else:
                        get_start_form2 = ProcessDefinitions.get_process_definition_start_form2
                        req_id = {}
                        req_id["process_definition_id"] = iterate_process[0]["id"]
                        action = call(module=ProcessDefinitions, func=get_start_form2,data=req_id, request=request, type="get", tenant_id=tenant, read_replica=True)[0]
                        form_key, form_version = action["key"].split("::")
                        form = OrganisationForm.objects.get(
                            key=form_key, version=form_version, tenant=tenant)
                        labels = get_nonhidden_label(form.keytypepair)
                        key_type = get_nonhidden_key_type(form.keytypepair)
                        req_headers = get_non_hidden_required_labels(
                            form.keytypepair)
                        list_fields = []
                        for i in labels:
                            list_fields.append(i)
                        output = io.BytesIO()
                        workbook = xlsxwriter.Workbook(output)
                        worksheet = workbook.add_worksheet()
                        row = 0
                        col = 0
                        for headers in list_fields:
                            worksheet.write(row+2, col, headers)
                            if req_headers[headers]:
                                worksheet.write(row+1, col, 'mandatory')
                            else:
                                worksheet.write(row+1, col, 'optional')
                            if key_type[headers] == 'select':
                                opt = GetComponentsController(
                                    form.content, headers).get_select_options()
                                if len(opt) == 0:
                                    worksheet.write(
                                        row+3, col, labels[headers])
                                else:
                                    worksheet.write(
                                        row+3, col, labels[headers] + " (" + ",".join(opt) + ")")
                                worksheet.write(row, col, 'string')
                                col += 1
                            elif key_type[headers] == 'checkbox':
                                worksheet.write(
                                    row+3, col, labels[headers] + " (true/false)")
                                worksheet.write(row, col, 'boolean')
                                col += 1
                            elif key_type[headers] == 'radio':
                                opt = GetComponentsController(
                                    form.content, headers).get_radio_options()
                                worksheet.write(
                                    row+3, col, labels[headers] + " (" + ",".join(opt) + ")")
                                worksheet.write(row, col, 'string')
                                col += 1
                            elif key_type[headers] == 'file':
                                worksheet.write(row, col, 'file')
                                worksheet.write(row+3, col, labels[headers])
                                col += 1
                            else:
                                worksheet.write(row, col, 'string')
                                worksheet.write(row+3, col, labels[headers])
                                col += 1

                        row = 2
                        col = 0
                        worksheet.set_row(0, None, None, {'hidden': True})
                        worksheet.set_row(1, None, None, {'hidden': True})
                        worksheet.set_row(2, None, None, {'hidden': True})
                        workbook.close()
                        output.seek(0)
                        logger.info(
                            "Bulk Sample URL doesn't exist, returned a generated sample import file")
                        response = HttpResponse(output.read(
                        ), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                        response['Content-Disposition'] = 'inline; filename=' + \
                            "hello.xlsx"
                        return response
                else:
                    internal_error = 6046
                    context = {'success': False, 'message': _(getMessage(
                        org_apps_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_apps_errors, internal_error).format(
                        pk, get_email(request)), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            if request.method == 'POST':
                request_body = {}
                file_type = None
                uploaded_file = request.FILES['file']
                common_variable = {}
                if 'common_variable' in request.data and request.data['common_variable']:
                    common_variable = json.loads(
                        request.data['common_variable'])
                request_body['common_variable'] = common_variable
                if 'entity' in request.query_params:
                    entity_type = request.query_params['entity']
                else:
                    entity_type = "bulk_initiate_process"
                if uploaded_file.name.endswith('.xlsx'):
                    logger.info("Uploaded file is xlsx.")
                    converted_file = get_uploaded_file(uploaded_file)
                    request_body["file_path"] = converted_file
                    logger.info("xlsx_file_path: {}".format(converted_file))
                    file_type = '.xlsx'
                elif uploaded_file.name.endswith('.csv'):
                    logger.info("Uploaded file is CSV.")
                    csv_file_path = get_uploaded_file(uploaded_file)
                    request_body["file_path"] = csv_file_path
                    logger.info("csv_file_path: {}".format(csv_file_path))
                    file_type = '.csv'
                else:
                    csv_file_path = None
                    logger.info("Uploaded file is not XLSX/CSV.")
                request_body["file_type"] = file_type
                request_body["engine_url"] = engine_url
                request_body["workflow"] = obj.id
                request_body["token"] = request.META["HTTP_JWT_TOKEN"]
                request_body["domain_info"] = "{0}://{1}".format(
                    DEFAULT_SCHEME, request.get_host())
                request_body['import_type'] = 'workflow'
                request_body["context_data"] = request.query_params
                entity_data = dict()
                entity_data['transaction_id'] = uuid.uuid4()
                entity_data['started_at'] = timezone.now()
                entity_data['status'] = EntityImport.STATUS_CHOICES[0][0]
                entity_data['entity_type'] = entity_type
                entity_data['user'] = request.user
                entity_data['file'] = uploaded_file
                entity_data["tenant"] = tenant
                serializer = EntityImportCreateSerializer(data=entity_data)
                if serializer.is_valid():
                    import_obj = serializer.save()
                    bulk_task_create.apply_async(
                        args=[request_body, str(import_obj.id), tenant],
                        priority=MEDIUM_PRIORITY_TASK
                    )
                    logger.info("{}, Bulk Process Initiation of process started id: {} for tenant: {}".format(
                        get_email(request), pk, tenant))
                    context = {'success': True, 'message': _(
                        'Bulk Import Request Accepted')}
                    return Response(context, status=status.HTTP_200_OK)
                else:
                    internal_error = 6047
                    logger.error(getLogMessage(org_apps_errors, internal_error).format(
                        pk, get_email(request), serializer.errors), internal_error)
                    context = {'success': False, 'message': _(getMessage(org_apps_errors, internal_error)), 'error': str(
                        serializer.errors), 'internal_error': internal_error}
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 6048
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                pk, get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None, tenant=None):
        context = {'error': 'Method not allowed.',
                   'success': False, 'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=True, methods=['post'], name='get-diagram')
    def get_diagram(self, request, pk=None, tenant=None):
        logger.info("requested to return process diagram for id: {}".format(pk))
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 6049
                context = {'error': str(error), 'success': False, 'message': _(
                    getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            ProcessDefinitions = process_engine.ProcessDefinitionsApi
            list_process = ProcessDefinitions.list_process_definitions
            req_body = {}
            req_body["latest"] = True
            req_body["key"] = obj.process_key
            action = call(module=ProcessDefinitions, func=list_process,
                          data=req_body, request=request, type="get", read_replica=True)[0]
            processDefinitionId = action["data"][0]["id"]
            get_model = ProcessDefinitions.get_model_resource
            query_params = {}
            query_params['process_definition_id'] = processDefinitionId
            action = call(module=ProcessDefinitions, func=get_model, data=query_params,
                          request=request, type="get", content_type="image", read_replica=True)[0]
            context = {"success": True, "message": _(
                "process diagram returned successfully.")}
            logger.info(
                "process diagram returned successfully of id: {} for tenant: {}".format(pk, tenant))
            response = HttpResponse(
                action.data, content_type=action.headers.get('content-type'))
            response['Content-Disposition'] = 'inline; filename=' + \
                obj.name+'.png'
            fname = obj.name+'.png'
            return response
        except Exception as error:
            internal_error = 6050
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(
                org_apps_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_required(["org_users.manage_tasks"], raise_exception=True))
    @action(detail=False, methods=['post'], name='group_task_count')
    def group_task_count(self, request, pk=None, tenant=None):
        email=get_email(request)
        try:
            if 'processDefinitionKey' in request.query_params:
                try:
                    obj = self.model.objects.get(
                        process_key=request.query_params['processDefinitionKey'], tenant=tenant)
                except Exception as error:
                    internal_error = 6051
                    context = {'success': False, 'message': _(
                        getMessage(org_apps_errors, internal_error))}
                    logger.error(getLogMessage(org_apps_errors, internal_error).format(
                        pk, tenant, error, email), internal_error)
                    return Response(context, status=status.HTTP_404_NOT_FOUND)
            group_id = request.query_params['group_id']
            selected_group_data = OrganisationGroup.objects.filter(
                id=group_id, tenant=tenant)
            if selected_group_data:
                filter_field = selected_group_data[0].filter_by
            else:
                internal_error = 6052
                context = {'success': False, 'message': _(getMessage(
                    org_apps_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    group_id, tenant, email), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            user_id = request.user.id
            user_data = None
            if user_id is not None:
                user_data = OrganisationUser.default_manager.filter(
                    id=user_id, tenant=tenant)
            if not user_data:
                internal_error = 6053
                context = {'success': False, 'message': _(getMessage(
                    org_apps_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    group_id, user_id, tenant, email=get_email(request)), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            request_data = request.data
            get_data = {}
            var_body = []
            data_filter = request.query_params.copy()
            filter_base_count = []
            temp_req_body = {}
            if "search" in request_data:
                temp_req_body["name"] = request_data["name"]
                temp_req_body["operation"] = "likeIgnoreCase"
                temp_req_body["value"] = request_data["value"]
                temp_req_body["variableOperation"] = "LIKE_IGNORE_CASE"
                var_body.append(temp_req_body)
            else:
                try:
                    if not "deletePrevFilterData" in request_data:
                        data_filter = request.query_params.copy()
                        obj_filter = OrganisationFilter.objects.filter(
                            user=str(user_id))
                        if obj_filter:
                            for filter_data in obj_filter:
                                post_data = {}
                                post_data["active_filter"] = False
                                serializer_filter = self.serializer_class_filter(
                                    filter_data, data=post_data, partial=True)
                                if serializer_filter.is_valid():
                                    serializer_filter.save()
                        if "processDefinitionKey" in request.query_params:
                            obj_filter = OrganisationFilter.objects.filter(user=str(
                                user_id), processDefinitionKey=data_filter['processDefinitionKey'])
                            if obj_filter:
                                if "nameLike" not in data_filter:
                                    data_filter["nameLike"] = None
                                data_filter["active_filter"] = True
                                serializer_filter = self.serializer_class_filter(
                                    obj_filter[0], data=data_filter, partial=True)
                                if serializer_filter.is_valid():
                                    serializer_filter.save()
                            else:
                                data_filter["user"] = str(user_id)
                                data_filter["active_filter"] = True
                                serializer_filter = self.serializer_class_filter(
                                    data=data_filter)
                                if serializer_filter.is_valid():
                                    serializer_filter.save()
                except Exception as error:
                    internal_error = 6054
                    context = {'error': str(error), 'success': False, 'message': _(
                        getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
                    logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                        tenant, email=get_email(request)), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            get_filter_data = OrganisationFilter.objects.filter(
                user=str(user_id), active_filter=True)
            if get_filter_data:
                get_data["nameLike"] = get_filter_data[0].nameLike
                get_data["processDefinitionKey"] = get_filter_data[0].processDefinitionKey
            else:
                get_data["nameLike"] = None
                get_data["processDefinitionKey"] = None

            req_body = {}
            req_body["candidateGroupIn"] = [
                group_id, selected_group_data[0].key]
            req_body["tenantId"] = tenant
            req_body["order"] = "asc"
            if 'processDefinitionKey' in get_data:
                req_body['processDefinitionKey'] = get_data['processDefinitionKey']
            else:
                if 'processDefinitionKey' in request.query_params:
                    req_body['processDefinitionKey'] = request.query_params['processDefinitionKey']
            if 'size' in request.query_params:
                req_body['size'] = request.query_params['size']
            if 'sort' in request.query_params:
                req_body['sort'] = request.query_params['sort']
            if 'order' in request.query_params:
                req_body['order'] = request.query_params['order']
            if 'start' in request.query_params:
                req_body['start'] = request.query_params['start']
            if not "search" in request_data:
                if 'nameLike' in get_data:
                    req_body["nameLike"] = get_filter_task_title(
                        get_data["nameLike"])
            # Checking the System Filter and Filter value
            if filter_field:
                filter_value = get_system_filter_value(filter_field, user_data)
                if filter_value:
                    total = 0
                    data = {}
                    for fil_val in filter_value:
                        filter_data_body = {}
                        temp_var_body = []
                        temp_var_body = temp_var_body+var_body
                        filter_data_body["name"] = filter_field
                        filter_data_body["value"] = fil_val
                        filter_data_body["operation"] = "equals"
                        filter_data_body["variableOperation"] = "EQUALS"
                        temp_var_body.append(filter_data_body)
                        if temp_var_body:
                            req_body["processInstanceVariables"] = temp_var_body
                        Query = process_engine.QueryApi
                        queryTask = Query.query_tasks
                        action = call(module=Query, func=queryTask, data=req_body,
                                      tenant_id=tenant, request=request, type="post", read_replica=True)
                        if action[1] == 200:
                            response_data = action[0]
                            total = total+response_data['total']
                            individual_data = {}
                            individual_data['name'] = fil_val
                            individual_data['value'] = response_data['total']
                            filter_base_count.append(individual_data)
                        else:
                            internal_error = 6055
                            context = {"success": False, "message": _(getMessage(
                                org_apps_errors, internal_error)), "internal_error": internal_error}
                            logger.error(getLogMessage(org_apps_errors, internal_error).format(
                                tenant, email=get_email(request)), internal_error)
                            statusCode = status.HTTP_400_BAD_REQUEST
                            return Response(context, status=statusCode)
                    data['total'] = total
                    context = {"success": True, "message": _(
                        "Group Task Count Returned Successfully"), "data": data, "filterData": get_data, "filter_base_count": filter_base_count}
                    logger.info("{}, Group Task Count Returned Successfully for tenant: {}.".format(
                        tenant, email=get_email(request)))
                    statusCode = status.HTTP_200_OK
                    return Response(context, status=statusCode)

                else:
                    internal_error = 6056
                    context = {"success": False, "message": _(getMessage(
                        org_apps_errors, internal_error).format(filter_field)), "internal_error": internal_error}
                    logger.error(getLogMessage(org_apps_errors, internal_error).format(
                        filter_field, tenant, email=get_email(request)), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            else:
                if var_body:
                    req_body["processInstanceVariables"] = var_body
                Query = process_engine.QueryApi
                queryTask = Query.query_tasks
                action = call(module=Query, func=queryTask, data=req_body,
                              tenant_id=tenant, request=request, type="post", read_replica=True)
                if action[1] == 200:
                    response_data = action[0]
                    data = {}
                    data['total'] = response_data['total']
                    context = {"success": True, "message": _(
                        "Group Task Count Returned Successfully"), "data": data, "filterData": get_data, "filter_base_count": filter_base_count}
                    logger.info("{}, Group Task Count Returned Successfully for tenant: {}.".format(
                        tenant, email))
                    statusCode = status.HTTP_200_OK
                    return Response(context, status=statusCode)
                else:
                    internal_error = 6057
                    context = {"success": False, "message": _(getMessage(
                        org_apps_errors, internal_error)), "internal_error": internal_error}
                    logger.error(getLogMessage(org_apps_errors, internal_error).format(
                        email), internal_error)
                    statusCode = status.HTTP_400_BAD_REQUEST
                    return Response(context, status=statusCode)
        except Exception as error:
            internal_error = 6058
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(error,
                                                                                   tenant, email=get_email(request)), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], name='bulk_task_complete')
    def bulk_task_complete(self,request, tenant=None):
        logger.info("{} requested to start Bulk task complete for tenant: {}".format(
            get_email(request), tenant))
        try:
            task_id_list = request.data["task_ids"]
            formkey = request.data['formKey']
            actual_form_key, form_version = formkey.split("::")
            form = OrganisationForm.objects.filter(key=actual_form_key, version=form_version, tenant__id=tenant).first().keytypepair
            variables = task_variable_update(request, request.data, get_key_type(form))
            request_body_complete = {
                "action": "complete",
                "variables": variables
            }
            request_body_claim = {
                "action": "claim",
                "assignee": request.user.userId
            }

            bulk_task_complete.apply_async(
                args=[],
                kwargs={"task_id_list" : task_id_list, "request_body_complete" : request_body_complete, "request_body_claim" : request_body_claim, "tenant_id" : tenant},
                priority=HIGH_PRIORITY_TASK
            )
            context = {'success': True, 'message': _('Bulk Task Complete Request Accepted')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6103
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception("Failed to submit bulk task complete")
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], name='withdraw_process')
    def withdraw_process(self,request, tenant=None):
        logger.info("{} requested to start withdraw_process for tenant: {}".format(get_email(request), tenant))
        try:
            data = request.data
            logger.info(data)
            withdraw_parameter = data["uuid"]
            withdraw_process = data["process"]
            Query = process_engine.QueryApi
            query_process = Query.query_historic_process_instance
            req_body = {}
            req_body["tenantId"] = tenant
            req_body["processInstanceNameLike"] = withdraw_parameter + "%"
            req_body["includeProcessVariables"] = False
            req_body["finished"] =False
            req_body["processDefinitionKeys"] = withdraw_process
            logger.info(req_body)
            response_data, response_status = call(module=Query, func=query_process, data=req_body, request=request, tenant_id=tenant, type="post", read_replica=False)
            if response_status > 300:
                context = {'success': False, 'error' : response_data}
                return Response(context, status=response_status)
            else:
                list_of_process__to_be_withdrawn = [item["id"] for item in response_data["data"]]
                req_body = {
                "action": "delete",
                "instanceIds": list_of_process__to_be_withdrawn,
                "deleteReason": "Process Withdraw"
                }
                org_license = OrganisationLicense.objects.get(organisation=tenant)
                process_url = org_license.processengine
                url = process_url + "service/runtime/process-instances/delete"
                logger.info(req_body)
                withdraw_request = requests.request("POST", url,json=req_body, auth=HTTPBasicAuth(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), headers={"Content-Type" : "application/json"}, verify= False)
                if withdraw_request.status_code > 300:
                    context = {'success': False, 'error' : withdraw_request.text}
                    return Response(context, status=withdraw_request.status_code)
            context = {'success': True, 'message': _('withdraw Process Request completed')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6103
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception("Failed to withdraw Process")
            logger.exception(error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




# TODO : Generalised permissions implementation


class ProcessCountViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationWorkflow
    queryset = OrganisationWorkflow.objects.all()
    serializer_class = OrganisationWorkflowSerializer

    def list(self, request, tenant=None):
        email=get_email(request)
        logger.info("{} requested to list Organisation process details".format(
            tenant, email))
        try:
            HistoryProcess = process_engine.HistoryProcessApi
            list_historic_process = HistoryProcess.list_historic_process_instances
            Query = process_engine.QueryApi
            query_process = Query.query_process_instances

            # TODO exception handling for Process Engine Calls
            # TODO This API has to user specific, for a normal user who has access to few workflows should see the count based only those workflows context.
            response = {}
            req_body = {}

            # ongoing Process
            response["ongoing"] = call(
                module=Query, func=query_process, request=request, tenant_id=tenant, type="post", read_replica=True)[0]["total"]

            req_body["finished"] = True
            req_body["deleted"] = False
            # completed Process
            response["completed"] = call(
                module=HistoryProcess, func=list_historic_process, data=req_body, request=request, tenant_id=tenant, type="get", read_replica=True)[0]["total"]

            req_body["deleted"] = True
            # withdrawn Process
            response["withdrawn"] = call(
                module=HistoryProcess, func=list_historic_process, data=req_body, request=request, tenant_id=tenant, type="get", read_replica=True)[0]["total"]

            context = {"success": True, "message": _(
                "Organisation process details retrieved successfully."), "data": response}
            logger.info("{}, Organisation process details retrieved successfully.".format(
                tenant, email))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6059
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(error,
                                                                                   tenant, email), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, tenant=None, pk=None):
        logger.info("request to retrive Organisation process details for id: {}".format(pk))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 6060
                context = {'error': str(error), 'success': False, 'message': _(
                    getMessage(org_apps_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            req_body_filter = {}
            req_body_filter["variables"] = []
            if obj.custom_default_filter and "vendor" in obj.custom_default_filter and tenant != str(request.user.tenant.id):
                req_body_filter["variables"].append({"name": obj.custom_default_filter["vendor"], "operation": "equals", "variableOperation": "EQUALS", "value": tenant})
            # org_user = OrganisationUser.default_manager.get(email=email)

            response = {}
            Query = process_engine.QueryApi
            query_historic_process = Query.query_historic_process_instance
            query_process = Query.query_process_instances

            # completed Process
            completed_data = process_data(request, True, False, tenant, obj.process_key, req_body_filter)
            response["completed"] = call(module=Query, func=query_historic_process, tenant_id=tenant,data=completed_data, request=request, type="post", read_replica=True)[0]["total"]

            # Withdrawn Process
            withdrawn_data = process_data(request, True, True, tenant, obj.process_key, req_body_filter)
            response["withdrawn"] = call(module=Query, func=query_historic_process, tenant_id=tenant,data=withdrawn_data, request=request, type="post", read_replica=True)[0]["total"]

            # Ongoing Process
            ongoing_data = process_data(request, None, None, tenant, obj.process_key, req_body_filter)
            response["ongoing"] = call(module=Query, func=query_process, tenant_id=tenant,data=ongoing_data, request=request, type="post", read_replica=True)[0]["total"]

            context = {"success": True, "message": _(
                "Count of completed, withdrawn and ongoing processes for an Organisation Workflow retrieved successfully."), "data": response}
            logger.info(
                "Count of completed, withdrawn and ongoing processes for an Organisation Workflow retrieved successfully for id: {}.".format(pk))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6061
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(
                org_apps_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# TODO : Generalised permissions implementation
class StartProcessFormViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationWorkflow
    queryset = OrganisationWorkflow.objects.all()
    serializer_class = OrganisationWorkflowSerializer

    def retrieve(self, request, pk=None, tenant=None):
        logger.info("{} request to retrive the organisation workflow for id: {} for tenant: {}".format(
            get_email(request), pk, tenant))
        try:
            try:
                try:
                    u = uuid.UUID(pk)
                    obj = self.model.objects.get(id=pk, tenant__id=tenant)
                except:
                    obj = self.model.objects.get(app_key=pk, tenant__id=tenant)
            except PermissionDenied as error:
                context = {'error': str(
                    error), 'success': False, 'message': _(error.detail)}
                logger.warning("{}, Failed to retrieve the organisation workflow for id: {}, due to: {}".format(
                    get_email(request), pk, error))
                return Response(context, status=status.HTTP_403_FORBIDDEN)
            except NotAuthenticated as error:
                context = {'error': str(
                    error), 'success': False, 'message': _(error.detail)}
                logger.warning("{}, Failed to retrieve the organisation workflow for id: {}, due to: {}".format(
                    get_email(request), pk, error))
                return Response(context, status=status.HTTP_401_UNAUTHORIZED)
            except Exception as error:
                internal_error = 6062
                context = {'error': str(error), 'success': False, 'message': _(
                    getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    pk, get_email(request), error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            if obj.is_admin_initiable:
                transaction_id = None
                if "transactionId" in request.query_params and request.query_params["transactionId"]:
                    transaction_id = request.query_params["transactionId"]
                response = get_process_key_util(
                    request, obj, tenant, transaction_id=transaction_id)
                logger.info("{} request to retrive the organisation workflow for id: {} for tenant: {}".format(
                    get_email(request), pk, tenant))
                return response
            else:
                context = {'error': "Action Forbidden", 'success': False, 'message': _(
                    'Sorry! This process can only be initiated by an external user by clicking on the web link or scanning the QR code.')}
                logger.error("{}, Failed to retrieve the organisation workflow for id: {}, due to: {}".format(
                    get_email(request), pk, context))
                return Response(context, status=status.HTTP_403_FORBIDDEN)
        except Exception as error:
            internal_error = 6063
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                pk, get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StartProcessOpenFormViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationWorkflow
    queryset = OrganisationWorkflow.objects.all()
    serializer_class = OrganisationWorkflowSerializer

    def list(self, request, tenant=None, pk=None):
        context = {'error': 'Method not allowed.',
                   'success': False, 'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def retrieve(self, request, tenant=None, pk=None):
        logger.info("{} requested to retrive the organisation workflow for tenant {} for id: {}".format(
            pk, tenant, email=get_email(request)))
        try:
            # TODO exception handling for Process Engine Calls
            try:
                obj = self.get_object()
            except Exception as error:
                internal_error = 6064
                context = {'error': str(error), 'success': False, 'message': _(
                    getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    pk, get_email(request), error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            if "transactionId" in request.query_params and request.query_params["transactionId"]:
                transaction_id = request.query_params["transactionId"]
            else:
                transaction_id = None
            response = get_process_key_util(
                request, obj, tenant, transaction_id=transaction_id)
            return response
        except Exception as error:
            internal_error = 6065
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getMessage(org_apps_errors, internal_error).format(
                pk, error, tenant, email=get_email(request)), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# TODO : Generalised permissions implementation
class DashboardChartViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationWorkflow
    queryset = OrganisationWorkflow.objects.all()
    serializer_class = None

    def list(self, request, tenant):
        email=get_email(request)
        logger.info("{} requested to list Organisation process details".format(
            email))
        try:

            response = {}
            # TODO exception handling for Process Engine Calls
            start_year = int(request.query_params["startYear"])
            start_month = int(request.query_params["startMonth"])
            end_year = int(request.query_params["endYear"])
            end_month = int(request.query_params["endMonth"])
            iterate_month = months(
                start_month, start_year, end_month, end_year)
            var = []
            for curr_month in iterate_month:
                month_year = calendar.month_abbr[curr_month[0]]
                response = {}
                response["name"] = "initiated"
                response["month"] = month_year
                start_curr = str(
                    (datetime(curr_month[1], curr_month[0], 1)).date())
                end_curr = str((datetime(curr_month[1], curr_month[0], monthrange(
                    curr_month[1], curr_month[0])[1]) - timedelta(days=-1)).date())

                start_curr = utc_date_conversion(start_curr)
                end_curr = utc_date_conversion(end_curr)

                # INITIATED PROCESS FOR EACH MONTH
                Query = process_engine.QueryApi
                query_historic_process = Query.query_historic_process_instance
                req_body = {}
                req_body["startedAfter"] = start_curr
                req_body["startedBefore"] = end_curr
                response["value"] = call(module=Query, func=query_historic_process, tenant_id=tenant,
                                         data=req_body, request=request, type="post", read_replica=True)[0]["total"]

                var.append(response)

            for curr_month in iterate_month:
                month_year = calendar.month_abbr[curr_month[0]]
                response = {}
                response["name"] = "completed"
                response["month"] = month_year
                start_curr = str(
                    (datetime(curr_month[1], curr_month[0], 1)).date())
                end_curr = str((datetime(curr_month[1], curr_month[0], monthrange(
                    curr_month[1], curr_month[0])[1]) - timedelta(days=-1)).date())

                # COMPLETED PROCESS FOR EACH MONTH
                req_body = {}
                req_body["finishedAfter"] = start_curr
                req_body["finishedBefore"] = end_curr
                req_body['finished'] = True
                req_body["deleted"] = False
                response["value"] = call(module=Query, func=query_historic_process,
                                         data=req_body, request=request, type="post", read_replica=True)[0]["total"]

                var.append(response)

            context = {"success": True, "message": _(
                "Organisation process details retrieved successfully."), "data": var}
            logger.info("{}, Organisation process details retrieved successfully.".format(
                email))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6069
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, tenant, pk=None):
        email=get_email(request)
        logger.info("{} requested to retrive Count of completed and ongoing processes for an Organisation Workflow for id: {}".format(
            email, pk))
        try:
            try:
                obj = self.get_object()
            except PermissionDenied as error:
                context = {'error': str(
                    error), 'success': False, 'message': _(error.detail)}
                logger.warning("{}, Failed to retrieve count of completed and ongoing processes for organisation workflow for id: {}, due to: {}".format(
                    email, pk, error))
                return Response(context, status=status.HTTP_403_FORBIDDEN)
            except NotAuthenticated as error:
                context = {'error': str(
                    error), 'success': False, 'message': _(error.detail)}
                logger.warning("{}, Failed to retrieve count of completed and ongoing processes for organisation workflow for id: {}, due to: {}".format(
                    email, pk, error))
                return Response(context, status=status.HTTP_401_UNAUTHORIZED)
            except Exception as error:
                internal_error = 6070
                context = {'error': str(error), 'success': False, 'message': _(
                    getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    pk, email, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            response = {}
            start_year = int(request.query_params["startYear"])
            start_month = int(request.query_params["startMonth"])
            end_year = int(request.query_params["endYear"])
            end_month = int(request.query_params["endMonth"])
            iterate_month = months(
                start_month, start_year, end_month, end_year)
            var = []
            for curr_month in iterate_month:
                month_year = calendar.month_abbr[curr_month[0]]
                response = {}
                response["name"] = "initiated"
                response["month"] = month_year
                start_curr = str(
                    (datetime(curr_month[1], curr_month[0], 1)).date())
                end_curr = str((datetime(curr_month[1], curr_month[0], monthrange(
                    curr_month[1], curr_month[0])[1]) - timedelta(days=-1)).date())

                start_curr = utc_date_conversion(start_curr)
                end_curr = utc_date_conversion(end_curr)

                # INITIATED PROCESS FOR EACH MONTH
                req_body = {}
                req_body["startedAfter"] = start_curr
                req_body["startedBefore"] = end_curr
                req_body["processDefinitionKey"] = obj.process_key
                if obj.custom_default_filter and "vendor" in obj.custom_default_filter and tenant != str(request.user.tenant.id):
                    req_body["variables"] = []
                    req_body["variables"].append({"name": obj.custom_default_filter["vendor"], "operation": "equals", "variableOperation": "EQUALS", "value": tenant})
                Query = process_engine.QueryApi
                query_historic_process = Query.query_historic_process_instance
                response["value"] = call(module=Query, func=query_historic_process, tenant_id=tenant,
                                         data=req_body, request=request, type="post", read_replica=True)[0]["total"]

                var.append(response)

            for curr_month in iterate_month:
                month_year = calendar.month_abbr[curr_month[0]]
                response = {}
                response["name"] = "completed"
                response["month"] = month_year
                start_curr = str(
                    (datetime(curr_month[1], curr_month[0], 1)).date())
                end_curr = str((datetime(curr_month[1], curr_month[0], monthrange(
                    curr_month[1], curr_month[0])[1]) - timedelta(days=-1)).date())

                # COMPLETED PROCESS FOR EACH MONTH
                req_body = {}
                req_body["finishedAfter"] = start_curr
                req_body["finishedBefore"] = end_curr
                req_body["processDefinitionKey"] = obj.process_key
                req_body['finished'] = True
                req_body["deleted"] = False
                if obj.custom_default_filter and "vendor" in obj.custom_default_filter and tenant != str(request.user.tenant.id):
                    req_body["variables"] = []
                    req_body["variables"].append({"name": obj.custom_default_filter["vendor"], "operation": "equals", "variableOperation": "EQUALS", "value": tenant})
                response["value"] = call(module=Query, func=query_historic_process, tenant_id=tenant,
                                         data=req_body, request=request, type="post", read_replica=True)[0]["total"]

                var.append(response)

            context = {"success": True, "message": _(
                "Count of completed and ongoing processes for an Organisation Workflow retrieved successfully."), "data": var}
            logger.info("{}, Count of completed and ongoing processes for an Organisation Workflow retrieved successfully for id: {}".format(
                email, pk))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6071
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                pk, email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DatedProcessCountViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationWorkflow
    queryset = OrganisationWorkflow.objects.all()
    serializer_class = None

    def list(self, request, pk=None):
        context = {'error': 'Method not allowed.',
                   'success': False, 'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def retrieve(self, request, pk=None):
        logger.info(
            "Count of completed and ongoing processes for an Organisation Workflow for id: {}".format(pk))
        try:
            Query = process_engine.QueryApi
            query_historic_process = Query.query_historic_process_instance
            try:
                obj = self.get_object()
            except PermissionDenied as error:
                context = {'error': str(
                    error), 'success': False, 'message': _(error.detail)}
                return Response(context, status=status.HTTP_403_FORBIDDEN)
            except NotAuthenticated as error:
                context = {'error': str(
                    error), 'success': False, 'message': _(error.detail)}
                return Response(context, status=status.HTTP_401_UNAUTHORIZED)
            except Exception as error:
                internal_error = 6074
                context = {'error': str(error), 'success': False, 'message': _(
                    getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            response = {}
            if not len(request.query_params) == 0:
                start_year = int(request.query_params["startYear"])
                start_month = int(request.query_params["startMonth"])
                start_date = int(request.query_params["startDate"])
                end_year = int(request.query_params["endYear"])
                end_month = int(request.query_params["endMonth"])
                end_date = int(request.query_params["endDate"])
                start_curr = str(
                    (datetime(start_year, start_month, start_date)).date())
                end_curr = str(
                    (datetime(end_year, end_month, end_date)).date())

                # INITIATED PROCESS
                req_body = {}
                req_body["startedAfter"] = start_curr
                req_body["startedBefore"] = end_curr
                req_body["processDefinitionKey"] = obj.process_key
                response["initiated"] = call(
                    module=Query, func=query_historic_process, data=req_body, request=request, type="post", read_replica=True)[0]["total"]

                # COMPLETED PROCESS
                req_body['finished'] = True
                req_body["deleted"] = False
                response["completed"] = call(
                    module=Query, func=query_historic_process, data=req_body, request=request, type="post", read_replica=True)[0]["total"]

                # WITHDRAW PROCESS
                req_body["deleted"] = True
                response["withdrawn"] = call(
                    module=Query, func=query_historic_process, data=req_body, request=request, type="post", read_replica=True)[0]["total"]

                context = {"success": True, "message": _(
                    "Count of completed and ongoing processes for an Organisation Workflow retrieved successfully."), "data": response}
                logger.info(
                    "Count of completed and ongoing processes for an Organisation Workflow retrieved successfully for id: {}".format(pk))
                return Response(context, status=status.HTTP_200_OK)
            else:
                req_body = {}
                # INITIATED PROCESS
                req_body["processDefinitionKey"] = obj.process_key
                response["initiated"] = call(
                    module=Query, func=query_historic_process, data=req_body, request=request, type="post", read_replica=True)[0]["total"]

                # COMPLETED PROCESS
                req_body['finished'] = True
                req_body["deleted"] = False
                response["completed"] = call(
                    module=Query, func=query_historic_process, data=req_body, request=request, type="post", read_replica=True)[0]["total"]

                # WITHDRAW PROCESS
                req_body["deleted"] = True
                response["withdrawn"] = call(
                    module=Query, func=query_historic_process, data=req_body, request=request, type="post", read_replica=True)[0]["total"]
                context = {"success": True, "message": _(
                    "Count of completed and ongoing processes for an Organisation Workflow retrieved successfully."), "data": response}
                logger.info(
                    "Count of completed and ongoing processes for an Organisation Workflow retrieved successfully for id: {}".format(pk))
                return Response(context, status=status.HTTP_200_OK)

        except Exception as error:
            internal_error = 6075
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(
                org_apps_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProcessDataViewset(viewsets.GenericViewSet, mixins.CreateModelMixin):
    queryset = OrganisationWorkflow.objects.all()
    model = OrganisationWorkflow
    permission_classes = [AllowAny]
    serializer_class_filter = CreateFilterSerializer
    serializer_class = EmptySerializer

    def create(self, request, tenant=None, *args, **kwargs):
        try:
            request_data = request.data.copy()
            processDefinitionKey = request_data.get('processDefinitionKey')
            search = request_data.get('search', None) 
            req_body = {}
            req_body_filter = {}
            req_body_filter["variables"] = []
            if "selectedState" in request_data and request_data["selectedState"] != None:
                req_body_filter["variables"].append({"name": "entityState", "operation": "equals", "variableOperation": "EQUALS", "value": request_data["selectedState"]})
            if "filter_query" in request_data:
                filter_query = {}
                filter_query = request_data.get('filter_query')
                for query in filter_query.keys():
                    req_body_filter["variables"].append({"name": query, "operation": "equals", "variableOperation": "EQUALS", "value": filter_query[query]})
            if search:
                req_body_filter["variables"].append({"name": search['name'], "operation": "likeIgnoreCase", "variableOperation": "LIKE_IGNORE_CASE", "value": search['value']})
            Query = process_engine.QueryApi
            query_historic_process = Query.query_historic_process_instance
            if processDefinitionKey:
                obj = self.model.objects.get(process_key=processDefinitionKey, tenant=tenant)
                req_body["processDefinitionKey"] = obj.process_key
                if "vendor_policy" in request.query_params and obj.custom_default_filter:
                    if "vendor" in obj.custom_default_filter:
                        req_body_filter["variables"].append({"name": obj.custom_default_filter["vendor"], "operation": "equals", "variableOperation": "EQUALS", "value": request.query_params["vendor_policy"]})
            if 'start' in request_data:
                req_body['start'] = request_data.get('start')
            if 'size' in request_data:
                req_body['size'] = request_data.get('size')
            req_body['sort'] = request_data['sort']
            req_body['order'] = request_data['order']
            if 'deleted' in request_data:
                req_body['deleted'] = request_data['deleted']
            if 'finished' in request_data:
                req_body['finished'] = request_data['finished']
            req_body["variables"] = req_body_filter["variables"]
            response = call(module=Query, func=query_historic_process,data=req_body, request=request, type="post", tenant_id=tenant, read_replica=True)
            status_code = response[1]
            response_data = response[0]
            processInstanceIds = []
            for process in response_data['data']:
                processInstanceIds.append(process['id'])
            if len(processInstanceIds) > 0:
                req_body['includeProcessVariables'] = True
                req_body['processInstanceIds'] = processInstanceIds
                if 'start' in req_body:
                    req_body.pop('start')
                process_data = call(module=Query, func=query_historic_process,data=req_body, request=request, type="post", tenant_id=tenant, read_replica=True)
                response_data['data'] = process_data[0]['data']
                status_code = process_data[1]
            context = {}
            context['success'] = True
            if 'deleted' in request_data and 'finished' in request_data:
                if request_data['deleted'] == False and request_data['finished'] == False:
                    context['message'] = 'Ongoing data retreived successfully'
                    logger.info("Ongoing processes for an Organisation Workflow retrieved successfully for id: {}.".format(
                        processDefinitionKey))
                elif request_data['deleted'] == False and request_data['finished'] == True:
                    context['message'] = 'Completed data retreived successfully'
                    logger.info("Completed processes for an Organisation Workflow retrieved successfully for id: {}.".format(
                        processDefinitionKey))
                else:
                    context['message'] = 'Withdrawn data retreived successfully'
                    logger.info("Withdrawn for an Organisation Workflow retrieved successfully for id: {}.".format(
                        processDefinitionKey))
            context['data'] = response_data
            return Response(context, status=status_code)
        except Exception as error:
            internal_error = 6079
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(
                org_apps_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProcessViewViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = ProcessView
    queryset = ProcessView.objects.all()
    serializer_class = ProcessViewSerializer
    filter_backends = (filters.SearchFilter, )
    search_fields = ('app', 'role',)

    @method_decorator(permission_and_license_required(["org_apps.add_processview", ]))
    def create(self, request, tenant=None, **args):
        email=get_email(request)
        logger.info("{} send the Process View data to create".format(
            email))
        try:
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _(
                    "Process View has been added successfully."), "data": self.serializer_class(obj).data}
                logger.info("{}, Process View has been created successfully".format(
                    email))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 6080
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_apps_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_apps_errors, internal_error).format(
                email, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 6081
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error))}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @method_decorator(permission_and_license_required(["org_apps.change_processview", ]))
    def partial_update(self, request, pk=None):
        logger.info("{}, requested Partial update for id: {} in Process View".format(
            get_email(request), pk))
        try:
            try:
                obj = self.get_object()
            except Exception as error:
                internal_error = 6082
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(
                obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {
                    "success": True, "message": _("Organisation Process View details updated successfully."), "data": self.serializer_class(obj).data}
                logger.info("{}, Data of id: {} partially updated in Process View".format(
                    get_email(request), pk))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 6083
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.error(getLogMessage(org_apps_errors, internal_error).format(
                pk, get_email(request), serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 6084
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                pk, get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_apps.view_processview", ]))
    def list(self, request, tenant=None):
        email=get_email(request)
        logger.info("{} requested the list of Process View".format(
            email))
        try:
            page = self.paginate_queryset(
                self.filter_queryset(self.get_queryset().filter(tenant=tenant)))
            if page is not None:
                serializer = self.serializer_class(
                    page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(
                    self.filter_queryset(self.get_queryset().filter(tenant=tenant)), many=True)
            context = {
                "success": True, "message": _("Process View details returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{}, List of Process View sent sucessfully".format(
                email, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6085
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_apps.view_processview", ]))
    def retrieve(self, request, tenant=None, pk=None):
        email=get_email(request)
        logger.info("{} requested the details for id: {} from Process View.".format(
            email, tenant, pk))
        try:
            try:
                obj = self.get_object()
            except Exception as error:
                internal_error = 6086
                context = {'error': str(
                    error), 'success': False, 'message': getMessage(org_apps_errors, internal_error), 'internal_error': internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    pk, email, tenant, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {
                "success": True, "message": _("Organisation Process View data has retrieved successfully."), "data": serializer.data}
            logger.info("{}, Details for id: {} from Process View sent sucessfully".format(
                email, tenant, pk))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6087
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                pk, email, tenant, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @method_decorator(permission_and_license_required(["org_apps.delete_processview", ]))
    def destroy(self, request, pk=None):
        logger.info("{} requested to delete id: {} from suppliers".format(
            get_email(request), pk))
        try:
            try:
                obj = self.get_object()
            except Exception as error:
                internal_error = 6088
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_apps_errors, internal_error).format(
                    pk, get_email(request), error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            self.perform_destroy(obj)
            context = {
                "success": True, "message": _("Organisation Process View deleted successfully."), "data": None}
            logger.info("{}, Id: {} deleted successfully from Process View.".format(
                get_email(request), pk))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6089
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(
                pk, get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None):
        context = {'error': '', 'success': False,
                   'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=True, methods=['get'], name="process-view-data")
    def process_view_data(self, request, tenant=None, pk=None):
        app_id = pk
        email=get_email(request)
        data = {}
        process_view_data = ProcessView.objects.filter(
            app=app_id)
        if process_view_data:
            data['id'] = str(process_view_data[0].id)
            data['app'] = str(process_view_data[0].app_id)
            data['role'] = str(process_view_data[0].role_id)
            data['selected_forms'] = process_view_data[0].selected_forms
            data['selected_form_fields'] = process_view_data[0].selected_form_fields
        context = {
            "success": True, "message": _("Organisation Process View data has retrieved successfully."), "data": data}
        logger.info("{}, Details for id: {} from Process View sent sucessfully".format(
            email, pk))
        return Response(context, status=status.HTTP_200_OK)


def get_email(request):
    return request.user.email if hasattr(request.user, 'email') else "AnonymousUser"

class OrganisationWorkflowAccessViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = WorkflowAccess
    queryset = WorkflowAccess.objects.all()
    serializer_class = WorkflowAccessSerializer
    filter_backends = (DjangoFilterBackend,
                       CustomSearchFilter, filters.OrderingFilter,)
    search_fields = OrganisationWorkflowAccess__filter_fields
    filter_fields = get_filter_fields(OrganisationWorkflowAccess__filter_fields)
    ordering_fields = OrganisationWorkflowAccess__filter_fields

    def list(self, request, tenant=None):
        email=get_email(request)
        logger.info("{} request to list of workflow access based on policy and tenant: {}".format(
            tenant, email))
        try:
            workflow_access_serializer = self.serializer_class(
                self.filter_queryset(
                    self.get_queryset()
                    .filter(app__tenant_id=tenant)
                ),
                many=True
            )
                         
            context = {"success": True, "message": _(
                "Workflow access data returned successfully."), "data": workflow_access_serializer.data }
            logger.info("{}, Organisation Workflow Access data returned successfully for tenant based on policy: {}.".format(
                tenant, email))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6105
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request, tenant=None):
        email=get_email(request)
        logger.info("{} updating workflow access based on policy: {}".format(email, tenant))
        try:
            for req_data in request.data:
                
                insert_data = {
                    "app_id": req_data.get("app_id", ""),
                    "view": bool(req_data.get("view", False)),
                    "reassign": bool(req_data.get("reassign", False)),
                    "withdraw": bool(req_data.get("withdraw", False)),
                    "bulk_initiate": bool(req_data.get("bulk_initiate", False)),
                    "initiate": bool(req_data.get("initiate", False)),
                    "upload": bool(req_data.get("upload", False)),
                    "filter_on_task": bool(req_data.get("filter_on_task", False)),
                    "policy_id": req_data.get("policy_id", "")
                }
                
                if req_data.get("id", ""):
                    self.model.objects.filter(id=req_data.get("id", "")).update(**insert_data)
                else:
                    self.model.objects.create(**insert_data)
            
            context = {"success": True, "message": _(
                    "Workflow access details updated successfully."), "data": None}
            logger.info("{}, Workflow access details updated successfully for tenant: {}".format(
                email, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 6106
            context = {'error': str(error), 'success': False, 'message': _(
                getMessage(org_apps_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_apps_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
