# coding=utf-8
import re
from django.utils.translation import gettext as _

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.decorators import action
from ezedox.settings import MEDIUM_PRIORITY_TASK

import process_engine
from apps.org_apps.models import OrganisationWorkflow
from apps.org_form.models import OrganisationForm, Transaction
from apps.org_group.models import OrganisationGroup
from apps.organisations.models import Organisation
from apps.org_form.utils import get_key_type
from apps.org_apps.utils import launch_process_util
from apps.notifications.notification import send_inapp_notification
from apps.notifications.constants import NotificationConstant
from utils.views import parse_flowable_content
from utils.process_engine_proxy import call
from utils.loggerwrapper import Logger, getMessage, getLogMessage
from .utils import task_variable_update, task_existance_check, bulk_task_reassign
from .serializers import OpenInitiationSerializer
from .internal_errors import proxy_bpm_errors
from .flowable import get_process, get_tasks_by_process_ids

logger = Logger(__name__)

class AllTaskViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def post(self, request, tenant):
        try:
            req_body = request.data
            req_body["tenantId"] = tenant
            response_context, response_status = call(
                module=process_engine.QueryApi, func=process_engine.QueryApi.query_tasks, data=req_body, tenant_id=tenant, request=request, type="post")
            if response_status < 300:
                context = {"success": True, "message": _("Tasks retrieved successfully."), "data": response_context}
                logger.info(" Tasks retrieved successfully for tenant: {}.".format(tenant))
            else:
                internal_error = 1001
                context = {"success": True, "message": str(internal_error), "data": response_context, "internal_error": internal_error}
            return Response(context, status=response_status)
        except Exception as error:
            internal_error = 1002
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TaskViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request, tenant):
        try:
            req_body = {}
            req_body['assignee'] = request.user.userId
            if request.query_params:
                req_body["size"] = request.query_params["size"]
                req_body["start"] = request.query_params["start"]
                req_body["sort"] = request.query_params["sort"]
                req_body["order"] = request.query_params["order"]
                req_body["include_process_variables"] = request.query_params["includeProcessVariables"]

            response_context, response_status = call(
                module=process_engine.TasksApi, func=process_engine.TasksApi.list_tasks, data=req_body, tenant_id=tenant, request=request, type="get", read_replica=True)
            if response_status < 300:
                context = {"success": True, "message": _(
                    "Tasks retrieved successfully."), "data": response_context}
                logger.info("{}, Tasks retrieved successfully for tenant: {}.".format(
                    request.user.email, tenant))
            else:
                internal_error = 1001
                context = {"success": True, "message": _(getMessage(
                    proxy_bpm_errors, internal_error)), "data": response_context, "internal_error": internal_error}
                logger.error(getLogMessage(proxy_bpm_errors, internal_error).format(
                    request.user.email), internal_error)
            return Response(context, status=response_status)
        except Exception as error:
            internal_error = 1002
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors, internal_error).format(
                request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request, tenant):
        try:
            data = request.data
            bulk_task_reassign.apply_async(args=[data["from"], data["to"], tenant], priority=MEDIUM_PRIORITY_TASK)
            context = {"success": True, 'message': "Request Accepted Successfully"}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 1002
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors, internal_error).format(
                request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, tenant):
        try:
            data = request.data
            bulk_task_reassign.apply_async(args=[data["from"], data["to"], tenant], priority=MEDIUM_PRIORITY_TASK)
            context = {"success": True, 'message': "Request Accepted Successfully"}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 1002
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors, internal_error).format(
                request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class GroupTaskViewSet(viewsets.ReadOnlyModelViewSet):
    # permission_classes = [AllowAny]
    permission_classes = [AllowAny]

    def list(self, request, tenant):
        try:
            req_body = {}
            groups = []
            email = get_email(request)
            for group in OrganisationGroup.objects.filter(tenant=tenant):
                if group.users.filter(id=request.user.id).exists():
                    groups.append(str(group.id))
                    groups.append(group.key)
            req_body['candidate_groups'] = ",".join(groups)
            req_body["size"] = request.query_params["size"]
            response_context, response_status = call(
                module=process_engine.TasksApi, func=process_engine.TasksApi.list_tasks, data=req_body, tenant_id=tenant, request=request, type="get", read_replica=True)
            if response_status < 300:
                context = {"success": True, "message": _(
                    "Task list for the Groups returned successfully."), "data": response_context}
                logger.info(
                    "{}, Task list for the Groups returned successfully.".format(email))
            else:
                internal_error = 1003
                context = {"success": True, "message": _(getMessage(
                    proxy_bpm_errors, internal_error)), "data": response_context, "internal_error": internal_error}
                logger.error(getLogMessage(proxy_bpm_errors, internal_error).format(
                    email, tenant), internal_error)
            return Response(context, status=response_status)
        except Exception as error:
            internal_error = 1004
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors, internal_error).format(
                email, error, tenant), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# TODO: Permission implementation if this API is used in future.


class RuntimeTaskInstanceViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]

    def retrieve(self, request, pk=None, tenant=None):
        try:
            response_context, response_status = call(module=process_engine.TasksApi, func=process_engine.TasksApi.get_task, tenant_id=tenant, data={
                                                     "task_id": pk}, request=request, type="get", read_replica=True)
            if response_status < 300:
                context = {"success": True, "message": _(
                    "Task list for the Groups returned successfully."), "data": response_context}
                logger.info("{}, Task list for the Groups returned successfully for tenant: {}.".format(
                    request.user.email, tenant))
            else:
                internal_error = 1005
                context = {"success": True, "message": _(getMessage(
                    proxy_bpm_errors, internal_error)), "data": response_context, "internal_error": internal_error}
                logger.error(getLogMessage(proxy_bpm_errors, internal_error).format(
                    request.user.email), internal_error)
            return Response(context, status=response_status)
        except Exception as error:
            internal_error = 1006
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors, internal_error).format(
                request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HistoryTaskInstanceViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]

    def list(self, request, tenant=None):
        try:
            req_body = {}
            req_body['task_assignee'] = request.user.email
            req_body["finished"] = request.query_params["finished"]
            response_context, response_status = call(
                module=process_engine.HistoryTaskApi, func=process_engine.HistoryTaskApi.list_historic_task_instances, data=req_body, request=request, type="get", tenant_id=tenant, read_replica=True)
            if response_status < 300:
                context = {"success": True, "message": _(
                    "Historic tasks list returned successfully."), "data": response_context}
                logger.info("{}, Historic tasks list returned successfully for tenant: {}.".format(
                    request.user.email, tenant))
            else:
                internal_error = 1007
                context = {"success": True, "message": _(getMessage(
                    proxy_bpm_errors, internal_error)), "data": response_context,  "internal_error": internal_error}
                logger.error(getLogMessage(proxy_bpm_errors, internal_error).format(
                    request.user.email), internal_error)
            return Response(context, status=response_status)
        except Exception as error:
            internal_error = 1008
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)),  "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors, internal_error).format(
                request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TaskActionUpdateViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    # task reassign endpoint
    def put(self, request, task_id, tenant=None):
        user_email = get_email(request)
        try:
            if isinstance(request, dict):
                processInstanceId = request["process_instance_id"]
                assignee = request["assignee"]
            else:
                processInstanceId = request.data["processInstanceId"]
                assignee = request.data["assignee"]
            req_body = {}
            req_id = {}
            req_id["process_instance_id"] = processInstanceId
            req_body["user"] = assignee
            req_body["type"] = "participant"
            if not tenant:
                tenant = request['tenant_id']
            action_res = call(module=process_engine.ProcessInstanceIdentityLinksApi,
                              func=process_engine.ProcessInstanceIdentityLinksApi.create_process_instance_identity_links, id=req_id, data=req_body, tenant_id=tenant, type="post")
            if action_res[1] == 201 or action_res[1] == 200:
                logger.info("user data of process identitylinks is sucessfully updated of processinstanceId:{} for tenant: {}".format(
                    processInstanceId, tenant))
            else:
                internal_error = 1009
                logger.error(getMessage(proxy_bpm_errors, internal_error).format(
                    processInstanceId), internal_error)
            flowable_data = {}
            flowable_data["assignee"] = assignee
            proxy_response, proxy_response_status_code = call(module=process_engine.TasksApi, func=process_engine.TasksApi.update_task, data={
                                                              "task_id": task_id, "body": flowable_data}, tenant_id=tenant, type="put")
            if not isinstance(request, dict):
                try:
                    processInstanceId = request.data["processInstanceId"]
                    if proxy_response_status_code == 200:
                        send_inapp_notification(
                            request, processInstanceId, NotificationConstant.REASSIGN_CHOICE, task_id)
                except:
                    internal_error = 1010
                    logger.exception(getMessage(
                        proxy_bpm_errors, internal_error), internal_error)
            if proxy_response_status_code < 300:
                logger.info("{} has reassigned Task : {} to {} Successfully for tenant: {}.".format(
                    user_email, task_id, assignee, tenant))
                context = {"success": True, "message": _(
                    "Task Reassigned Successfully."), "data": proxy_response}
            else:
                internal_error = 1039
                logger.error(getMessage(proxy_bpm_errors,
                                        internal_error), internal_error)
                context = {"success": True, "message": _(getMessage(
                    proxy_bpm_errors, internal_error)), "data": proxy_response, "internal_error": internal_error}
            return Response(context, status=proxy_response_status_code)
        except Exception as error:
            if isinstance(request, dict):
                raise error
            internal_error = 1011
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors, internal_error).format(
                user_email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, task_id, tenant=None):
        try:
            task_update_data = request.data
            flowable_data = {}
            if task_update_data['action'] == "claim":
                flowable_data["action"] = "claim"
                flowable_data["assignee"] = request.user.userId
            if task_update_data['action'] == "unclaim":
                #To check if task can be claimed
                task_idt_lks_response, task_idt_lks_response_code = call(module=process_engine.TaskIdentityLinksApi , func=process_engine.TaskIdentityLinksApi.list_tasks_instance_identity_links, data= {"task_id": task_id}, tenant_id=tenant, request=request, type="get")
                if len(task_idt_lks_response) > 1 :
                    flowable_data["action"] = "claim"
                else:
                    context = {'success': False, "message": _("Task cannot be unclaimed.")}
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            if task_update_data['action'] == "complete":
                formkey = request.query_params['formKey']
                actual_form_key, form_version = formkey.split("::")
                form = OrganisationForm.objects.filter(key=actual_form_key, version=form_version, tenant__id=tenant).first().keytypepair
                variables = task_variable_update(request, task_update_data, get_key_type(form))
                flowable_data = {
                    "action": "complete",
                    "variables": variables
                }
            proxy_response, proxy_response_status_code = call(module=process_engine.TasksApi, func=process_engine.TasksApi.execute_task_action, data={
                                                              "task_id": task_id, "body": flowable_data}, tenant_id=tenant, request=request, type="put")
            if proxy_response_status_code == 200 and 'action' in request.data:
                if task_update_data['action'] == "claim":
                    context = {"success": True, "message": _("Task Claimed Successfully."), "data": proxy_response}
                    logger.info("{}, Task : {} is claimed by {} Successfully for tenant: {}.".format(get_email(request), task_id, get_email(request), tenant))
                if task_update_data['action'] == "unclaim":
                    context = {"success": True, "message": _("Task Unclaimed Successfully."), "data": proxy_response}
                    logger.info("{}, Task : {} is unclaimed by {} Successfully for tenant: {}.".format(get_email(request), task_id, get_email(request), tenant))
                if task_update_data['action'] == "complete":
                    context = {"success": True, "message": _("Task Completed Successfully."), "data": proxy_response}
                    logger.info("{}, Task Completed Successfully  for tenant: {}.".format(get_email(request), tenant))
            elif proxy_response_status_code == 409:
                internal_error = 1040
                context = {"success": True, "message": _(getMessage(
                    proxy_bpm_errors, internal_error)), "data": proxy_response, "internal_error": internal_error}
                logger.error(getLogMessage(proxy_bpm_errors, internal_error).format(
                    get_email(request)), internal_error)
            else:
                res = proxy_response
                try:
                    regex = r"(?<=No catching boundary event found for error with errorCode ').*(?=', neither in same process nor in parent process)"
                    matches = re.search(regex, res["exception"])
                    if matches:
                        res["exception"] = matches.group()
                    regex2 = r"(?<=No matching parent execution for error code ).*(?= found)"
                    matches = re.search(regex2, res["exception"])
                    if matches:
                        res["exception"] = matches.group()
                    context = {"success": False, "message": res["exception"], "data": proxy_response, "error": proxy_response}
                    logger.error(res["exception"])
                    return Response(context, status=proxy_response_status_code)
                except Exception as error:
                    logger.error(error)
                internal_error = 1013
                context = {"success": True, "message": _(getMessage(
                    proxy_bpm_errors, internal_error)), "data": proxy_response, "internal_error": internal_error}
                logger.error(getLogMessage(proxy_bpm_errors, internal_error).format(
                    request.user.email if hasattr(request.user, 'email') else "AnonymousUser"), internal_error)
            return Response(context, status=proxy_response_status_code)
        except Exception as error:
            internal_error = 1014
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors, internal_error).format(
                request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RuntimeProcessInstanceViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        try:
            req_body = {}
            req_body['sort'] = 'startTime'
            req_body['order'] = 'desc'
            response_context, response_status = call(
                module=process_engine.ProcessInstancesApi, func=process_engine.ProcessInstancesApi.list_process_instances, data=req_body, request=request, type="get", read_replica=True)
            if response_status < 300:
                context = {"success": True, "message": _(
                    "Runtime Process Instance List Retrieved Successfully."), "data": response_context}
                logger.info("{}, Runtime Process Instance List Retrieved Successfully.".format(
                    request.user.email))
            else:
                internal_error = 1015
                context = {"success": True, "message": _(getMessage(
                    proxy_bpm_errors, internal_error)), "data": response_context, "internal_error": internal_error}
                logger.error(getLogMessage(proxy_bpm_errors, internal_error).format(
                    request.user.email), internal_error)
            return Response(context, status=response_status)
        except Exception as error:
            internal_error = 1016
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors, internal_error).format(
                request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HistoryProcessInstanceViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        try:
            response_context, response_status = call(
                module=process_engine.HistoryProcessApi, func=process_engine.HistoryProcessApi.list_historic_process_instances, request=request, type="get", read_replica=True)
            if response_status < 300:
                context = {"success": True, "message": _(
                    "Historic Process Instance List Retrieved Successfully."), "data": response_context}
                logger.info("{}, Historic Process Instance List Retrieved Successfully.".format(
                    request.user.email))
            else:
                internal_error = 1017
                context = {"success": True, "message": _(getMessage(
                    proxy_bpm_errors, internal_error)), "data": response_context, "internal_error": internal_error}
                logger.error(getLogMessage(proxy_bpm_errors, internal_error).format(
                    request.user.email), internal_error)
            return Response(context, status=response_status)
        except Exception as error:
            internal_error = 1018
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors, internal_error).format(
                request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# TODO: Permission implementation if this API is used in future.
class ProcessInstanceViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def destroy(self, request, tenant=None ,pk=None):
        try:
            req_body = {}
            req_body["process_instance_id"] = pk
            req_body["delete_reason"] = request.query_params["deleteReason"]
            response_context, response_status = call(
                module=process_engine.ProcessInstancesApi, func=process_engine.ProcessInstancesApi.delete_process_instance, data=req_body, request=request, type="delete", tenant_id=tenant)
            if response_status < 300:
                context = {"success": True, "message": _(
                    "Process Withdrawn Successfully."), "data": response_context}
                logger.info("Process Withdrawn Successfully.")
                return Response(context, status=status.HTTP_200_OK)
            else:
                internal_error = 1019
                context = {"success": True, "message": _(getMessage(
                    proxy_bpm_errors, internal_error)), "data": response_context, "internal_error": internal_error}
                logger.error(getMessage(proxy_bpm_errors,
                                        internal_error), internal_error)
            return Response(context, status=response_status)
        except Exception as error:
            internal_error = 1020
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors,
                                           internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BPMQueryViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]


    def create(self, request, tenant=None):
        user_email = request.user.email if hasattr(
            request.user, 'email') else "AnonymousUser"
        try:
            response_context, response_status = call(
                module=process_engine.QueryApi, func=process_engine.QueryApi.query_historic_process_instance, data=request.data, request=request, type="post", tenant_id = tenant)
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
                context = {"success": True, "message": _(
                    "Query in process instance List Retrieved Successfully."), "data": response_context}
                logger.info(
                    "{}, Query in process instance List Retrieved Successfully.".format(user_email))
            else:
                internal_error = 1021
                context = {"success": True, "message": _(getMessage(
                    proxy_bpm_errors, internal_error)), "data": response_context,  "internal_error": internal_error}
                logger.error(getLogMessage(proxy_bpm_errors, internal_error).format(
                    user_email), internal_error)
            return Response(context, status=response_status)
        except Exception as error:
            internal_error = 1022
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)),  "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors, internal_error).format(
                user_email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProcessInstanceVariablesViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]

    def retrieve(self, request, pk=None, tenant=None):
        user_email = request.user.email if hasattr(
            request.user, 'email') else "AnonymousUser"
        try:
            if "type" in request.query_params and request.query_params["type"] == "history":
                response_context, response_status = call(module=process_engine.HistoryProcessApi, func=process_engine.HistoryProcessApi.query_historic_process_instance, data={
                                                     "processInstanceId": pk, "includeProcessVariables" : True}, tenant_id=tenant, request=request, type="post", read_replica=True)
                response_context = response_context["data"][0]["variables"]
            else:
                response_context, response_status = call(module=process_engine.ProcessInstanceVariablesApi, func=process_engine.ProcessInstanceVariablesApi.list_process_instance_variables, data={
                                                     "process_instance_id": pk}, tenant_id=tenant, request=request, type="get", read_replica=True)
            if response_status < 300:
                if 'formKey' in self.request.query_params:
                    response_data = parse_flowable_content(
                        response_context, self.request.query_params['formKey'])
                else:
                    response_data = response_context

                context = {"success": True, "message": _(
                    "Historic Process Instance List Retrieved Successfully."), "data": response_data}
                logger.info("{}, Historic Process Instance List Retrieved Successfully for tenant: {}.".format(
                    user_email, tenant))
            else:
                response_data = response_context
                internal_error = 1023
                context = {"success": True, "message": _(getMessage(
                    proxy_bpm_errors, internal_error)), "data": response_data, "internal_error": internal_error}
                logger.error(getLogMessage(proxy_bpm_errors, internal_error).format(
                    user_email), internal_error)
            return Response(context, status=response_status)
        except Exception as error:
            internal_error = 1024
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors, internal_error).format(
                user_email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProcessInstanceDeleteViewset(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def delete(self, request, tenant=None, pi_id=None):
        try:
            req_body = {}
            req_body["process_instance_id"] = pi_id
            response_context, response_status = call(
                module=process_engine.HistoryProcessApi, func=process_engine.HistoryProcessApi.delete_historic_process_instance, data=req_body, request=request, type="delete", tenant_id=tenant)
            if response_status < 300:
                context = {"success": True, "message": _(
                    "Process deleted Successfully."), "data": response_context}
                logger.info("Process deleted Successfully.")
                return Response(context, status=status.HTTP_200_OK)
            else:
                internal_error = 1025
                context = {"success": True, "message": _(getMessage(
                    proxy_bpm_errors, internal_error)), "data": response_context, "internal_error": internal_error}
                logger.error(getMessage(proxy_bpm_errors,
                                        internal_error), internal_error)
            return Response(context, status=response_status)
        except Exception as error:
            internal_error = 1026
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getMessage(proxy_bpm_errors,
                                        internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TaskIdentityViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request, tenant=None, ti_id=None):
        try:

            response_context, response_status = call(module=process_engine.TaskIdentityLinksApi, func=process_engine.TaskIdentityLinksApi.list_tasks_instance_identity_links, data={
                                                     "task_id": ti_id}, request=request, type="get", tenant_id=tenant, read_replica=True)
            if response_status < 300:
                context = {"success": True, "message": _(
                    "Task identity Successfully."), "data": response_context}
                logger.info("{}, Task identity Successfully.".format(
                    request.user.email))
            else:
                internal_error = 1027
                context = {"success": True, "message": _(getMessage(
                    proxy_bpm_errors, internal_error)), "data": response_context, "internal_error": internal_error}
                logger.error(getLogMessage(proxy_bpm_errors, internal_error).format(
                    request.user.email), internal_error)
            return Response(context, status=response_status)
        except Exception as error:
            internal_error = 1028
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors, internal_error).format(
                request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TaskVariableUpdateViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def put(self, request, pi_id=None, tenant=None):
        try:
            task_id = request.data["task_id"]
            action_res = task_existance_check(request, task_id, tenant)
            if action_res.status_code == 200:
                if get_email(request) == "AnonymousUser":
                    flowable_data = request.data["data"]
                if action_res.json()['assignee'] == get_email(request):
                    logger.info("Task with Id: {} found Successfully for tenant: {}".format(task_id, tenant))
                    formkey = request.query_params['formKey']
                    actual_form_key, form_version = formkey.split("::")
                    form = OrganisationForm.objects.filter(key=actual_form_key, version=form_version, tenant=tenant).first().keytypepair
                    task_update_data = request.data
                    flowable_data = task_variable_update(request, task_update_data, get_key_type(form))
                response_context = call(module=process_engine.ProcessInstanceVariablesApi, func=process_engine.ProcessInstanceVariablesApi.create_or_update_process_variable, tenant_id=tenant,  data={
                                        "body": flowable_data, "process_instance_id": pi_id}, request=request, type="put")[0]
                context = {"success": True, "message": _("Task Variable Updated Successfully."), "data": response_context}
                logger.info("{}, Task Variable Updated Successfully for tenant: {}.".format(get_email(request), tenant))
                return Response(context, status=status.HTTP_200_OK)
            body = {}
            body['success'] = "false"
            body['message'] = "This task is already completed. You wont be able to save or complete it from here."
            body['error'] = action_res.json()['exception']
            return Response(body, action_res.status_code)
        except Exception as error:
            internal_error = 1029
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors, internal_error).format(
                get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EntityAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]

    def list(self, request, tenant=None):
        try:  # pylint: disable=too-many-nested-blocks
            query_start = 0
            query_size = 10
            if 'start' in request.query_params:
                query_start = request.query_params['start']
            if 'size' in request.query_params:
                query_size = request.query_params['size']
            query_params = {
                "start": query_start,
                "size": query_size,
                "process_instance_id": request.query_params['processInstanceId'],
                "activity_type": "userTask"
            }
            response_context, response_status = call(
                module=process_engine.HistoryApi, func=process_engine.HistoryApi.list_historic_activity_instances, data=query_params, request=request, type="get", tenant_id=tenant)
            res_data = response_context['data']
            if len(res_data) > 0:
                for data in res_data:
                    if data['assignee'] is None:
                        query_params = {
                            'task_id': data["taskId"]
                        }
                        try:
                            res = call(module=process_engine.TaskIdentityLinksApi,
                                       func=process_engine.TaskIdentityLinksApi.list_tasks_instance_identity_links, data=query_params, request=request, type='get',tenant_id=tenant)[0]
                            if len(res[0]) > 0 and 'group' in res[0]:
                                groupId = res[0]['group']
                                if groupId:
                                    regex = '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}$'
                                    if re.search(regex, groupId):
                                        group_name = OrganisationGroup.objects.get(
                                            id=groupId).name
                                    else:
                                        group_name = OrganisationGroup.objects.get(
                                            key=groupId).name
                                    data['assignee'] = group_name
                        except Exception as error:
                            internal_error = 1030
                            logger.error(getMessage(proxy_bpm_errors, internal_error).format(
                                error), internal_error)
            if response_status < 300:
                context = {"success": True, "message": _(
                    "Audit Log of Process instance retrieved successfully."), "data": response_context}
                logger.info("{}, Audit Log of Process instance retrieved successfully.".format(
                    request.user.email if hasattr(request.user, 'email') else "AnonymousUser"))
            else:
                internal_error = 1031
                context = {"success": True, "message": _(getMessage(
                    proxy_bpm_errors, internal_error)), "data": response_context, "internal_error": internal_error}
                logger.info(getLogMessage(proxy_bpm_errors, internal_error).format(
                    request.user.email if hasattr(request.user, 'email') else "AnonymousUser"), internal_error)
            return Response(context, status=response_status)
        except Exception as error:
            internal_error = 1032
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors, internal_error).format(
                request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OpenInitiationViewSet(viewsets.ReadOnlyModelViewSet):
    model = OrganisationForm
    permission_classes = [AllowAny]
    queryset = OrganisationForm.objects.all()
    serializer_class = OpenInitiationSerializer

    def retrieve(self, request, tenant=None, pk=None):
        logger.info(
            "Open Workflow requested to retrive Organisation form of id : {}".format(pk))
        try:
            try:
                try:
                    OrganisationWorkflow.objects.get(open_forms=pk)
                    obj = self.model.objects.get(id=pk)
                except:
                    OrganisationWorkflow.objects.filter(open_forms__key=pk)
                    obj = self.model.objects.filter(
                        key=pk).order_by('version').last()
            except Exception as error:
                internal_error = 1035
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(proxy_bpm_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(proxy_bpm_errors, internal_error).format(
                    pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj, context={"transactionId": Transaction.objects.create(
                tenant=Organisation.objects.get(id=tenant)).id, "request": request})
            context = {
                "success": True, "message": _("Organisation Form details retrieved successfully."), "data": serializer.data}
            logger.info(
                "Open Workflow - Organisation Form details retrieved successfully of id : {}".format(pk))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 1036
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors,
                                           internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, name='launch_open_forms', methods=["post"])
    def launch(self, request, tenant=None, pk=None):
        logger.info(
            "Open Workflow requested to launch process for Organisation form of id : {}".format(pk))
        try:
            try:
                try:
                    workflow = OrganisationWorkflow.objects.get(open_forms=pk)
                except:
                    form = self.model.objects.filter(
                        key=pk).order_by('version').last()
                    workflow = OrganisationWorkflow.objects.get(
                        open_forms=form)
            except Exception as error:
                internal_error = 1037
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(proxy_bpm_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(proxy_bpm_errors, internal_error).format(
                    pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            request.data["id"] = str(workflow.id)
            context = launch_process_util(request.data, tenant)
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 1038
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors,
                                           internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_email(request):
    if type(request) == dict:
        return "AnonymousUser"
    return request.user.email if hasattr(request.user, 'email') else "AnonymousUser"


class ProcessDetailViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    
    def post(self, request, tenant):
        try:
            group_cache = {}
            process_cache = {}
            data = request.data
            process_name = data.get("name", None)
            get_tasks_response = get_tasks_by_process_ids(process_name, tenant)
            for item in get_tasks_response:
                try:
                    if item["group"]:
                        if item["group"] not in group_cache:
                            group_cache[item["group"]] = OrganisationGroup.objects.get(key=item["group"], tenant=tenant).name
                        item["group"] = group_cache[item["group"]]
                except OrganisationGroup.DoesNotExist:
                    pass
                try:
                    if item["processKey"]:
                        if item["processKey"] not in process_cache:
                            process_cache[item["processKey"]] = OrganisationWorkflow.objects.get(process_key=item["processKey"], tenant=tenant).name
                        item["processKey"] = process_cache[item["processKey"]]
                except OrganisationWorkflow.DoesNotExist:
                    pass
            context = {"success": True, 'message': "Process Details Retrieved Successfully", "data": get_tasks_response}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 1002
            context = {'error': str(error), 'success': False, 'message': _(getMessage(
                proxy_bpm_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(proxy_bpm_errors, internal_error).format(
                request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)