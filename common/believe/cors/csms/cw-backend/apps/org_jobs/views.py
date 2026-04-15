from datetime import datetime, timedelta
import process_engine
from utils.process_engine_proxy import call
from django.db.models import Count, Sum, F, Avg
from django.db.models import ProtectedError
from django.db import transaction,
from django.db import IntegrityError
from django.forms import ValidationError
from django.utils.translation import gettext as _
from django.utils.decorators import method_decorator
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import filters
from rest_framework.exceptions import NotFound
from django_filters.rest_framework import DjangoFilterBackend
from apps.license.decorators import permission_and_license_required
from utils.prime_generic_methods import get_custom_field_errors
from utils.loggerwrapper import Logger, getMessage, getLogMessage
from utils.CustomSearch import CustomSearchFilter, get_filter_fields
from utils.communication_alerts import send_notification
from apps.org_users.models import OrganisationUser
from apps.org_entity.models import OrganisationEntityMasterData
from apps.org_config.models import CustomAttribute
from apps.org_group.models import OrganisationGroup
from .serializers import OrganisationJobSerializer, OrganisationJobRoleSerializer, OrganisationHiringEventSerializer, PartnerSerializer, HiringPartnerSerializer, JobCandidateSerializer, HeadCountPlanSerializer, HeadCountGapSerializer, HiringStateSerializer, HeadCountPlanDetailSerializer, SlotSerializer, VendorWorkLocationSerializer, JobCandidateCreateSerializer, JobCandidateStageSerializer
from .models import HiringEvent, Job, JobRole, Partner, HiringPartner, JobCandidate, HeadCountPlan, HiringState, Slot, FilterStage, Organisation, VendorWorkLocation
from .internal_errors import org_jobs_errors, slot_errors, hiring_request_error
from .filters import Jobs_filter_fields, JobsRole_filter_fields, HiringEvent_filter_fields, HiringPartner_filter_fields, Partner_filter_fields, JobCandidate_filter_fields, HeadCountPlan_filter_fields, Slot_filter_fields, Candidate_slot_mapping_filter_fields
from ezedox.settings import PLATFORM_BASE_URL
from apps.org_apps.utils import launch_process_util

logger = Logger(__name__)

# Create your views here.

class JobViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = Job
    queryset = Job.objects.all()
    serializer_class = OrganisationJobSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = Jobs_filter_fields
    filter_fields = get_filter_fields(Jobs_filter_fields)
    ordering_fields = Jobs_filter_fields

    # def get_permissions(self):
    #     if self.action == 'create':
    #         permission_classes = [has_open_access_or_has_api_key_access_or_individual_permission]
    #         return [permission(["add_job"]) for permission in permission_classes]
    #     return super().get_permissions()
    
    def get_queryset(self):
        qs = Job.objects.all()
        for item in self.request.query_params.keys():
            if item.startswith("work_location__extra_fields"):
                value = self.request.query_params[item]
                custom_item = CustomAttribute.objects.get(type="locations").custom_attribute['components']
                for item_data in custom_item:
                    if item_data["key"] == item.split("__")[-1] and item_data["type"] == "number":
                        value = int(value)
                qs = qs.filter(**{item:value})
            if item.startswith("candidate_preferences__") or item.startswith("extra_fields__") or item.startswith("teams"):
                value = self.request.query_params[item]
                if value.isdigit():
                    value = int(value)
                qs = qs.filter(**{item: value})
        if 'ordering' in self.request.query_params.keys() and (self.request.query_params['ordering'].startswith("work_location__extra_fields") or self.request.query_params['ordering'][1:].startswith("work_location__extra_fields")):
            qs = qs.order_by(self.request.query_params['ordering'])
        return qs

    def list(self, request, tenant=None):
        logger.info("{} requested the list of Jobs for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            pagination_data = None
            # status_flag = False
            # status_value = ''
            # if 'status' in request.query_params:
            #     request.query_params._mutable = True
            #     status_flag = True
            #     status_value = request.query_params['status']
            #     request.query_params.pop('status')
            #     request.query_params._mutable = False
            if hasattr(request.user, 'tenant'):
                if str(request.user.tenant.id) == tenant:
                    filtered_queryset = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant))
                else:
                    filtered_queryset = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant, vendor_work_location__vendor__vendorId=str(request.user.tenant.id), vendor_work_location__status="Accepted"))
            else:
                filtered_queryset = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant))
            # if status_flag:
            #     if status_value == 'Expired':
            #         # Expired => when  Job model status = Open and expire_at_target_date = True and target date < today
            #         filtered_queryset = filtered_queryset.filter(status = 'Open', expire_at_target_date=True, target_date_to_finish_hiring__lt= datetime.now().date())
            #     if status_value == 'Open':
            #         # Open => when Job model status = Open and not expired
            #         filtered_queryset = filtered_queryset.filter(status = 'Open').exclude(expire_at_target_date=True, target_date_to_finish_hiring__lt= datetime.now().date())
            #     if status_value == 'Inactive':
            #         # Inactive => Inactive can be set by the user when hiring is stopped for external factors like business do not to hire anymore for this position
            #         filtered_queryset = filtered_queryset.filter(status = 'Inactive')
            #     if status_value == 'Achieved':
            #         # Achieved => Achieved is set by the system when available position becomes 0
            #         filtered_queryset = filtered_queryset.filter(status = 'Achieved')
            if 'page' in request.query_params:
                page = self.paginate_queryset(filtered_queryset)
                if page is not None:
                    serializer = self.serializer_class(page, many=True)
                    pagination_data = self.get_paginated_response(serializer.data)
                else:
                    serializer = self.serializer_class(filtered_queryset, many=True,)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True,)
            context = {"success": True, "message": _("Jobs data returned successfully"), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} Jobs data returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,'message': _('Jobs details returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26001
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False,  name='hiringevent', methods=["get"])
    def hiringevent(self, request, tenant=None):
        logger.info("{} requested the list of Jobs for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            pagination_data = None
            filtered_queryset = self.filter_queryset(HiringEvent.objects.get(event_id=request.query_params["hiring_event"]).job)
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True,)
            context = {"success": True, "message": _("Jobs data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} Jobs data returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,'message': _('Jobs details returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26001
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, pk=None, tenant=None):
        logger.info("{} requested to retrieve Job details for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 26002
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {"success": True, "message": _("Jobs details retrieved successfully"), "data": serializer.data}
            logger.info("{} Jobs details retrieved successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26003
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    #@method_decorator(permission_and_license_required(["org_jobs.add_job", ]))
    def create(self, request, tenant=None):
        logger.info("{} send data to create Job for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            req_data = request.data.copy()
            request_data = {}
            request_data["extra_fields"] = {}
            if 'processInstanceId' in req_data:
                process_instance_variables, status_code = call(module = process_engine.ProcessInstanceVariablesApi, func = process_engine.ProcessInstanceVariablesApi.list_process_instance_variables, data={"process_instance_id": req_data["processInstanceId"]}, tenant_id=tenant, request= request, type="get")
                my_model_fields = [field.name for field in Job._meta.get_fields()]
                for item in process_instance_variables:
                    if item["name"] in my_model_fields:
                        request_data[item["name"]] = item["value"]
                    else:
                        request_data["extra_fields"][item["name"]] = item["value"]
                req_data=request_data
            req_data["tenant"] = tenant
            req_data["work_city"] = req_data["work_city"]['name'] if req_data["work_city"]['name'] else req_data["work_city"]
            if Job.objects.filter(tenant=tenant).exists():
                req_data["job_id"] = "J" + format(int(Job.objects.filter(tenant=tenant).order_by("created_at").last().job_id[1:]) + 1, "05")
            else:
                req_data["job_id"] = "J00001"
            if req_data["target_date_to_finish_hiring"] != "":
                req_data["target_date_to_finish_hiring"] = datetime.strptime(req_data["target_date_to_finish_hiring"],"%d %b %Y").date()
            serializer = self.serializer_class(data=req_data)
            if "job_work_locality" in req_data:
                for item in req_data["job_work_locality"]:
                    qs = Job.objects.filter(tenant=tenant, job_work_locality__locality__name = item["locality"]['name'], role__name=req_data["role"], status="Active")
                    if qs.exists():
                        raise Exception("Job with this role and location already exists.")
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _("Job has been added successfully."), "data": self.serializer_class(obj).data}
                logger.info("{} Job has been added successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 26004
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as error:
            internal_error = 26104
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 26005
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.change_job", ]))
    def update(self, request, pk=None, tenant=None):
        logger.info("{} requested to update Job for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk)
                req_data = request.data.copy()
                request_data = {}
                request_data["extra_fields"] = obj.extra_fields
                if 'processInstanceId' in req_data:
                    process_instance_variables, status_code = call(module = process_engine.ProcessInstanceVariablesApi, func = process_engine.ProcessInstanceVariablesApi.list_process_instance_variables, data={"process_instance_id": req_data["processInstanceId"]}, tenant_id=tenant, request= request, type="get")
                    my_model_fields = [field.name for field in Job._meta.get_fields()]
                    for item in process_instance_variables:
                        if item["name"] in my_model_fields:
                            request_data[item["name"]] = item["value"]
                        else:
                            request_data["extra_fields"][item["name"]] = item["value"]
                    req_data=request_data
                req_data["tenant"] = tenant
                if ('target_date_to_finish_hiring' in req_data and req_data["target_date_to_finish_hiring"] != ""):
                    req_data["target_date_to_finish_hiring"] = datetime.strptime(req_data["target_date_to_finish_hiring"],"%d %b %Y").date()
            except Exception as error:
                internal_error = 26006
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            job_before = Job.objects.get(pk=req_data['id'])
            job_location_before = set(job_before.job_work_locality.values_list('locality_id','total_positions','filled_positions'))
            serializer = self.serializer_class(obj, data=req_data, partial=True)
            if "job_work_locality" in req_data:
                for item in req_data["job_work_locality"]:
                    qs = Job.objects.filter(tenant=tenant, job_work_locality__locality__name = item["locality"]['name'], role__name=req_data["role"], status="Active").exclude(id=pk)
                    if qs.exists():
                        raise Exception("Job with this role and location already exists.")
            if serializer.is_valid():
                serializer.save()
                data = self.serializer_class(obj).data
                context = {"success": True, "message": _("Job details updated successfully"), "data": data}
                notificationPayload = {
                    "jobId": data['job_id'],
                    "jobName": data['job_title'],
                    "jobRole": data['role_name'],
                    "city": data["work_city"],
                    "openings": req_data["total_positions"] if 'total_positions' in req_data else 0,
                    "userName": request.user.email if hasattr(request.user, 'email') else "AnonymousUser",
                    "redirectUrl": PLATFORM_BASE_URL,
                    "vendorUsers": job_before.tenant.name,
                    "employerOrgName":job_before.tenant.name
                }
                job_location_after = set(Job.objects.get(pk=req_data['id']).job_work_locality.values_list('locality_id','total_positions','filled_positions'))
                users = OrganisationUser.objects.filter(tenant_id=tenant)
                for user in users:
                    notificationPayload["email"] = [user.email]
                    notificationPayload["vendorName"] = user.first_name + ' ' + user.last_name
                    if job_location_before!=job_location_after:
                        change = 'Work Location' if job_before.total_positions == req_data["total_positions"] else 'Vacancies'
                        send_notification(notificationPayload, 'EMAIL','{change} Updated - {email} - Job id'.format(email=request.user.email if hasattr(request.user, 'email') else "AnonymousUser",change=change), 'VENDOR_ADDITION_HIRE')  
                    else:
                        send_notification(notificationPayload, 'EMAIL','Job Edited - {} - Job id'.format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"), 'VENDOR_ADDITION_HIRE')
                logger.info("{} Job details updated successfully for id: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 26007
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except ValidationError as error:
            internal_error = 26105
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 26008
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @method_decorator(permission_and_license_required(["org_jobs.delete_job", ]))
    def destroy(self, request, pk=None, tenant=None):
        logger.info("{} requested to delete Job for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 26009
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            job_candidate_data = JobCandidate.objects.filter(job=obj)
            if job_candidate_data:
                internal_error = 26107
                context = {'error': "Candidates are associated with this job", "success": False, "message": _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            hiring_event_job_data = HiringEvent.objects.filter(job__in = [obj])
            if hiring_event_job_data:
                internal_error = 26108
                context = {'error': "Job is associated with hiring events.", "success": False, "message": _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            obj.delete()
            context = {"success": True, "message": _("Job deleted successfully"), "data": None}
            logger.info("{} Job deleted successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except ProtectedError as error:
            internal_error = 26106
            context = {'error': str(error), "success": False, "message": _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 26010
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class JobRoleViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = JobRole
    queryset = JobRole.objects.all()
    serializer_class = OrganisationJobRoleSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = JobsRole_filter_fields
    filter_fields = get_filter_fields(JobsRole_filter_fields)
    ordering_fields = JobsRole_filter_fields

    def list(self, request, tenant=None):
        logger.info("{} requested the list of Job Roles for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            pagination_data = None
            filtered_queryset = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant))
            if 'page' in request.query_params:
                page = self.paginate_queryset(filtered_queryset)
                if page is not None:
                    serializer = self.serializer_class(page, many=True)
                    pagination_data = self.get_paginated_response(serializer.data)
                else:
                    serializer = self.serializer_class(filtered_queryset, many=True,)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True,)
            context = {"success": True, "message": _("Job Roles data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} Job Roles data returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,'message': _('Job Roles details returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26011
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, pk=None, tenant=None):
        logger.info("{} requested to retrieve Job Role details for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 26012
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {"success": True, "message": _("Job Role details retrieved successfully"), "data": serializer.data}
            logger.info("{} Job Role details retrieved successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26013
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.add_jobrole", ]))
    def create(self, request, tenant=None):
        logger.info("{} send data to create Job Role for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            req_data = request.data.copy()
            req_data["tenant"] = tenant
            req_data["slug"] = req_data["name"].lower().strip().replace(" ", "_")
            serializer = self.serializer_class(data=req_data)
            if serializer.is_valid():
                try:
                    obj = serializer.save()
                    context = {"success": True, "message": _("Job Role has been added successfully."), "data": self.serializer_class(obj).data}
                    logger.info("{} Job Role has been added successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                    return Response(context, status=status.HTTP_200_OK)
                except IntegrityError as error:
                    internal_error = 26097
                    context = {'error':str(error), "success": False, "message": getMessage(org_jobs_errors, internal_error), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            internal_error = 26014
            err_message = getMessage(org_jobs_errors, internal_error)
            if 'name' in get_custom_field_errors(serializer.errors):
                err_message = get_custom_field_errors(serializer.errors)['name']
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": err_message, "internal_error": internal_error}
            logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 26015
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.change_jobrole", ]))
    def update(self, request, pk=None, tenant=None):
        logger.info("{} requested to update Job Role for id: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 26016
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj, data=request.data, partial=True)
            if serializer.is_valid():
                try:
                    serializer.save()
                    context = {"success": True, "message": _("Job Role details updated successfully"), "data": self.serializer_class(obj).data}
                    logger.info("{} Job Role details updated successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
                    return Response(context, status=status.HTTP_200_OK)
                except IntegrityError as error:
                    internal_error = 26098
                    context = {'error': str(error), "success": False, "message": getMessage(org_jobs_errors, internal_error), "internal_error": internal_error}
                    logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            internal_error = 26017
            err_message = getMessage(org_jobs_errors, internal_error)
            if 'name' in get_custom_field_errors(serializer.errors):
                err_message = get_custom_field_errors(serializer.errors)['name']
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": err_message, "internal_error": internal_error}
            logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 26018
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.delete_jobrole", ]))
    def destroy(self, request, pk=None, tenant=None):
        logger.info("{} requested to delete Job Role for id: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 26019
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            obj.delete()
            context = {"success": True, "message": _("Job Role deleted successfully"), "data": None}
            logger.info("{} Job Role deleted successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except ProtectedError as error:
            internal_error = 26099
            context = {'error': None, "success": False, "message": _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 26020
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class HiringEventViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = HiringEvent
    queryset = HiringEvent.objects.all()
    serializer_class = OrganisationHiringEventSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = HiringEvent_filter_fields
    filter_fields = get_filter_fields(HiringEvent_filter_fields)
    ordering_fields = HiringEvent_filter_fields

    # @method_decorator(permission_and_license_required(["org_jobs.view_hiringevent", ]))
    def list(self, request, tenant=None):
        logger.info("{} requested the list of Hiring Events for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            pagination_data = None
            if str(request.user.tenant.id) == tenant:
                filtered_queryset = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant))
            else:
                filtered_queryset = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant, job__vendor_work_location__vendor__vendorId=str(request.user.tenant.id)))
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True,)
            context = {"success": True, "message": _("Hiring Events data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} Hiring Events data returned successfully.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,'message': _('Hiring Events details returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26021
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.view_hiringevent", ]))
    def retrieve(self, request, pk=None, tenant=None):
        logger.info("{} requested to retrieve Hiring Event details for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 26022
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {"success": True, "message": _("Hiring Event details retrieved successfully"), "data": serializer.data}
            logger.info("{} Hiring Event details retrieved successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26023
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.add_hiringevent", ]))
    def create(self, request, tenant=None):
        logger.info("{} send data to create Hiring Event for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            req_data = request.data.copy()
            req_data["tenant"] = tenant
            if HiringEvent.objects.filter(tenant=tenant).exists():
                req_data["event_id"] = "E" + format(int(HiringEvent.objects.filter(tenant=tenant).order_by("created_at").last().event_id[1:]) + 1, "05")
            else:
                req_data["event_id"] = "E00001"
            serializer = self.serializer_class(data=req_data)
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _("Hiring Event has been added successfully."), "data": self.serializer_class(obj).data}
                logger.info("{} Hiring Events has been added successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 26024
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 26025
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None, tenant=None):
        logger.info("{} requested to update Hiring Event for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 26026
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {"success": True, "message": _("Hiring Event details updated successfully"), "data": self.serializer_class(obj).data}
                logger.info("{} Hiring Event details updated successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 26027
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 26028
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.delete_hiringevent", ]))
    def destroy(self, request, pk=None, tenant=None):
        logger.info("{} requested to delete Hiring Event for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 26029
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            obj.delete()
            context = {"success": True, "message": _("Hiring Event deleted successfully"), "data": None}
            logger.info("{} Hiring Event deleted successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26030
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class HiringPartnerViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = HiringPartner
    queryset = HiringPartner.objects.all()
    serializer_class = HiringPartnerSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = HiringPartner_filter_fields
    filter_fields = get_filter_fields(HiringPartner_filter_fields)
    ordering_fields = HiringPartner_filter_fields

    # def get_permissions(self):
    #     if self.action == 'list':
    #         permission_classes = [has_open_access_or_has_api_key_access_or_is_authenticated]
    #         return [permission([]) for permission in permission_classes]
    #     return super().get_permissions()

    # @method_decorator(license_required(["org_jobs.view_hiringpartner", ]))
    def list(self, request, tenant=None):
        logger.info("{} requested the list of Hiring Partner for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            pagination_data = None
            filtered_queryset = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant))
            if 'page' in request.query_params:
                page = self.paginate_queryset(filtered_queryset)
                if page is not None:
                    serializer = self.serializer_class(page, many=True)
                    pagination_data = self.get_paginated_response(serializer.data)
                else:
                    serializer = self.serializer_class(filtered_queryset, many=True,)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True,)
            context = {"success": True, "message": _("Hiring Partners data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} Hiring Partners data returned successfully.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,
                       'message': _('Hiring Partners data returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26031
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.view_hiringpartner", ]))
    def retrieve(self, request, pk=None, tenant=None):
        logger.info("{} requested to retrieve Hiring Partner details for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 26032
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {"success": True, "message": _("Hiring Partner details retrieved successfully"), "data": serializer.data}
            logger.info("{} Hiring Partner details retrieved successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26033
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.add_hiringpartner", ]))
    def create(self, request, tenant=None):
        logger.info("{} send data to create Hiring Partner".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"))
        try:
            req_data = request.data.copy()
            req_data["tenant"] = tenant
            serializer = self.serializer_class(data=req_data)
            if serializer.is_valid():
                obj = serializer.save()
                tenant =  Organisation.objects.get(pk=req_data["tenant"])
                notificationPayload = {
                    'vendorSpoc': req_data['spoc_email'],
                    'vendorOrgName':req_data['name'],
                    'employerOrgName':tenant.name,
                    'redirectUrl': PLATFORM_BASE_URL,
                    'userName': request.user.email if hasattr(request.user, 'email') else "AnonymousUser",
                    'email':[req_data['spoc_email']],
                    'vendorName': tenant.name
                }
                send_notification( notificationPayload, 'EMAIL', 'New hiring vendor request ', 'VENDOR_ADDITION_HIRE')
                context = {"success": True, "message": _("Hiring Partner has been added successfully."), "data": self.serializer_class(obj).data}
                logger.info("{} Hiring Partners has been added successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 26034
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 26035
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None, tenant=None):
        logger.info("{} requested to update Hiring Partner for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 26036
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {"success": True, "message": _("Hiring Partner details updated successfully"), "data": self.serializer_class(obj).data}
                logger.info("{} Hiring Partner details updated successfully for id: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 26037
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 26038
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.delete_hiringpartner", ]))
    def destroy(self, request, pk=None, tenant=None):
        logger.info("{} requested to delete Hiring Partner for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 26039
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            obj.delete()
            context = {"success": True, "message": _("Hiring Partner deleted successfully"), "data": None}
            logger.info("{} Hiring Partner deleted successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26040
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], name='vendor')
    def vendor(self, request, tenant=None):
        logger.info("{} requested the list of Hiring Partner for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            queryset = self.model.objects.filter(vendorId=tenant).values('tenant__id', 'tenant__name').distinct()
            context = {"success": True, "message": _("Hiring Partners data returned successfully."), "data": list(queryset)}
            logger.info("{} Hiring Partners data returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26031
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PartnerViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = Partner
    queryset = Partner.objects.all()
    serializer_class = PartnerSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = Partner_filter_fields
    filter_fields = get_filter_fields(Partner_filter_fields)
    ordering_fields = Partner_filter_fields

    # @method_decorator(permission_and_license_required(["org_jobs.view_partner", ]))
    def list(self, request, tenant=None):
        logger.info("{} requested the list of Partner for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            pagination_data = None
            filtered_queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True,)
            context = {"success": True, "message": _("Partners data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} Partners data returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,
                       'message': _('Partners data returned successfully.')}
        except Exception as error:
            internal_error = 26041
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.view_partner", ]))
    def retrieve(self, request, pk=None, tenant=None):
        logger.info("{} requested to retrieve Partner details for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 26042
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {"success": True, "message": _("Partner details retrieved successfully"), "data": serializer.data}
            logger.info("{} Partner details retrieved successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26043
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.add_partner", ]))
    def create(self, request, tenant=None):
        logger.info("{} send data to create Partner for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _("Partner has been added successfully."), "data": self.serializer_class(obj).data}
                logger.info("{} Partners has been added successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 26044
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 26045
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None, tenant=None):
        logger.info("{} requested to update Partner for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 26046
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {"success": True, "message": _("Partner details updated successfully"), "data": self.serializer_class(obj).data}
                logger.info("{} Partner details updated successfully for id: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 26047
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 26048
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.delete_partner", ]))
    def destroy(self, request, pk=None, tenant=None):
        logger.info("{} requested to delete Partner for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 26049
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            obj.delete()
            context = {"success": True, "message": _("Partner deleted successfully"), "data": None}
            logger.info("{} Partner deleted successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26050
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class JobCandidateViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = JobCandidate
    queryset = JobCandidate.objects.all()
    serializer_class = JobCandidateSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = JobCandidate_filter_fields
    filter_fields = get_filter_fields(JobCandidate_filter_fields)
    ordering_fields = JobCandidate_filter_fields

    # def get_permissions(self):
    #     if self.action == 'partial_update':
    #         permission_classes = [has_open_access_or_has_api_key_access_or_individual_permission]
    #         return [permission(["change_jobcandidate"]) for permission in permission_classes]
    #     return super().get_permissions()

    def get_candidate_queryset(self, tenant=None):
        qs = self.model.objects.all()
        if "candidate_stage_name" in self.request.query_params and "job__job_id" in self.request.query_params:
            stage_name = self.request.query_params["candidate_stage_name"].split(',')
            qs = qs.filter(job__job_id=self.request.query_params["job__job_id"], jobcandidatestage__stage_name__in=stage_name)
            if "candidate_stage_assignee" in self.request.query_params:
                stage_assignee = self.request.query_params["candidate_stage_assignee"].split(',')
                qs = qs.filter(jobcandidatestage__stage_assignee__in=stage_assignee)
                self.request.query_params._mutable = True
                del self.request.query_params["candidate_stage_assignee"]
                self.request.query_params._mutable = False
            
            if "candidate_stage_date__gte" in self.request.query_params:
                stage_date_gte = datetime.strptime(self.request.query_params["candidate_stage_date__gte"], "%Y-%m-%dT%H:%M:%S")
                qs = qs.filter(jobcandidatestage__stage_date__gte=stage_date_gte)
                self.request.query_params._mutable = True
                del self.request.query_params["candidate_stage_date__gte"]
                self.request.query_params._mutable = False
            
            if "candidate_stage_date__lte" in self.request.query_params:
                stage_date_lte = datetime.strptime(self.request.query_params["candidate_stage_date__lte"], "%Y-%m-%dT%H:%M:%S")
                qs = qs.filter(jobcandidatestage__stage_date__lte=stage_date_lte)
                self.request.query_params._mutable = True
                del self.request.query_params["candidate_stage_date__lte"]
                self.request.query_params._mutable = False
            self.request.query_params._mutable = True
            del self.request.query_params["candidate_stage_name"]
            self.request.query_params._mutable = False
            
            
        if "sourcing_partner__name__icontains" in self.request.query_params:
            value = self.request.query_params["sourcing_partner__name__icontains"]
            if value in ['Referral', 'Walkin']:
                qs = qs.filter(source=value)
            else:
                qs = qs.filter(sourcing_partner__name__icontains = value)
            self.request.query_params._mutable = True
            del self.request.query_params["sourcing_partner__name__icontains"]
            self.request.query_params._mutable = False
        if "filter_stage__name" in self.request.query_params and "job__job_id" in self.request.query_params:
            states = FilterStage.objects.get(job__job_id=self.request.query_params["job__job_id"], job__tenant=tenant, name=self.request.query_params["filter_stage__name"]).states.all()
            qs = qs.filter(state__in=states)
            self.request.query_params._mutable = True
            del self.request.query_params["filter_stage__name"]
            self.request.query_params._mutable = False

        return qs

    # @method_decorator(permission_and_license_required(["org_jobs.view_jobcandidate", ]))
    def list(self, request, tenant=None):
        logger.info("{} requested the list of JobCandidate for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            pagination_data = None
            if str(request.user.tenant.id) == tenant:
                filtered_queryset = self.filter_queryset(self.get_candidate_queryset(tenant=tenant).filter(tenant__id=tenant))
            else:
                filtered_queryset = self.filter_queryset(self.get_candidate_queryset(tenant=tenant).filter(tenant__id=tenant, sourcing_partner__vendorId=str(request.user.tenant.id)))
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.serializer_class(page, many=True, context={'tenant': tenant})
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True, context={'request': request})
            context = {"success": True, "message": _("JobCandidate data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} JobCandidate data returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,'message': _('JobCandidate details returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26071
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # @method_decorator(permission_and_license_required(["org_jobs.view_hiringevent", ]))
    @action(detail=False,  name='total_applicant_in_active_event', methods=["get"])
    def total_applicant_in_active_event(self, request, tenant=None):
        logger.info("{} requested the total_applicant_in_active_event for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            filtered_queryset = JobCandidate.objects.filter(hiring_event__event_end_date__gte=datetime.now(), tenant__id=tenant)
            count = filtered_queryset.count()
            context = {"success": True, "message": _("JobCandidate data for total_applicant_in_active_event returned successfully."), "data": count}
            logger.info("{} JobCandidate data for total_applicant_in_active_event returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26071
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.view_jobcandidate", ]))
    def retrieve(self, request, pk=None, tenant=None):
        logger.info("{} requested to retrieve JobCandidate details for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant=tenant)
            except Exception as error:
                internal_error = 26072
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj, context={'request': request})
            context = {"success": True, "message": _("JobCandidate details retrieved successfully"), "data": serializer.data}
            logger.info("{} JobCandidate details retrieved successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26073
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.add_jobcandidate", ]))
    def create(self, request, tenant=None):
        logger.info("{} send data to create JobCandidate for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            # @TODO:- Check if applicat is through job board and check job_boarrd status before accepting application
            request.data["tenant"] = tenant
            if JobCandidate.objects.filter(tenant=tenant).exists():
                request.data["candidateId"] = "C" + format(int(JobCandidate.objects.filter(tenant=tenant).order_by("created_at").last().candidateId[1:]) + 1, "05")
            else:
                request.data["candidateId"] = "C00001"
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _("JobCandidate has been added successfully."), "data": self.serializer_class(obj).data}
                logger.info("{} JobCandidate has been added successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 26074
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 26075
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None, tenant=None):
        logger.info("{} requested to update JobCandidate for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant=tenant)
            except Exception as error:
                internal_error = 26076
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            req_data = request.data
            if 'state' in req_data:
                req_data["state"] = str(HiringState.objects.get(name=req_data["state"]).id)
            serializer = self.serializer_class(obj, data=req_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {"success": True, "message": _("JobCandidate details updated successfully"), "data": self.serializer_class(obj).data}
                logger.info("{} JobCandidate details updated successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 26077
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 26078
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.delete_jobcandidate", ]))
    def destroy(self, request, pk=None, tenant=None):
        logger.info("{} requested to delete JobCandidate for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant=tenant)
            except Exception as error:
                internal_error = 26079
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            obj.delete()
            context = {"success": True, "message": _("JobCandidate deleted successfully"), "data": None}
            logger.info("{} JobCandidate deleted successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26080
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    @action(detail=False,  name='create_application', methods=["post"])
    def create_application(self, request, tenant=None):
        # @TODO: - Dedup Application check
        logger.info("{} send data to create application for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            req_data = request.data.copy()
            try:
                application = self.model.objects.get(job__job_id=req_data['job'], candidate__id=req_data['candidate'],tenant=tenant)
                context = {'error': "Failed to create application.", 'success': False, 'message': "Candidate already applied for this job."}
                logger.info("Candidate Application alreday found for this job_id {}".format(req_data['job']))
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            except Exception as error:
                try:
                    job_obj = Job.objects.get(job_id =req_data['job'], tenant=tenant)
                except Exception as error:
                    internal_error = 26111
                    context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
                    return Response(context, status=status.HTTP_404_NOT_FOUND)
                try:
                    candidate_obj = OrganisationEntityMasterData.objects.get(id =req_data['candidate'])
                except Exception as error:
                    internal_error = 26112
                    context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
                    return Response(context, status=status.HTTP_404_NOT_FOUND)
                candidate_data = {}
                if JobCandidate.objects.filter(tenant=tenant).exists():
                    candidate_data["applicationId"] = "A" + format(int(JobCandidate.objects.filter(tenant=tenant).order_by("created_at").last().applicationId[1:]) + 1, "05")
                else:
                    candidate_data["applicationId"] = "A00001"
                candidate_data['job'] = req_data['job']
                candidate_data['candidate'] = candidate_obj.id
                candidate_data["tenant"] = tenant
                if candidate_obj.entity_data['sourcing_partner']:
                    candidate_data['sourcing_partner'] = candidate_obj.entity_data['sourcing_partner']
                if candidate_obj.entity_data['hire_candidate_source']:
                    candidate_data["source"] = candidate_obj.entity_data['hire_candidate_source']
                if candidate_obj.entity_data["hiring_event"]:
                    candidate_data['hiring_event'] = candidate_obj.entity_data['hiring_event']
                if "entity_hiring_status" in candidate_obj.entity_data and candidate_obj.entity_data["entity_hiring_status"]:
                    candidate_data["state"] = candidate_obj.entity_data["entity_hiring_status"]
                if "initiator" in candidate_obj.entity_data and candidate_obj.entity_data["initiator"]:
                    candidate_data["created_by"] = candidate_obj.entity_data["initiator"]
                candidate_serializer = JobCandidateCreateSerializer(data=candidate_data)
                if candidate_serializer.is_valid():
                    applicant_obj = str(candidate_serializer.save().id)
                    if "job_candidate_stage" in candidate_obj.entity_data:
                        for item in candidate_obj.entity_data["job_candidate_stage"]:
                            item["candidate"] = applicant_obj
                            stage_serializer = JobCandidateStageSerializer(item)
                            if stage_serializer.is_valid():
                                stage_serializer.save()
                req_data['entity_phone_number'] = str(candidate_obj.entity_phone_number)
                req_data['job_candidate_id'] = str(applicant_obj)
                req_data['entity_id'] = str(candidate_obj.id)
                req_data['candidate_preferences'] = job_obj.candidate_preferences
                req_data['job'] = job_obj.job_id
                req_data['org_name'] = job_obj.tenant.name
                req_data['role'] = job_obj.role.name
                req_data['hire_candidate_source'] = candidate_obj.entity_data['hire_candidate_source']
                req_data["referralName"] = candidate_obj.entity_data['referralName'],
                req_data["referralId"] = candidate_obj.entity_data['referralId'],
                req_data["all_comments"]= candidate_obj.entity_data['all_comments']
                req_data['sourcing_partner'] = candidate_obj.entity_data['sourcing_partner']
                req_data['work_city'] = job_obj.work_city
                req_data['interview2_needed'] = job_obj.extra_fields['interview2_needed']
                req_data['interview3_needed'] = job_obj.extra_fields['interview3_needed']
                req_data['hiring_event'] = ""
                req_data["candidateKey"] = ["entity_phone_number"]
                request.data["app_key"] = "create_application"
                request.data["variables"] = req_data
                return launch_process_util(request, tenant)
        except Exception as error:
            internal_error = 26113
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    @action(detail=False,  name='application_history', methods=["get"])
    def application_history(self, request, tenant=None):
        try:
            if 'candidate' in request.query_params:
                candidate_id = request.query_params['candidate']
            else:
                error = 'Failed to get candidate.'
                context = {'error': error, 'success': False, 'message': _('Failed to get the record.')}
                logger.error(error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            application_data = self.model.objects.filter(candidate__id=candidate_id, tenant=tenant)
            serializer = self.serializer_class(application_data, many=True, context={'request': request})
            context = {"success": True, "message": _("JobCandidate data returned successfully."), "data": serializer.data}
            logger.info("{} JobCandidate data returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            context = {'error': str(error), 'success': True, "data":[],'message': _('JobCandidate details returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26114
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class HiringStateViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = HiringState
    queryset = HiringState.objects.all()
    serializer_class = HiringStateSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = ['name', 'order']
    filter_fields = get_filter_fields(['name', 'order'])
    ordering_fields = ['name', 'order']

    def list(self, request, tenant=None):
        logger.info("{} requested the list of HiringState for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            pagination_data = None
            filtered_queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True,)
            context = {"success": True, "message": _("HiringState data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} HiringState data returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,'message': _('HiringState details returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26081
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False,  name='hiring_state_and_status', methods=["get"])
    def hiring_state_and_status(self, request, tenant=None):
        logger.info("{} requested the list of Hiring status and state for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            data = []
            for hiring_state_data in HiringState.objects.filter(tenant__id=tenant):
                data.append({'name': hiring_state_data.name, 'value': hiring_state_data.name})
            context = {"success": True, "message": _("Hiring State and Hiring status data returned successfully."), "data": data}
            logger.info("{} Hiring State and Hiring status data returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26110
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HeadCountViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = HeadCountPlan
    queryset = HeadCountPlan.objects.all()
    serializer_class = HeadCountPlanSerializer
    gap_serializer_class = HeadCountGapSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = HeadCountPlan_filter_fields
    filter_fields = get_filter_fields(HeadCountPlan_filter_fields)
    ordering_fields = HeadCountPlan_filter_fields

    # @method_decorator(permission_and_license_required(["org_jobs.view_headcountplan", ]))
    def list(self, request, tenant=None):
        logger.info("{} requested the list of HeadCountPlan for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            pagination_data = None
            filtered_queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True,)
            context = {"success": True, "message": _("HeadCountPlan data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} HeadCountPlan data returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,'message': _('HeadCountPlan details returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26081
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # @method_decorator(permission_and_license_required(["org_jobs.view_headcountplan", ]))
    @action(detail=False,  name='gap', methods=["get"])
    def gap(self, request, tenant=None):
        logger.info("{} requested the list of HeadCountPlan Gap".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"))
        try:
            pagination_data = None
            filtered_queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.gap_serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.gap_serializer_class(filtered_queryset, many=True,)
            context = {"success": True, "message": _("HeadCountPlan Gap data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} HeadCountPlan Gap data returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,'message': _('HeadCountPlan Gap details returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26081
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.view_headcountplan", ]))
    def retrieve(self, request, pk=None, tenant=None):
        logger.info("{} requested to retrieve HeadCountPlan details for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 26082
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {"success": True, "message": _("HeadCountPlan details retrieved successfully"), "data": serializer.data}
            logger.info("{} HeadCountPlan details retrieved successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26083
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.add_headcountplan", ]))
    def create(self, request, tenant=None):
        logger.info("{} send data to create HeadCountPlan".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"))
        try:
            req_data = request.data
            res_data =[]
            with transaction.atomic():
                for item in req_data:
                    obj, created = HeadCountPlan.objects.get_or_create(role=item["role"], location=item["location"])
                    item_detail = {}
                    item_detail["total_count"] = item["total_count"]
                    item_detail["month"] = item["month"]
                    item_detail["year"] = item["year"]
                    item_detail["plan"] = obj.id
                    detail_serializer = HeadCountPlanDetailSerializer(data=item_detail)
                    if detail_serializer.is_valid():
                        detail_obj = detail_serializer.save()
                    else:
                        raise Exception
                context = {"success": True, "message": _("HeadCountPlan has been added successfully."), "data": req_data}
                logger.info("{}HeadCountPlan has been added successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26085
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None, tenant=None):
        logger.info("{} requested to update HeadCountPlan for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 26086
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {"success": True, "message": _("HeadCountPlan details updated successfully"), "data": self.serializer_class(obj).data}
                logger.info("{} HeadCountPlan details updated successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 26087
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 26088
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_jobs.delete_headcountplan", ]))
    def destroy(self, request, pk=None, tenant=None):
        logger.info("{} requested to delete HeadCountPlan for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 26089
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            obj.delete()
            context = {"success": True, "message": _("HeadCountPlan deleted successfully"), "data": None}
            logger.info("{} HeadCountPlan deleted successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26090
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ChartViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = JobCandidate
    queryset = JobCandidate.objects.all()
    serializer_class = JobCandidateSerializer

    def chart_filter_util(self, req_data):
        chart_filter = {}
        chart_filter["tenant__id"] = req_data["tenant"]
        if "work_location__name" in req_data:
            chart_filter["job__work_location__name__in"] = req_data["work_location__name"]
        if "event_id" in req_data:
            chart_filter["hiring_event__event_id"] = req_data["event_id"]
        if "job_id" in req_data:
            chart_filter["job__job_id"] = req_data["job_id"]
        if "role__name" in req_data:
            chart_filter["job__role__name__in"] = req_data["role__name"]
        if "sourcing_partner__name" in req_data:
            chart_filter["sourcing_partner__name__in"] = req_data["sourcing_partner__name"]
        if "start_date" in req_data:
            chart_filter["created_at__gte"] = req_data["start_date"]
        if "end_date" in req_data:
            chart_filter["created_at__lte"] = req_data["end_date"]
        return chart_filter


    # @method_decorator(permission_and_license_required(["org_jobs.view_job", ]))
    def create(self, request, tenant=None):
        logger.info("{} send data to get ChartView for Jobs for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            query_params = request.query_params.copy()
            req_data = request.data.copy()
            req_data["tenant"] = tenant
            res_data =[]
            chart_filter = {}
            if query_params["chartName"] == "HiringStatus":
                chart_filter = self.chart_filter_util(req_data)
                candidate_data = JobCandidate.objects.filter(**chart_filter)
                if candidate_data:
                    prev = 0
                    for hiring_stage in Job.objects.get(job_id=req_data["job_id"], tenant=tenant).stage.all().order_by('-order'):                         
                        var_res = {}
                        var_res['hiring_state__name'] = hiring_stage.name
                        var_res['count'] = 0
                        for item in hiring_stage.states.all():
                            var_res['count'] = var_res['count'] + candidate_data.filter(state = item).count()
                        var_res['count'] = var_res['count'] + prev
                        res_data.append(var_res)
                        prev = var_res['count']
                    var_res = {}
                    var_res['hiring_state__name'] = "Total"
                    var_res['count'] = candidate_data.count()
                    res_data.append(var_res)
                    res_data.reverse()

            if query_params["chartName"] == "HeadCount":
                chart_filter["entity_model__key"] = "employee"
                chart_filter["entity_model__tenant__id"] = req_data["tenant"]
                if "job_id" in req_data:
                    chart_filter["entity_data__job"] = req_data["job_id"]
                if "work_location__name" in req_data:
                    chart_filter["work_location__in"] = req_data["work_location__name"]
                if "event_id" in req_data:
                    chart_filter["entity_data__hiring_event"] = req_data["event_id"]
                if "role__name" in req_data:
                    chart_filter["role__in"] = req_data["role__name"]
                if "sourcing_partner__name" in req_data:
                    chart_filter["entity_data__sourcing_partner__in"] = req_data["sourcing_partner__name"]
                if "start_date" in req_data:
                    chart_filter["created_at__gte"] = req_data["start_date"]
                if "end_date" in req_data:
                    chart_filter["created_at__lte"] = req_data["end_date"]
                res_data = OrganisationEntityMasterData.objects.filter(**chart_filter).count()
            
            elif query_params["chartName"] == "Source":
                chart_filter = self.chart_filter_util(req_data)
                res_data = list(JobCandidate.objects.filter(**chart_filter).filter(sourcing_partner__isnull=False).values('sourcing_partner__name').annotate(count=Count('sourcing_partner__name')).order_by('-count'))            
                if JobCandidate.objects.filter(**chart_filter).filter(source="Walkin").exists():
                    res_data.append({
                        "sourcing_partner__name" : "Walkin",
                        "count" : JobCandidate.objects.filter(**chart_filter).filter(source="Walkin").count()
                    })
                if JobCandidate.objects.filter(**chart_filter).filter(source="Referral").exists():
                    res_data.append({
                        "sourcing_partner__name" : "Referral",
                        "count" : JobCandidate.objects.filter(**chart_filter).filter(source="Referral").count()
                    })
            
            elif query_params["chartName"] == "OpenPosition":
                filterset = Job.objects.filter(tenant__id=tenant)
                if "work_location__name" in req_data:
                    chart_filter["work_location__name__in"] = req_data["work_location__name"]
                if "role__name" in req_data:
                    chart_filter["role__name__in"] = req_data["role__name"]
                if "job_id" in req_data:
                    chart_filter["job_id"] = req_data["job_id"]
                if 'event_id' in req_data:
                    filterset = HiringEvent.objects.get(event_id=req_data["event_id"], tenant__id=tenant).job.all()
                res_data = list(filterset.filter(**chart_filter).values('role__name').annotate(count=Sum('available_positions')))
            
            elif query_params["chartName"] == "TimeToHire":
                chart_filter = self.chart_filter_util(req_data)
                res_data = list(JobCandidate.objects.filter(**chart_filter).filter(candidate__employee_type="Employee").values('job__role__name').annotate(avg=F('updated_at') - F('job__created_at')).values('job__role__name').annotate(days=Avg('avg')))
                for avg_data in res_data:
                    days_value = float(avg_data["days"].total_seconds()/86400)
                    avg_data["days"]  = round(days_value, 2)
            
            elif query_params["chartName"] == "TotalOpening":
                if "job_work_locality" in req_data:
                    chart_filter["job_work_locality__locality__name__in"] = req_data["job_work_locality__locality__name"]
                if "role__name" in req_data:
                    chart_filter["role__name__in"] = req_data["role__name"]
                res_data = Job.objects.filter(status="Active", tenant__id=tenant).filter(**chart_filter).aggregate(total_positions__sum=Sum('job_work_locality__total_positions'))
            
            elif query_params["chartName"] == "TotalFilled":
                if "job_work_locality__locality__name" in req_data:
                    chart_filter["job_work_locality__locality__name__in"] = req_data["job_work_locality__locality__name"]
                if "role__name" in req_data:
                    chart_filter["role__name__in"] = req_data["role__name"]
                res_data = Job.objects.filter(status="Active", tenant__id=tenant).filter(**chart_filter).annotate(remaining_positions = F('job_work_locality__filled_positions')).values('remaining_positions').aggregate(Sum('remaining_positions')) 
            
            elif query_params["chartName"] == "TotalRemaining":
                if "job_work_locality__locality__name" in req_data:
                    chart_filter["job_work_locality__locality__name__in"] = req_data["job_work_locality__locality__name"]
                if "role__name" in req_data:
                    chart_filter["role__name__in"] = req_data["role__name"]
                res_data = Job.objects.filter(status="Active", tenant__id=tenant).filter(**chart_filter).annotate(available_positions = F('job_work_locality__total_positions') - F('job_work_locality__filled_positions')).values('available_positions').aggregate(Sum('available_positions')) 
            
            elif query_params["chartName"] == "TopSource":
                chart_filter = self.chart_filter_util(req_data)
                res_data = list(JobCandidate.objects.filter(**chart_filter).filter(sourcing_partner__isnull=False).values('sourcing_partner__name').annotate(count=Count('sourcing_partner__name')).order_by('-count')[:2])
            
            elif query_params["chartName"] == "TotalApplicants":
                chart_filter = self.chart_filter_util(req_data)
                if "job_work_locality__locality__name" in req_data:
                    chart_filter["job__job_work_locality__locality__name__in"] = req_data["job_work_locality__locality__name"]
                res_data = JobCandidate.objects.filter(**chart_filter).count()

            elif query_params["chartName"] == "TotalEvents":
                res_data = HiringEvent.objects.filter(event_end_date__gte=datetime.now(), tenant__id=tenant).filter(**chart_filter).count()
            
            elif query_params["chartName"] == "SourcingChannelEfficiency":
                chart_filter = self.chart_filter_util(req_data)
                avg_applicants_source = round(JobCandidate.objects.filter(**chart_filter).filter(candidate__employee_type="Employee").count() / (HiringPartner.objects.filter(tenant__id=tenant).count() + 2), 2)
                res_data = list(JobCandidate.objects.filter(**chart_filter).filter(sourcing_partner__isnull=False).filter(candidate__employee_type="Employee").values("sourcing_partner__name").annotate(count=Count("sourcing_partner__name")))
                for item in res_data:
                    item["SourcingChannelEfficiency"] = item["count"] - avg_applicants_source
                
                res_data.append({
                    "sourcing_partner__name" : "Walkin",
                    "SourcingChannelEfficiency" : JobCandidate.objects.filter(**chart_filter).filter(candidate__employee_type="Employee", source="Walkin").count() - avg_applicants_source,
                    "count" : JobCandidate.objects.filter(**chart_filter).filter(candidate__employee_type="Employee", source="Walkin").count()
                })
                
                res_data.append({
                    "sourcing_partner__name" : "Referral",
                    "SourcingChannelEfficiency" : JobCandidate.objects.filter(**chart_filter).filter(candidate__employee_type="Employee", source="Referral").count() - avg_applicants_source,
                    "count" : JobCandidate.objects.filter(**chart_filter).filter(candidate__employee_type="Employee", source="Referral").count()
                })

            context = {"success": True, "message": _("ChartView has been sent successfully."), "data": res_data}
            logger.info("{}ChartView has been sent successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 26091
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_jobs_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_jobs_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

def daterange(date1, date2):
    for n in range(int ((date2 - date1).days)+1):
        yield date1 + timedelta(n)


class SlotViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = Slot
    queryset = Slot.objects.all()
    serializer_class = SlotSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = Slot_filter_fields
    filter_fields = get_filter_fields(Slot_filter_fields)
    ordering_fields = Slot_filter_fields


    def list(self, request, tenant=None):
        logger.info("{} requested the list of Slot for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        filtered_queryset = None
        try:
            if 'attribute_value' in request.query_params:
                attr = request.query_params['attribute_value']
                data = self.filter_queryset(self.get_queryset().filter(job__tenant__id=tenant)).values_list(attr, flat=True).distinct()
                context = {"success": True, "data": data}
                logger.info("{} Slot attribute list returned successfully for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                return Response(context, status=status.HTTP_200_OK)
            filtered_queryset = self.filter_queryset(self.get_queryset().filter(job__tenant__id=tenant))
            
            pagination_data = None
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True)
            serializer = self.serializer_class(filtered_queryset, many=True)
            context = {"success": True, "message": _("Slot data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} Slot data returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            internal_error = 27001
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total, 'message': _('Slot data returned successfully.')}
            logger.exception(getMessage(slot_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 27002
            context = {'error': str(error), 'success': False, 'message': _(getMessage(slot_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getMessage(slot_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def retrieve(self, request, pk=None, tenant=None, **kwargs):
        logger.info("{} requested to retrieve Slot for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, job__tenant__id=tenant)
            except Exception as error:
                internal_error = 27003
                context = {'error': str(error), 'success': False, 'internal_error': internal_error}
                logger.error(getLogMessage(slot_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj, context={"request":request})
            context = {"success": True, "message": _("Slot details retrieved successfully"), "data": serializer.data}
            logger.info("{} Slot details retrieved successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 27004
            context = {'error': str(error), 'success': False, 'internal_error': internal_error}
            logger.error(getLogMessage(slot_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def create(self, request, tenant=None):
        logger.info("{} send data to create Slot for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            request.data['tenant'] = tenant
            start_date = datetime.strptime(request.data['start_date'], "%d %b %Y").date()
            last_date = datetime.strptime(request.data['end_date'], "%d %b %Y").date()
            excludeWeekends = request.data["excludeWeekends"]
            alloted_slots_per_hour = request.data['alloted_slots_per_hour']
            list_of_slot = []

            for item in request.data['slotTimeDatagrid']:
                start_time = datetime.strptime(item['start_time'], "%H:%M:%S")
                end_time = datetime.strptime(item['end_time'], "%H:%M:%S")
                total_hour_difference = (end_time - start_time).seconds//3600
                weekdays = [5,6]
                for date in daterange(start_date, last_date):
                    if excludeWeekends and date.weekday() in weekdays:
                        pass
                    else:
                        # Creating slots wrt date and time
                        for hour in range(total_hour_difference):
                            slot_wrt_date_and_time = dict(request.data)
                            slot_wrt_date_and_time['date'] = date
                            slot_wrt_date_and_time['start_time'] = (start_time + timedelta(hours=hour)).strftime("%H:%M:%S")
                            slot_wrt_date_and_time['alloted_slots'] = alloted_slots_per_hour
                            list_of_slot.append(slot_wrt_date_and_time)
                        
            serializer = self.serializer_class(data=list_of_slot, many=True)
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _("Slot has been added successfully."), "data": serializer.data}
                logger.info("{} Slot has been added successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 27009
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(slot_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(slot_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 27010
            context = {'error': str(error), 'success': False, 'message': _(getMessage(slot_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(slot_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def update(self, request, pk=None, tenant=None):
        logger.info("{} requested to update Slot for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 27011
                context = {'error': str(error), 'success': False, 'message': _(getMessage(slot_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(slot_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {"success": True, "message": _("Slot details updated successfully"), "data": self.serializer_class(obj).data}
                logger.info("{} Slot details updated successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 27012
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(slot_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(slot_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 27013
            context = {'error': str(error), 'success': False, 'message': _(getMessage(slot_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(slot_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None, tenant=None):
        logger.info("{} requested to delete Slot for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, job__tenant__id=tenant)
            except Exception as error:
                internal_error = 27014
                context = {'error': str(error), 'success': False, 'message': _(getMessage(slot_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(slot_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            obj.delete()
            context = {"success": True, "message": _("Slot deleted successfully"), "data": None}
            logger.info("{} Slot deleted successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 27015
            context = {'error': str(error), "success": False, "message": _(getMessage(slot_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(slot_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, internal_error))
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        

class HiringRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = VendorWorkLocation
    queryset = VendorWorkLocation.objects.all()
    serializer_class = VendorWorkLocationSerializer

    def update(self, request, pk=None, tenant=None):
        logger.info("{} requested to update Vendor Hiring Request for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            req_data = request.data.copy()
            req_data['tenant'] = tenant
            if "users_list" in req_data:
                req_data["user_id"] = []
                for item in req_data["users_list"]:
                    if item != "":
                        req_data["user_id"].append(OrganisationUser.objects.get(email=item, tenant=req_data['vendor_tenant']).id)
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 28003
                context = {'error': str(error), 'success': False, 'message': _(getMessage(hiring_request_error, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(hiring_request_error, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            # subject =  notification_payload['vendorOrgName']
            notification_payload2 = {}
            job_obj = Job.objects.get(job_id=req_data['job_id'], tenant=tenant)
            tenant_org_name = str(HiringPartner.objects.get(vendorId=req_data['vendor_tenant']).name)
            user_list = OrganisationGroup.objects.get(name=job_obj.job_id + " - Sourcing", tenant=tenant).users.all()
            notification_payload2["email"] = list(user_list.values_list('email', flat=True))
            notification_payload2["vendorOrgName"] = tenant_org_name
            notification_payload2["employerManager"] = job_obj.tenant.name
            notification_payload2["vendorUserName"] = req_data['vendorUser']
            notification_payload2["vendorName"] =  job_obj.tenant.name
            notification_payload2["jobName"] = job_obj.job_title
            notification_payload2["jobRole"] = job_obj.role.name
            notification_payload2["city"] = job_obj.work_city
            notification_payload2["openings"] = job_obj.total_positions
            notification_payload2["redirectUrl"] = PLATFORM_BASE_URL
            if req_data['status'] == 'Accepted':
                stages = job_obj.filter_stage.all()
                logger.info("{} vendor approval accepted: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
                group_key_sourcing = req_data['job_id'] + ' - '+"Sourcing"
                group_key_sourcing = group_key_sourcing.lower().replace(" ","_")
                group_obj_sourcing = OrganisationGroup.objects.filter(key=group_key_sourcing,tenant=tenant).first()
                if group_obj_sourcing:
                    logger.info("{} Adding users to Sourcing group: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
                    group_obj_sourcing.users.add(*req_data['user_id'])
                    group_obj_sourcing.save()
                for stage in stages:
                    group_key = req_data['job_id'] + ' - '+stage.name
                    owner_key = stage.name.split(" ")
                    owner_key = "".join(owner_key) + "Owner"
                    logger.info(owner_key)
                    if owner_key in job_obj.extra_fields and job_obj.extra_fields[owner_key]['Respective Sources']:
                        group_key = group_key.lower().replace(" ","_")
                        group_obj = OrganisationGroup.objects.filter(key=group_key,tenant=tenant).first()
                        if group_obj:
                            logger.info("{} Adding users to group: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
                            group_obj.users.add(*req_data['user_id'])
                            group_obj.save()
                subject2 = tenant_org_name + " accepted assigned job"
                send_notification(notification_payload2, 'EMAIL', subject2, 'JOB_ACCEPTANCE_HIRE')
            if req_data['status'] == 'Rejected':
                subject2 = tenant_org_name + " rejected assigned job"
                send_notification(notification_payload2, 'EMAIL', subject2, 'JOB_REJECTION_HIRE')
            serializer = self.serializer_class(obj, data=req_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {"success": True, "message": _("Hiring Request details updated successfully"), "data": self.serializer_class(obj).data}
                logger.info("{} Hiring Request details updated successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 28004
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(hiring_request_error, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(hiring_request_error, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 28005
            context = {'error': str(error), 'success': False, 'message': _(getMessage(hiring_request_error, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(hiring_request_error, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
