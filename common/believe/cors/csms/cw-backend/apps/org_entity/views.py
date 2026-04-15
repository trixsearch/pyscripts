import io
import os
import tempfile
import uuid
from datetime import datetime
from dateutil import parser
import xlsxwriter
import json
import requests
from urllib.request import urlretrieve
from apps.organisations.models import Organisation
from weasyprint import HTML
from django.db.models import Q
from django.db import connection
from django.core.files import File
from django.utils.translation import gettext as _
from django.utils import timezone
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from django.template import Template, Context
from rest_framework_api_key.permissions import HasAPIKey
from rest_framework.decorators import action
from rest_framework import status, viewsets, filters
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from django.core import serializers as core_serializers
from django.template.loader import render_to_string
import shutil

import process_engine
from utils.CustomSearch import CustomSearchFilter, get_filter_fields
from ezedox.settings import BASE_ORG_DOMAIN_URL, HIGH_PRIORITY_TASK, MEDIUM_PRIORITY_TASK, ONGRID_PROXY_URL
from apps.org_apps.models import OrganisationWorkflow
from apps.org_users.utils import get_tenant
from apps.org_form.models import OrganisationForm
from apps.organisations.models import OrganisationLicense
from apps.org_import.serializers import EntityImportCreateSerializer
from apps.org_import.models import EntityImport
from apps.org_config.models import CustomAttribute
from apps.org_users.models import OrganisationUser
from apps.org_apps.utils import get_uploaded_file, bulk_task_create
from apps.org_form.utils import GetComponentsController, get_nonhidden_label, get_nonhidden_key_type, get_non_hidden_required_labels
from apps.org_apps.serializers import OrganisationWorkflowDetailsSerializer
from apps.org_config.utils import create_master_data_report
from utils.loggerwrapper import Logger, getMessage, getLogMessage
from utils.process_engine_proxy import call
from utils.prime_generic_methods import get_custom_field_errors
from .serializers import (OrganisationEntityMasterModelSerializer,
                          OrganisationEntityMasterDataSerializer,
                          OrganisationEntityViewSerializer,
                          OrganisationEntityAuditLogViewSerializer,
                          OrganisationEntityMasterDataListSerializer,
                          OrganisationEntityViewCreateSerializer,
                          OrganisationEntityViewListSerializer,
                          OrganisationEntityMasterDataAllSerializer,
                          OrganisationEntityMasterDataGetIdSerializer,
                          OrganisationEntityFirstDataSerializer,
                          UpdateDataSerializer,
                          CandidateHistorytSerializer)

from .utils import add_entity_audit_log, update_entity, remove_extra_keys
from .models import (OrganisationEntityMasterModel,
                    OrganisationEntityMasterData,
                    OrganisationEntityView,
                    OrganisationEntityAuditLog,
                    CandidateHistoryModel)
from .internal_errors import org_entity_errors
from .filters import OrganisationEntityMasterModel_filter_fields, OrganisationEntityMasterData_filter_fields
from apps.org_jobs.models import JobCandidate, Job, HiringEvent, HiringPartner, JobCandidateStage
from apps.org_jobs.serializers import JobCandidateCreateSerializer, JobCandidateStageSerializer
from .utils import transfer_entity
logger = Logger(__name__)

ADD = "INC"
SUB = "DEC"
# Create your views here.
class OrganisationEntityMasterModelViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationEntityMasterModel
    queryset = OrganisationEntityMasterModel.objects.all()
    serializer_class = OrganisationEntityMasterModelSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    filterset_fields = get_filter_fields(OrganisationEntityMasterModel_filter_fields)
    ordering_fields = OrganisationEntityMasterModel_filter_fields
    search_fields = OrganisationEntityMasterModel_filter_fields

    # def get_permissions(self):
    #     if self.action == 'list':
    #         permission_classes=[IsAuthenticated]
    #         return [permission() for permission in permission_classes]
    #     if self.action == 'retrieve':
    #         permission_classes=[AllowAny]
    #         return [permission() for permission in permission_classes]
    #     permission_classes = [has_open_access_or_has_api_key_access_or_individual_permission]
    #     return [permission(["manage_masterrecords", ]) for permission in permission_classes]

    def create(self, request, tenant=None, **args):
        try:
            # context = {"request_user":request.user}
            # serializer = self.serializer_class(data=request.data, context=context)
            req_data = request.data.copy()
            req_data["tenant"] = Organisation.objects.get(key=tenant).id
            serializer = self.serializer_class(data=req_data)
            if serializer.is_valid():
                serializer.save()
                context = {"success": True, "message": _("Record has been added successfully."), "data": serializer.data}
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 10001
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_entity_errors, internal_error).format(serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 10002
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(str(error)), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def list(self, request, tenant=None):
        try:
            pagination_data = None
            context = {"request_user":request.user}
            filtered_queryset = self.filter_queryset(self.get_queryset().filter(is_visible=True, tenant__id=tenant))
            page = self.paginate_queryset(filtered_queryset)

            if page is not None:
                serializer = self.serializer_class(page, many=True, context=context)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True)

            context = {"success": True, "message": _("Record returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10003
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(str(error)), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, pk=None, tenant=None):
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 10004
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            context = {"request_user":request.user}
            serializer = self.serializer_class(obj, data=request.data, partial=True, context=context)
            if serializer.is_valid():
                serializer.save()
                context = {"success": True, "message": _("Record updated successfully"), "data": self.serializer_class(obj, fields=('id', 'name', 'description'), context=context).data}
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 10005
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_entity_errors, internal_error).format(pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 10006
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, pk=None, tenant=None):
        try:
            try:
                try:
                    u = uuid.UUID(pk)
                    obj = self.model.objects.get(id=pk, tenant__id=tenant)
                except:
                    obj = self.model.objects.get(key=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 10007
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            context_data = {"request_user":request.user}
            serializer = self.serializer_class(obj, context=context_data)
            context = {"success": True, "message": _("Record retrieved successfully"), "data": serializer.data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10008
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None, tenant=None):
        context = {'error': '', 'success': False, 'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def update(self, request, pk=None, tenant=None):
        context = {'error': '', 'success': False, 'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)


class OrganisationEntityMasterDataViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationEntityMasterData
    queryset = OrganisationEntityMasterData.objects.all()
    serializer_class = OrganisationEntityMasterDataSerializer
    list_serializer_class = OrganisationEntityMasterDataListSerializer
    all_serializer_class = OrganisationEntityMasterDataAllSerializer
    get_id_serializer_class = OrganisationEntityMasterDataGetIdSerializer
    first_data_serializer_class = OrganisationEntityFirstDataSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = OrganisationEntityMasterData_filter_fields
    filter_fields = get_filter_fields(OrganisationEntityMasterData_filter_fields)
    ordering_fields = OrganisationEntityMasterData_filter_fields

    def get_queryset(self):
        qs = OrganisationEntityMasterData.objects.all()
        for item in self.request.query_params.keys():
            if item.startswith("entity_data__"):
                value = self.request.query_params[item]
                # if value.isdigit():
                #     value = int(value)
                qs = qs.filter(**{item: value})
        if 'ordering' in self.request.query_params.keys():
            qs = qs.order_by(self.request.query_params['ordering'])
        return qs

    def create(self, request, tenant=None, **args):
        try:
            req_data = request.data.copy()
            try:
                process_instance_id = req_data['processInstanceId']
                # Checking if master data for an entity is already created
                lookup_data = {"processInstanceId" : process_instance_id}
                is_entity_present = self.model.objects.filter(entity_data__contains=lookup_data, entity_model__tenant__id=tenant).exists()
                if not is_entity_present:
                    master_model_key = req_data['masterModelKey']
                    logger.info("data received for Record {} with process id {} for tenant: {}".format(master_model_key, process_instance_id, tenant))
                    master_model_obj = OrganisationEntityMasterModel.objects.get(key=master_model_key, tenant__id=tenant)
                    master_model_id = str(master_model_obj.id)
                    unique_key = master_model_obj.unique_field
                    action, status_code = call(module = process_engine.ProcessInstanceVariablesApi, func = process_engine.ProcessInstanceVariablesApi.list_process_instance_variables, data={"process_instance_id": process_instance_id}, request= request, tenant_id=tenant, type="get")
                    if status_code >300:
                        internal_error = 10009
                        logger.exception(getLogMessage(org_entity_errors, internal_error).format(action), internal_error)
                        context = {'error': str(action), "success": False, "message": _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
                        return Response(context, status=status_code)
                    process_instance_variables = action

                    entity_data = {}
                    files = []
                    for process_instance_variable in process_instance_variables:
                        key = process_instance_variable["name"]
                        value = process_instance_variable["value"]
                        if 'type' in process_instance_variable:
                            variable_type = process_instance_variable["type"]
                            if variable_type == 'json' and type(value) is list and len(value) > 0:
                                if 'url' in value[0]:
                                    for file in value:
                                        file_url = file['url']
                                        file_id = file_url.split("/")[-1]
                                        files.append(file_id)
                                entity_data[key] = value
                            elif variable_type == 'date':
                                date_obj = datetime.strptime(value,"%Y-%m-%dT%H:%M:%SZ")
                                date_str = date_obj.strftime('%d %b %Y')
                                entity_data[key] = date_str
                            else:
                                entity_data[key] = value
                    remove_extra_keys(entity_data)
                    unique_key_query_set = OrganisationEntityMasterData.objects.all_with_deleted().filter(entity_model__id=master_model_id, entity_model__tenant__id=tenant)
                    for item in unique_key:
                        filter_attribute = "entity_data__" + item + "__iexact"
                        unique_key_query_set = unique_key_query_set.filter(**{ filter_attribute: entity_data[item] })
                    if unique_key_query_set.exists():
                        internal_error = 10010
                        err_msg = "Entity for already present".format()
                        logger.warning(err_msg)
                        context = {'error': err_msg, 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                        return Response(context, status=status.HTTP_200_OK)
                    else:
                        data = {}
                        data["entity_model"] = master_model_id
                        data["entity_data"] = entity_data
                        if self.model.objects.filter(entity_model__tenant__id=tenant).exists():
                            data["candidateId"] = "C" + format(int(self.model.objects.filter(entity_model__tenant__id=tenant).order_by("created_at").last().candidateId[1:]) + 1, "05")
                        else:
                            data["candidateId"] = "C00001"
                        serializer = UpdateDataSerializer(data=data)

                else:
                    internal_error = 10011
                    error_msg = "Record for this process with id {} is already created".format(process_instance_id)
                    logger.error(error_msg, internal_error)
                    context = {'error': error_msg, 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                    return Response(context, status=status.HTTP_409_CONFLICT)
            except Exception as error:
                internal_error = 10012
                logger.exception(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
                context = {'error': str(error), "success": False, "message": _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            candidate_obj = None
            if serializer.is_valid():
                obj = serializer.save()
                entity_id = str(obj.id)
                if "create_candidate" in req_data:
                    obj.employee_type = "Candidate"
                    obj.save()
                    candidate_data = {}
                    if JobCandidate.objects.filter(tenant=tenant).exists():
                        candidate_data["applicationId"] = "A" + format(int(JobCandidate.objects.filter(tenant=tenant).order_by("created_at").last().applicationId[1:]) + 1, "05")
                    else:
                        candidate_data["applicationId"] = "A00001"
                    candidate_data['job'] = entity_data["job"]
                    candidate_data['candidate'] = entity_id
                    candidate_data["tenant"] = tenant
                    if entity_data['sourcing_partner']:
                        candidate_data['sourcing_partner'] = entity_data["sourcing_partner"]
                    if entity_data['hire_candidate_source']:
                        candidate_data["source"] = entity_data['hire_candidate_source']
                    if entity_data["hiring_event"]:
                        candidate_data['hiring_event'] = entity_data['hiring_event']
                    if "entity_hiring_status" in entity_data and entity_data["entity_hiring_status"]:
                        candidate_data["state"] = entity_data["entity_hiring_status"]
                    if "job_board" in entity_data and entity_data["job_board"]:
                        candidate_data["job_board"] = entity_data["job_board"]
                    if "initiator" in entity_data and entity_data["initiator"]:
                        candidate_data["created_by"] = entity_data["initiator"]
                    candidate_serializer = JobCandidateCreateSerializer(data=candidate_data)
                    if candidate_serializer.is_valid():
                        candidate_obj = str(candidate_serializer.save().id)
                        if "job_candidate_stage" in entity_data:
                            for item in entity_data["job_candidate_stage"]:
                                item["candidate"] = candidate_obj
                                stage_serializer = JobCandidateStageSerializer(item)
                                if stage_serializer.is_valid():
                                    stage_serializer.save()
                    else:
                        internal_error = 10087
                        context = {'error': get_custom_field_errors(
                            candidate_serializer.errors), "success": False, "message": _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
                        logger.error(getLogMessage(org_entity_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", candidate_serializer.errors), internal_error)
                        return Response(context, status=status.HTTP_400_BAD_REQUEST)
                # add_entity_audit_log.apply_async(args=[req_data, entity_id, str(request.tenant.id)], priority=HIGH_PRIORITY_TASK)
                request_data = {}
                request_data["entity_id"] = entity_id
                request_data["files"] = files
                update_entity.apply_async(args=[request_data], priority=HIGH_PRIORITY_TASK)
                context = {"success": True, "message": _("Record has been added successfully."), "data": self.get_id_serializer_class(obj).data, "candidate_obj":candidate_obj}
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 10013
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_entity_errors, internal_error).format(serializer.errors), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as error:
            internal_error = 10014
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error))}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail= False, methods=["post"], name="list-entity")
    def get_all(self, request, tenant=None):
        try:
            pagination_data = None
            if 'masterModelID' in request.query_params:
                master_model_id = request.query_params['masterModelID']
            else:
                error = 'Failed to get master model ID'
                context = {'error': error, 'success': False, 'message': _('Failed to get the record.')}
                logger.error(error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            try:
                master_model_obj = OrganisationEntityMasterModel.objects.get(id=master_model_id, tenant__id=tenant)
            except Exception as error:
                internal_error = 10015
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(master_model_id, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            if request.query_params.get('get_config_data') != None:
                view_obj = OrganisationEntityView.objects.get(entity_master_model=master_model_obj)
                org_user = OrganisationUser.objects.get(email=request.user.email)
                view_id = None
                workflows = []
                if view_obj:
                    view_id = str(view_obj.id)
                    view_workflows = view_obj.entity_workflows.all().order_by('order_id', 'name')
                    workflows = OrganisationWorkflowDetailsSerializer(view_workflows, many=True)
                else:
                    internal_error = 10016
                    context = {'success':False, "message" : _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
                    no_view_error = "No entity view found for this master_model_id {}".format(master_model_id)
                    logger.error(getLogMessage(org_entity_errors, internal_error).format(no_view_error), internal_error)
                    return Response(context, status=status.HTTP_403_FORBIDDEN)

            body = request.data
            if body["data"] == "inactive":
                queryset = self.model.objects.deleted_set().filter(entity_model__id=master_model_id, entity_model__tenant__id=tenant).filter(Q(blacklist_reason__isnull=True) | Q(blacklist_reason__exact=''))
            elif body["data"] == "blacklist":
                queryset = self.model.objects.deleted_set().filter(entity_model__id=master_model_id, entity_model__tenant__id=tenant).exclude(blacklist_reason__isnull=True).exclude(blacklist_reason__exact='')
            elif body["data"] == "all":
                queryset = self.model.objects.all_with_deleted().filter(entity_model__id=master_model_id, entity_model__tenant__id=tenant)
            else:
                queryset = self.model.objects.filter(entity_model__id=master_model_id, entity_model__tenant__id=tenant)

            try:
                if str(request.user.tenant.id) != tenant:
                    queryset = queryset.filter(jobcandidate__sourcing_partner__vendorId=str(request.user.tenant.id))
            except:
                pass
            # if request.query_params.get('get_config_data') != None and request.user.groups.all()[0].name not in ["Owner","Super Administrator"] and view_obj.view_filter !=None:
            #     entity_filter = view_obj.view_filter
            #     if entity_filter == "entity_location":
            #         if org_user.location:
            #             queryset = queryset.filter(entity_data__entity_location=org_user.location.name)
            #         else:
            #             internal_error = 10017
            #             context = {'success':False, "message" : _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            #             return Response(context, status=status.HTTP_403_FORBIDDEN)
            #     elif entity_filter == "entity_department":
            #         if org_user.department:
            #             queryset = queryset.filter(entity_data__entity_department=org_user.department.name)
            #         else:
            #             internal_error = 10018
            #             context = {'success':False, "message" : _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            #             return Response(context, status=status.HTTP_403_FORBIDDEN)
            #     else:
            #         if CustomAttribute.objects.filter(type="users").exists():
            #             if entity_filter in org_user.extra_fields and org_user.extra_fields[entity_filter] != "":
            #                 if isinstance(org_user.extra_fields[entity_filter],(str,int)):
            #                     filter_key = "entity_data__" + entity_filter
            #                     queryset = queryset.filter(**{ filter_key: org_user.extra_fields[entity_filter] })
            #                 elif isinstance(org_user.extra_fields[entity_filter],(dict)):
            #                     filter_key = "entity_data__" + entity_filter
            #                     queryset = queryset.filter(**{ filter_key: org_user.extra_fields[entity_filter]["value"] })
            #                 elif isinstance(org_user.extra_fields[entity_filter],(list)):
            #                     filter_key = "entity_data__" + entity_filter
            #                     if len(org_user.extra_fields[entity_filter]) == 1:
            #                         queryset = queryset.filter(**{ filter_key: org_user.extra_fields[entity_filter][0]["value"] })
            #                     else:
            #                         queryset = queryset.filter(**{ filter_key: request.query_params["filter"] })
            #             else:
            #                 internal_error = 10019
            #                 context = {'success':False, "message" : _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            #                 return Response(context, status=status.HTTP_403_FORBIDDEN)
            #         else:
            #             internal_error = 10020
            #             context = {'success':False, "message" : _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            #             return Response(context, status=status.HTTP_403_FORBIDDEN)

            data_fields_name = [data_fields.name for data_fields in OrganisationEntityMasterData._meta.fields]

            if 'search_key' in body and 'search_value' in body:
                if body['search_key'] in data_fields_name:
                    filter = body["search_key"] + '__' + 'icontains'
                else:
                    filter = "entity_data__" + body["search_key"] + '__' + 'icontains'
                queryset = queryset.filter(**{ filter: body["search_value"] })
            
            requestQueryParams = request.query_params.copy()
            if 'ordering' in requestQueryParams:
                del requestQueryParams['ordering']
            if 'page' in requestQueryParams:
                del requestQueryParams['page']
            if 'page_count' in requestQueryParams:
                del requestQueryParams['page_count']
            if 'get_config_data' in requestQueryParams:
                del requestQueryParams['get_config_data']
            if 'masterModelID' in requestQueryParams:
                del requestQueryParams['masterModelID']
            if 'search_key' in requestQueryParams:
                del requestQueryParams['search_key']
            if 'search_value' in requestQueryParams:
                del requestQueryParams['search_value']
            
            if requestQueryParams:
                for item in requestQueryParams.keys():
                    if item in data_fields_name:
                        filter = item + '__' + 'icontains'
                    else:
                        filter = "entity_data__" + item + '__' + 'icontains'
                    queryset = queryset.filter(**{ filter: requestQueryParams[item] })

            if 'ordering' in request.query_params:
                order_value = request.query_params['ordering']
                ordering_filter = order_value[1:] if order_value.startswith('-') else order_value
                if ordering_filter not in data_fields_name:
                    ordering_filter = "entity_data__" + ordering_filter
                if order_value.startswith('-'):
                    ordering_filter = "-" + ordering_filter
                queryset = queryset.order_by(ordering_filter)
            
            if request.query_params.get('get_config_data') == None:
                serializer = self.serializer_class(queryset, many=True)
            else:
                page = self.paginate_queryset(queryset)
                if page is not None:
                    if view_obj:
                        serializer = self.all_serializer_class(page, many=True, context={"config_list" : view_obj.config_view})
                    else:
                        serializer = self.all_serializer_class(page, many=True)
                    pagination_data = self.get_paginated_response(serializer.data)
                else:
                    if view_obj:
                        serializer = self.all_serializer_class(self.get_queryset(), many=True, context={"config_list" : view_obj.config_view})
                    else:
                        serializer = self.all_serializer_class(self.get_queryset(), many=True)
            res_data = {}
            res_data["entities"]=serializer.data
            if request.query_params.get('get_config_data') != None:
                res_data["entity_view_id"] = view_id
                res_data["workflows"] = workflows.data if workflows != [] else []
                context = {"success": True, "message": _("List of records returned successfully."), "data": res_data, "pagination_data": pagination_data}
            else:
                context = {"success": True, "message": _("List of Entity returned successfully."), "data": res_data}
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = queryset.count() if hasattr(queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], "total": total,
                       'message': _('List of records returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10021
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def list(self, request, tenant=None):
        try:
            pagination_data = None
            if 'masterModelID' in request.query_params:
                master_model_id = request.query_params['masterModelID']
            else:
                internal_error = 10022
                error = 'Failed to get master model ID'
                context = {'error': error, 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                logger.error(error, internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            try:
                master_model_obj = OrganisationEntityMasterModel.objects.get(id=master_model_id)
            except Exception as error:
                internal_error = 10023
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            view_obj = OrganisationEntityView.objects.get(entity_master_model=master_model_obj)
            # org_user = OrganisationUser.objects.get(email=request.user.email)
            view_id = None
            workflows = []
            if view_obj:
                view_id = str(view_obj.id)
                view_workflows = view_obj.entity_workflows.all().order_by('order_id', 'name')
                workflows = OrganisationWorkflowDetailsSerializer(view_workflows, many=True)
            else:
                internal_error = 10024
                context = {'success':False, "message" : _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
                return Response(context, status=status.HTTP_403_FORBIDDEN)
            queryset = self.filter_queryset(self.get_queryset().filter(entity_model__id=master_model_id))
            page = self.paginate_queryset(queryset)
            if page is not None:
                if view_obj:
                    serializer = self.list_serializer_class(page, many=True, context={"config_list" : view_obj.config_view})
                else:
                    serializer = self.list_serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                if view_obj:
                    serializer = self.list_serializer_class(self.get_queryset(), many=True, context={"config_list" : view_obj.config_view})
                else:
                    serializer = self.list_serializer_class(self.get_queryset(), many=True)
            res_data = {}
            res_data["entities"]=serializer.data
            res_data["entity_view_id"] = view_id
            res_data["workflows"] = workflows.data if workflows != [] else []
            context = {"success": True, "message": _("List of records returned successfully."), "data": res_data, "pagination_data": pagination_data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10029
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, pk=None, tenant=None):
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 10030
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            data = request.data
            req_data = request.data.copy()
            bgv_data = {}
            if 'bgv' in data:
                bgv_data = data['bgv'].copy()
                bgv_data['entity_id'] = pk
                bgv_data['host_url'] = "{0}://{1}/".format(request.scheme, request.get_host())
                del req_data['bgv']
            if "entity_data" in req_data:
                data_temp = obj.entity_data
                data_temp.update(req_data["entity_data"])
                req_data["entity_data"] = data_temp
            serializer = UpdateDataSerializer(obj, data=req_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                if 'bgv' in data:
                    url = ONGRID_PROXY_URL + "/service/update_verification"
                    headers = {
                    'Content-Type': 'application/json'
                    }
                    response = requests.request("POST", url, headers=headers, data=json.dumps(bgv_data))
                context = {"success": True, "message": _("Record details updated successfully"), "data": UpdateDataSerializer(obj).data}
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 10031
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.error(getLogMessage(org_entity_errors, internal_error).format(pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 10032
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, pk=None, tenant=None):
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 10033
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            view_entity = OrganisationEntityView.objects.get(id=request.query_params["entity_view_id"])
            if view_entity:
                serializer = self.serializer_class(obj, context={"config_list" : view_entity.config_view, "selected_entity_forms":view_entity.selected_entity_forms })
            else:
                serializer = self.serializer_class(obj)
            context = {"success": True, "message": _("Record retrieved successfully."), "data": serializer.data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10034
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'], name='get_complete_entity_data')
    def get_complete_entity_data(self, request, pk=None, tenant=None):
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 10035
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            entity_data = obj.entity_data
            first_class_data = self.first_data_serializer_class(obj).data
            entity_data.update(first_class_data)
            if obj.entity_phone_number:
                entity_data['entity_phone_number'] = obj.entity_phone_number.national_number
            context = {"success": True, "message": _("Record retrieved successfully."), "data": entity_data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10036
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['post'], name='get_specific_entity_data')
    def get_entity(self,request, pk=None, tenant=None):
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 10035
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            body = request.data
            obj_data = obj.entity_data
            res_data = {}
            for item in body:
                res_data[item] = obj_data.get(item)
            context = {"success": True, "message": _("Entity master Data retrieved successfully"), "data": res_data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10036
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['get'], name="get_model_data")
    def get_model_data(self, request, pk=None, tenant=None):
        try:
            try:
                obj = self.model.objects.filter(entity_model__id=pk)
            except Exception as error:
                internal_error = 10037
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            pagination_data = None
            page = self.paginate_queryset(obj.order_by('entity_name'))
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(obj.order_by('entity_name'), many=True)
            context = {"success": True, "message": _("Record retrieved successfully."), "data": serializer.data, "pagination_data": pagination_data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10038
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], name="dedup")
    def dedup(self, request, pk=None, tenant=None):
        try:
            data = request.data
            entity_key_data = data['entity_model']
            dedup_data = data['dedup_data']
            entity_obj = self.model.objects.none()
            for model_key in entity_key_data:
                obj = self.model.objects.all_with_deleted().filter(entity_model__key=model_key, entity_model__tenant__id=tenant)
                entity_model_unique_key = OrganisationEntityMasterModel.objects.get(key=model_key, tenant__id=tenant).unique_field
                for item in entity_model_unique_key:
                    obj = obj.filter(**{item:dedup_data[item]})
                entity_obj = entity_obj | obj
            serializer = UpdateDataSerializer(entity_obj, many=True)
            context = {"success": True, "message": _("Record retrieved successfully."), "data": serializer.data, "count": entity_obj.count()}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10038
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], name="dedup_all")
    def dedup_all(self, request, pk=None, tenant=None):
        try:
            data = request.data
            req_var = data["req_var"]
            response = {"employee" : {}, "candidate" : {}}
            for i in req_var:
                response["employee"][i] = None
                response["candidate"][i] = None
            res_dup = False
            is_active = False
            is_process_active = False
            entity_key_data = data['entity_model']
            dedup_data = data['dedup_data']
            last_updated_at = None
            for model_key in entity_key_data:
                obj = self.model.objects.all_with_deleted().filter(entity_model__key=model_key)
                for item in dedup_data.keys():
                    try:
                        obj = obj.filter(**{item:dedup_data[item]})
                    except:
                        obj = obj.filter(**{"entity_data__" + item:dedup_data[item]})
                if obj.exists():
                    res_dup = True
                    for item in obj:
                        is_active = not item.is_deleted
                        last_updated_at = item.updated_at
                        entity_data = item.entity_data
                        first_class_data = OrganisationEntityFirstDataSerializer(item).data
                        entity_data.update(first_class_data)
                        for var in req_var:
                            response["employee"][var] = entity_data[var] if var in entity_data else None
            if "process_data" in data:
                if 'finished' in data['process_data']:
                    data['process_data'].pop('finished')
                response_context, response_status =  call(module=process_engine.QueryApi,func= process_engine.QueryApi.query_historic_process_instance, data=data["process_data"], request=request, type="post", tenant_id=tenant)
                if response_status < 300:
                    if "process_instance_id" in request.query_params:
                        item_to_be_deleted = {}
                        for item in response_context["data"]:
                            if item['id'] == request.query_params["process_instance_id"]:
                                item_to_be_deleted = item
                        if item_to_be_deleted != {}:
                            response_context["size"] = response_context["size"] - 1
                            response_context["total"] = response_context["total"] - 1
                            response_context["data"].remove(item_to_be_deleted)
                    if response_context["total"] > 0:
                        res_dup = True
                        for item_p in response_context["data"]:
                            if item_p["endTime"] is None:
                                is_process_active = True
                                for item_v in item_p["variables"]:
                                    if item_v["name"] in response["candidate"]:
                                        response["candidate"][item_v["name"]] = item_v["value"]
                                break
                            elif last_updated_at is not None and parser.parse(item_p["endTime"]) > last_updated_at:
                                for item_v in item_p["variables"]:
                                    if item_v["name"] in response["employee"]:
                                        response["employee"][item_v["name"]] = item_v["value"]
                                last_updated_at = parser.parse(item_p["endTime"])
                            elif last_updated_at is None:
                                for item_v in item_p["variables"]:
                                    if item_v["name"] in response["candidate"]:
                                        response["candidate"][item_v["name"]] = item_v["value"]
                                last_updated_at = parser.parse(item_p["endTime"])
                            else:
                                pass
                else:
                    context = {"success": False, "message": _("Record retrieved Failed."), "data": response_context}
                    return Response(context, status=response_status)
            context = {"success": True, "message": _("Record retrieved successfully."), "data": response, "dedup" : res_dup, "is_process_active": is_process_active, "is_active" : is_active}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10038
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None, tenant=None):
        context = {'error': '', 'success': False, 'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def update(self, request, pk=None, tenant=None):
        context = {'error': '', 'success': False, 'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=False, methods = ["post"], name="delete_entity_data")
    def delete_entity(self, request, tenant=None):
        try:
            data = request.data
            try:
                queryset = OrganisationEntityMasterData.objects.filter(entity_model__key=data["model"])
                filter_key = "entity_data__" + data["search_key"]
                queryset = queryset.get(**{ filter_key: data["search_value"] }).delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
            except Exception as error:
                internal_error = 10039
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
        except Exception as error:
            internal_error = 10040
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['put'], name='entity_master_update')
    def update_entity_data(self, request, pk=None, tenant=None):
        try:
            try:
                obj = self.model.objects.get(id=pk, entity_model__tenant__id=tenant)
            except Exception as error:
                context = {'error': str(error), 'success': False, 'message': _('ID not found')}
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            entity_id = pk
            files = []
            if 'process_instance_id' in request.query_params:
                process_instance_id = request.query_params['process_instance_id']
                action, status_code = call(module = process_engine.ProcessInstanceVariablesApi, func = process_engine.ProcessInstanceVariablesApi.list_process_instance_variables, data={"process_instance_id": process_instance_id}, tenant_id=tenant, request= request, type="get")
                if status_code > 300:
                    internal_error = 10041
                    context = {'error': str(action), "success": False, "message": _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                    logger.exception(getLogMessage(org_entity_errors, internal_error).format(action), internal_error)
                    return Response(context, status=status_code)
                process_instance_variables = action
                data = {}
                entity_data = {}
                for process_instance_variable in process_instance_variables:
                    key = process_instance_variable["name"]
                    value = process_instance_variable["value"]
                    if 'type' in process_instance_variable:
                        variable_type = process_instance_variable["type"]
                        if variable_type == 'json' and type(value) is list and len(value) > 0:
                            if 'url' in value[0]:
                                for file in value:
                                    file_url = file['url']
                                    file_id = file_url.split("/")[-1]
                                    files.append(file_id)
                            entity_data[key] = value
                        elif variable_type == 'date':
                            # date_isoformat = value
                            date_obj = datetime.strptime(value,"%Y-%m-%dT%H:%M:%SZ")
                            date_str = date_obj.strftime('%d %b %Y')
                            entity_data[key] = date_str
                        else:
                            entity_data[key] = value
                data['entity_data'] = entity_data
            else :
                data = request.data.copy()
                for (key, value) in data.items():
                    if type(value) is list and len(value) > 0:
                        if 'url' in value[0]:
                            for file in value:
                                file_url = file['url']
                                file_id = file_url.split("/")[-1]
                                files.append(file_id)
            old_json = obj.entity_data.copy()

            if "entity_data" in data:
                remove_extra_keys(data['entity_data'])
                for keys in data["entity_data"]:
                    old_json[keys] = data["entity_data"][keys]
                if "entity_model" in request.query_params:
                    obj.entity_model = OrganisationEntityMasterModel.objects.get(key=request.query_params["entity_model"], tenant__id=tenant)
                obj.entity_data = old_json
                obj.save()
                job_candidate = JobCandidate.objects.filter(candidate=obj)
                if job_candidate.count() == 1 and "job_candidate_stage" in data["entity_data"]:
                    for item in data["entity_data"]["job_candidate_stage"]:
                        JobCandidateStage.objects.get_or_create(candidate=job_candidate[0], stage_name=item["stage_name"], stage_assignee=item["stage_assignee"], stage_date=datetime.strptime(item["stage_date"], "%d %b %Y %I:%M %p"))
                if len(files):
                    request_data = {}
                    request_data["entity_id"] = entity_id
                    request_data["files"] = files
                    update_entity.apply_async(args=[request_data], priority=HIGH_PRIORITY_TASK)
            else:
                internal_error = 10042
                context = {'success' : False, 'message' : getMessage(org_entity_errors, internal_error), 'internal_error': internal_error}
                logger.error(getMessage(org_entity_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            context = {"success": True, "message": _("Record updated successfully"), "data": self.get_id_serializer_class(obj).data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10043
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get', 'post'], name='entity_bulk_update')
    def entity_bulk_update(self, request, tenant=None):
        logger.info("{} requested to start Bulk Updation for tenant: {}".format(request.user.email, tenant))
        try:
            process_key = request.query_params["process_key"]
            master_model_id = request.query_params["master_model_id"]
            try:
                workflow_obj = OrganisationWorkflow.objects.get(process_key=process_key)
                master_model_obj = OrganisationEntityMasterModel.objects.get(id=master_model_id)
                engine_url = OrganisationLicense.objects.get(organisation=request.tenant).processengine
            except Exception as error:
                internal_error = 10044
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(request.user.email, master_model_id, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            unique_field_key = master_model_obj.unique_field
            if request.method == 'GET':
                ProcessDefinitions = process_engine.ProcessDefinitionsApi
                list_process = ProcessDefinitions.list_process_definitions
                req_body = {}
                req_body["latest"] = True
                req_body["key"] = process_key
                action, status_code = call(module = ProcessDefinitions, func = list_process, data=req_body, request= request, type="get")
                if status_code > 300:
                    internal_error = 10045
                    context = {'error': str(action), "success": False, "message": _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_entity_errors, internal_error).format(action), internal_error)
                    return Response(context, status=status_code)
                iterate_process = action["data"]
                if iterate_process[0]["startFormDefined"]:
                    if workflow_obj.bulk_sample_url:
                        logger.info("Bulk Sample URL exists, returned sample import file")
                        response = HttpResponse(workflow_obj.bulk_sample_url.read(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                        response['Content-Disposition'] = 'inline; filename=' + "sample.xlsx"
                        return response
                    else:
                        get_start_form2 = ProcessDefinitions.get_process_definition_start_form2
                        req_id = {}
                        req_id["process_definition_id"] = iterate_process[0]["id"]
                        action, status_code = call(module = ProcessDefinitions, func = get_start_form2, data=req_id, request= request, type="get")
                        form_key, form_version = action["key"].split("::")
                        form = OrganisationForm.objects.get(key=form_key, version=form_version)
                        labels = get_nonhidden_label(form.keytypepair)
                        key_type = get_nonhidden_key_type(form.keytypepair)
                        req_headers = get_non_hidden_required_labels(form.keytypepair)
                        if len(unique_field_key) > 0:
                            for item in unique_field_key:
                                unique_field_label = master_model_obj.keyvaluepair[item]
                                unique_field_obj = {}
                                unique_field_obj[item] = unique_field_label
                                req_headers[item] = True
                                key_type[item] = 'textfield'
                                labels.update(unique_field_obj)
                                labels.move_to_end(item, last=False)
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
                                worksheet.write(row+1, col,'mandatory')
                            else:
                                worksheet.write(row+1, col, 'optional')
                            if key_type[headers] == 'select':
                                opt = GetComponentsController(form.content, headers).get_select_options()
                                if len(opt) == 0:
                                    worksheet.write(row+3, col, labels[headers])
                                else:
                                    worksheet.write(row+3, col, labels[headers] + " (" + ",".join(opt) + ")")
                                worksheet.write(row, col, 'string')
                                col += 1
                            elif key_type[headers] == 'checkbox':
                                worksheet.write(row+3, col, labels[headers] + " (true/false)")
                                worksheet.write(row, col, 'boolean')
                                col += 1
                            elif key_type[headers] == 'radio':
                                opt = GetComponentsController(form.content, headers).get_radio_options()
                                worksheet.write(row+3, col, labels[headers] + " (" + ",".join(opt) + ")")
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
                        logger.info("Bulk Sample URL doesn't exist, returned a generated sample import file")
                        response = HttpResponse(output.read(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                        response['Content-Disposition'] = 'inline; filename=' + "hello.xlsx"
                        return response
            if request.method == "POST":
                file_type = None
                uploaded_file = request.FILES['file']
                request_body = {}
                if uploaded_file.name.endswith('.xlsx'):
                    logger.info("Uploaded file is xlsx.")
                    converted_file = get_uploaded_file(uploaded_file)
                    request_body['file_path'] = converted_file
                    file_type = '.xlsx'
                    logger.info("csv_file_path: {}".format(converted_file))
                elif uploaded_file.name.endswith('.csv'):
                    logger.info("Uploaded file is CSV.")
                    csv_file_path = get_uploaded_file(uploaded_file)
                    request_body["file_path"] = csv_file_path
                    file_type = '.csv'
                    logger.info("csv_file_path: {}".format(csv_file_path))
                else:
                    csv_file_path = None
                    logger.info("Uploaded file is not XLSX/CSV.")
                request_body["file_type"] = file_type
                request_body["engine_url"] = engine_url
                request_body["token"] = "JWT " + request.auth.decode('utf-8')
                request_body["domain_info"] = "{0}://{1}".format(request.scheme, request.get_host())
                request_body["user"] =str(request.user.id)
                request_body["workflow"] = workflow_obj.id
                request_body['import_type'] = 'entity'
                request_body['unique_key'] = unique_field_key
                request_body['master_model_id'] = master_model_id
                entity_data = dict()
                entity_data['transaction_id']  = uuid.uuid4()
                entity_data['started_at']      = timezone.now()
                entity_data['status']          = EntityImport.STATUS_CHOICES[0][0]
                entity_data['entity_type']     = "bulk_initiate_process"
                entity_data['user']            = request.user
                entity_data['file']            = uploaded_file
                serializer = EntityImportCreateSerializer(data=entity_data)
                if serializer.is_valid():
                    import_obj = serializer.save()
                    bulk_task_create.apply_async(args=[request_body,str(import_obj.id), request.tenant.id], priority=MEDIUM_PRIORITY_TASK)
                logger.info("{}, Bulk Process Updation started of Process: {} for tenant: {}".format(request.user.email, workflow_obj.name, tenant))
                context = {'success': True, 'message': _('Bulk Update Request Accepted')}
                return Response(context, status=status.HTTP_200_OK)
        except Exception as e:
            internal_error = 10046
            context = {'error': str(e), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(request.user.email, e), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], name='entity_master_search')
    def search_entity_data(self, request, pk=None, tenant=None):
        try:
            try:
                if "get_data" in request.query_params:
                    if request.query_params["get_data"] == "inactive":
                        obj = self.model.objects.deleted_set().filter(entity_model__id=pk).order_by('entity_name')
                    elif request.query_params["get_data"] == "all":
                        obj = self.model.objects.all_with_deleted().filter(entity_model__id=pk).order_by('entity_name')
                    else:
                        obj = self.model.objects.filter(entity_model__id=pk).order_by('entity_name')
                else:
                    obj = self.model.objects.filter(entity_model__id=pk).order_by('entity_name')
            except Exception as error:
                internal_error = 10047
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            data = request.data
            if type(data) == dict and 'key' in data and 'value' in data:
                entity_filter = "entity_data__" + data['key'] + '__' + 'iexact'
                obj = obj.filter(**{ entity_filter: data['value'] })
            elif type(data) == list:
                for item in data:
                    entity_filter = "entity_data__" + item['key'] + '__' + 'iexact'
                    obj = obj.filter(**{ entity_filter: item['value']})
            else:
                internal_error = 10048
                context = {'success' : False, 'message' : getMessage(org_entity_errors, internal_error), 'internal_error': internal_error}
                logger.error(getMessage(org_entity_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            serializer = self.serializer_class(obj.order_by('entity_name'), many=True)
            context = {"success": True, "message": _("Record fetched successfully"), "data": serializer.data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10049
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=False, methods=['put'], name='update_count_key')
    def update_count_key(self, request, tenant=None):
        try:
            def set_entity_value(obj, counter_key, counter_value, data):
                obj.entity_data[counter_key] = counter_value
                data[counter_key] = counter_value
                obj.entity_data = entity_data
                obj.save()

            req_data = request.data.copy()
            operation = [*req_data][0]
            key_data = req_data[operation]
            max_value = key_data['maxValue']
            min_value = key_data['minValue']
            master_data_id = key_data['id']
            counter_key = key_data['key']
            try:
                obj = OrganisationEntityMasterData.objects.get(id=master_data_id)
            except Exception as error:
                internal_error = 10050
                context = {'success' : False, 'message' : getMessage(org_entity_errors, internal_error), 'internal_error': internal_error}
                logger.error(getMessage(org_entity_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            data = {}
            message = ""
            entity_data = obj.entity_data
            counter_value = entity_data[counter_key]
            if operation == ADD:
                counter_value += 1
                if counter_value <= max_value:
                    set_entity_value(obj, counter_key, counter_value, data)
                    message = "{} updated successfully".format(counter_key)
                else:
                    message = "Invalid Operation - Incremented value is bigger than max value"
            if operation == SUB:
                counter_value -= 1
                if counter_value >= min_value:
                    set_entity_value(obj, counter_key, counter_value, data)
                    message = "{} updated successfully".format(counter_key)
                else:
                    message = "Invalid operation - Decremented value is smaller than min value"
            context = {"success": True, "message": _(message), "data": data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10051
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['get'], name='get_entity_master_data')
    def get_entity_data(self, request, pk=None, tenant=None):
        try:
            try:
                obj = self.model.objects.filter(entity_model__id=pk).order_by('entity_name')
                master_model_obj = OrganisationEntityMasterModel.objects.get(id=pk)
            except Exception as error:
                internal_error = 10052
                context = {'error': str(error), 'success': False, 'message': _(getLogMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            data = request.query_params.copy()
            for item in data:
                entity_filter = "entity_data__" + item + '__' + 'iexact'
                obj = obj.filter(**{ entity_filter: data[item]})
            serializer = self.serializer_class(obj.order_by('entity_name'), many=True)
            context = {"success": True, "message": _("Record fetched successfully"), "data": serializer.data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10053
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['post'], name='download_record_data')
    def download_record_data(self, request, pk=None, tenant=None):
        try:
            try:
                obj = self.model.objects.filter(entity_model__id=pk).order_by('entity_name')
                master_model_obj = OrganisationEntityMasterModel.objects.get(id=pk)
            except Exception as error:
                internal_error = 10054
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            data = request.data['data']
            for q_data in data:
                if isinstance(data[q_data], (bool, int)):
                    entity_filter = "entity_data__" + q_data + '__' + 'exact'
                else:
                    entity_filter = "entity_data__" + q_data + '__' + 'iexact'
                obj = obj.filter(**{ entity_filter: data[q_data] })

            report_path = dirpath = tempfile.mkdtemp() + "/Reports.xlsx"
            workbook = xlsxwriter.Workbook(report_path)
            request_body = {}
            request_body["data"] = list(obj.values('entity_data'))
            selected_fields = {'selected_fields': master_model_obj.keyvaluepair}
            request_body["selected_items"] = selected_fields
            create_master_data_report(workbook, request_body)
            workbook.close()
            with open(report_path, "rb") as excel_file:
                excel_data = excel_file.read()
            response = HttpResponse(excel_data, content_type='application/vnd.ms-excel')
            response['Content-Disposition'] = 'attachment; filename=Report.xlsx'
            return response

        except Exception as error:
            internal_error = 10055
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['post'], name='upsert_record_data_api')
    def upsert(self, request, pk=None, tenant=None):
        try:
            try:
                entity_obj = OrganisationEntityMasterModel.objects.get(key=pk)
            except Exception as error:
                internal_error = 10056
                context = {'error': str(error), 'success': False, 'message': getMessage(org_entity_errors, internal_error), 'internal_error': internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            req_data = request.data.copy()
            unique_fields = entity_obj.unique_field
            files = []
            if 'processInstanceId' in req_data:
                action, status_code = call(module = process_engine.ProcessInstanceVariablesApi, func = process_engine.ProcessInstanceVariablesApi.list_process_instance_variables, data={"process_instance_id": req_data["processInstanceId"]}, request= request, type="get")
                if status_code >300:
                    internal_error = 10057
                    context = {'error': str(action), "success": False, "message": _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
                    return Response(context, status=status_code)
                process_instance_variables = action
                entity_data = {}
                for process_instance_variable in process_instance_variables:
                    key = process_instance_variable["name"]
                    value = process_instance_variable["value"]
                    if 'type' in process_instance_variable:
                        variable_type = process_instance_variable["type"]
                        if variable_type == 'json' and type(value) is list and len(value) > 0:
                            if 'url' in value[0]:
                                for file in value:
                                    file_url = file['url']
                                    file_id = file_url.split("/")[-1]
                                    files.append(file_id)
                            entity_data[key] = value
                        elif variable_type == 'date':
                            date_obj = datetime.strptime(value,"%Y-%m-%dT%H:%M:%SZ")
                            date_str = date_obj.strftime('%d %b %Y')
                            entity_data[key] = date_str
                        else:
                            entity_data[key] = value
                remove_extra_keys(entity_data)
            else:
                entity_data = req_data
            entity_data_obj = OrganisationEntityMasterData.objects.all_with_deleted().filter(entity_model=entity_obj)
            to_update = False
            for item in unique_fields:
                if item in entity_data:
                    filter_item = "entity_data__" + item + "__iexact"
                    entity_data_obj = entity_data_obj.filter(**{ filter_item: entity_data[item]})
                    if entity_data_obj.exists():
                        to_update = True
                    else:
                        to_update = False
                        break
                else:
                    to_update = False
                    break

            if to_update == True:
                if len(entity_data_obj) == 1:
                    data = {}
                    data["entity_model"] = str(entity_obj.id)
                    data["entity_data"] = entity_data_obj[0].entity_data
                    data["entity_data"].update(entity_data)
                    serializer = self.serializer_class(entity_data_obj[0], data=data, partial=True)
                else:
                    logger.info("More than One Record exists for the given entity data.")
                    context = {'message' : _('Unique Constained violated.'), 'success' : False}
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            else:
                data = {}
                data["entity_model"] = str(entity_obj.id)
                data["entity_data"] = entity_data
                serializer = self.serializer_class(data=data)
            if serializer.is_valid():
                item = serializer.save()
                add_entity_audit_log.apply_async(args=[entity_data, str(item.id), str(request.tenant.id)], priority=HIGH_PRIORITY_TASK)
                request_data = {}
                request_data["entity_id"] = str(item.id)
                request_data["files"] = files
                update_entity.apply_async(args=[request_data], priority=HIGH_PRIORITY_TASK)
                context = {"success": True, "message": _("Record has been added successfully."), "data": self.get_id_serializer_class(item).data}
                return Response(context, status=status.HTTP_200_OK)
            else:
                internal_error = 10058
                context = {'error': get_custom_field_errors(serializer.errors), "success": False, "message": _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 10059
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=False, methods=['post'], name='transfer_entity')
    def transfer(self, request, tenant=None):
        try:
            data = request.data
            org_from = data["org_from"]
            org_to = data["org_to"]
            connection.set_tenant(Organisation.objects.get(schema_name="ezedox_" + org_to))
            destination_entity_model = str(OrganisationEntityMasterModel.objects.get(key=data["entity"]).id)
            connection.set_tenant(Organisation.objects.get(schema_name="ezedox_" + org_from))
            req_data = data["transfer_data"]
            destination_file_path = request.scheme + "://" + org_to  + "." + BASE_ORG_DOMAIN_URL + "/api/forms/files/"
            transfer_entity(org_from, org_to, req_data, destination_entity_model, destination_file_path)
            context = {"success": True, "message": _("Entity Trasnferred successfully")}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10091
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrganisationEntityViewsViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationEntityView
    queryset = OrganisationEntityView.objects.all()
    serializer_class = OrganisationEntityViewSerializer
    create_serializer_class = OrganisationEntityViewCreateSerializer
    list_serializer_class = OrganisationEntityViewListSerializer

    def retrieve(self, request, tenant=None, pk=None):
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 10060
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {"success": True, "message": _("View Data retrieved successfully"), "data": serializer.data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10061
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def list(self, request, tenant=None):
        logger.info("{} requested the list of View for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            page = self.paginate_queryset(self.filter_queryset(self.get_queryset().filter(tenant__id=tenant).order_by('name')))
            pagination_data = None
            if page is not None:
                serializer = self.list_serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.list_serializer_class(
                    self.filter_queryset(self.get_queryset().order_by('name')), many=True)
            context = {
                "success": True, "message": _("View details returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{}, List of View sent successfully for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10062
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def create(self, request, tenant=None, **args):
        logger.info("{} send the View data to create for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            req_data = request.data.copy()
            req_data["tenant"] = Organisation.objects.get(key=tenant).id
            serializer = self.create_serializer_class(data=req_data)
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _("View has been added successfully."), "data": self.list_serializer_class(obj).data}
                logger.info("{},View has been created successfully for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 10063
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_entity_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 10064
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, tenant=None, pk=None):
        logger.info("{}, Partial update for id: {} in View for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 10065
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            req_data = request.data.copy()
            req_data["tenant"] = Organisation.objects.get(key=tenant).id
            serializer = self.create_serializer_class(obj, data=req_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {"success": True, "message": _("View details updated successfully."), "data": self.list_serializer_class(obj).data}
                logger.info("{}, Data for id: {} partially updated in View for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 10066
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_entity_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 10067
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, tenant=None, pk=None):
        logger.info("{} requested to delete for id: {} from View for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 10068
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            self.perform_destroy(obj)
            context = {
                "success": True, "message": _("View deleted successfully."), "data": None}
            logger.info("{}, Id: {} deleted successfully from Entity View for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant ))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10069
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, tenant=None, pk=None):
        context = {'error': '', 'success': False,'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=True, methods=['get'], name="process-view-data")
    def entity_view_data(self, request, tenant=None, pk=None):
        try:
            entity_model_id = pk
            if 'role' in request.query_params:
                role_id = request.query_params['role']
            else:
                user_email = request.user.email
                role_id = OrganisationUser.default_manager.filter(email = user_email)[0].groups.all()[0].id
            entity_view_data = OrganisationEntityView.objects.filter(entity_master_model = entity_model_id, role = role_id, tenant__id=tenant)
            if entity_view_data:
                serializer = self.list_serializer_class(entity_view_data[0])
                context = {"success": True, "message": _("View Data retrieved successfully"), "data": serializer.data}
                return Response(context, status=status.HTTP_200_OK)
            context = {"success": True, "message": _("View Data retrieved successfully"), "data": {}}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10070
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OrganisationEntityMasterDataDeleteViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    # def get_permissions(self):
    #     permission_classes = [has_open_access_or_has_api_key_access_or_is_authenticated]
    #     return [permission([]) for permission in permission_classes]

    def delete(self, request, tenant=None, entity_key= None, search_key=None, search_value=None):
        try:
            try:
                queryset = OrganisationEntityMasterData.objects.filter(entity_model__key=entity_key, tenant_key=tenant)
                filter_key = "entity_data__" + search_key
                queryset = queryset.get(**{ filter_key: search_value }).delete()
                logger.info("Entity with " + search_key + " : " + search_value + " deleted.")
                return Response(status=status.HTTP_204_NO_CONTENT)
            except Exception as error:
                internal_error = 10071
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
        except Exception as error:
            internal_error = 10072
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OrganisationEntityAuditLogViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationEntityAuditLog
    queryset = OrganisationEntityAuditLog.objects.all()
    serializer_class = OrganisationEntityAuditLogViewSerializer

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['entity',]

    # def get_permissions(self):
    #     permission_classes = [has_open_access_or_has_api_key_access_or_is_authenticated]
    #     return [permission([]) for permission in permission_classes]

    def list(self, request, tenant=None):
        try:
            filtered_queryset = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant).order_by('name'))
            serializer = self.serializer_class(filtered_queryset, many=True)
            context = {"success": True, 'message': _('Record Audit log Data returned successfully.'), 'data': serializer.data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as e:
            internal_error = 10073
            context = {'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", e), internal_error)
            return Response(context, status=status.HTTP_404_NOT_FOUND)

    def create(self, request, tenant=None):
        try:
            req_data = request.data.copy()
            req_data["tenant"] = Organisation.objects.get(key=tenant).id
            serializer = self.serializer_class(data=req_data)
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _("Record Audit Log has been added successfully."), "data": self.serializer_class(obj).data}
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 10074
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_entity_errors, internal_error).format(serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 10075
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, tenant=None):
        context = {'error': '', 'success': False, 'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def retrieve(self, request, tenant=None, pk=None):
        context = {'error': '', 'success': False, 'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, tenant=None, pk=None):
        context = {'error': '', 'success': False, 'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)
    
class CandidateHistoryViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = CandidateHistoryModel
    queryset = CandidateHistoryModel.objects.all()
    serializer_class = CandidateHistorytSerializer

    def list(self, request, tenant=None):
        context = {'error': '', 'success': False, 'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def update(self, request, tenant=None):
        context = {'error': '', 'success': False, 'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def retrieve(self, request, tenant=None, pk=None):
        context = {'error': '', 'success': False, 'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, tenant=None, pk=None):
        context = {'error': '', 'success': False, 'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=False,  name='audit_history', methods=["get"])
    def history(self, request, tenant=None):
        try:
            if 'candidate' in request.query_params:
                candidate_id = request.query_params['candidate']
            else:
                error = 'Failed to get candidate audit history.'
                context = {'error': error, 'success': False, 'message': _('Failed to get the record.')}
                logger.error(error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            audit_data = self.model.objects.filter(candidate__id=candidate_id, tenant=tenant)
            serializer = self.serializer_class(audit_data, many=True)
            context = {"success": True, "message": _("Audit History data returned successfully."), "data": serializer.data}
            logger.info("{} Audit History data returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            context = {'error': str(error), 'success': True, "data":[],'message': _('Audit History details returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 10092
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_entity_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_entity_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
