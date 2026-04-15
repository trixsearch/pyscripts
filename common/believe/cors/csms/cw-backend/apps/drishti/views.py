import json
import copy
import requests
from requests.auth import HTTPBasicAuth
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View

import process_engine
from ezedox.celery import app
from ezedox.settings import MEDIUM_PRIORITY_TASK, PROCESS_ENGINE_READ_REPLICA_URL, PROCESS_ENGINE_PASSWORD, PROCESS_ENGINE_USER
from apps.organisations.models import Organisation
from apps.org_users.models import OrganisationUser
from apps.org_apps.models import OrganisationWorkflow
from apps.proxy_bpm.views import TaskActionUpdateViewSet
from utils.process_engine_proxy import call
from utils.loggerwrapper import Logger

logger = Logger(__name__)

def exceptionHandle(error, log_id=None):
    context={}
    if hasattr(error, 'body'):
        if isinstance(error.body, bytes):
            response_data = json.loads(error.body.decode('utf-8'))
            context["exception_data"] = response_data["exception"]
    else:
        context["exception_data"] = str(error)
    logger.error("Failed due to: {}".format(context["exception_data"]), log_id)
    return context

class MyView(View):
    @method_decorator(login_required)
    def get(self, request, *args, **kwargs):
        logger.info("Requested for Drishti Home page.")
        try:
            tenant_list = []
            if request.user.tenant:
                tenant_list = Organisation.objects.filter(id=request.user.tenant.id).order_by('name')
            else:
                tenant_list = Organisation.objects.order_by('name')
            context = {
                'tenant_list': tenant_list
            }
            logger.info("Drishti Home page returned successfully.")
            return render(request, 'drishti/index.html', context)
        except Exception as error:
            context = exceptionHandle(error, 3001)
            return render(request, 'drishti/error.html',context)


class DeadLetterJobsView(View):
    @method_decorator(login_required)
    def get(self, request, *args, **kwargs):
        logger.info("Requested for Drishti DeadLetter Jobs page.")
        try:
            if "page_size" in request.GET:
                page_size = int(request.GET["page_size"])
            else:
                page_size = 10
            tenant_id = None
            if "tenant" in request.GET:
                tenant_id = request.GET["tenant"]
                url = PROCESS_ENGINE_READ_REPLICA_URL + "service/management/deadletter-jobs?tenantId=" + tenant_id
            elif "tenantId" in request.GET:
                tenant_id = str(Organisation.objects.get(id=request.GET["tenantId"]).id)
                url = PROCESS_ENGINE_READ_REPLICA_URL + "service/management/deadletter-jobs?tenantId=" + tenant_id
            elif request.user.tenant:
                tenant_id = str(request.user.tenant.id)
                url = PROCESS_ENGINE_READ_REPLICA_URL + "service/management/deadletter-jobs?tenantId=" + tenant_id
            else:
                url = PROCESS_ENGINE_READ_REPLICA_URL + "service/management/deadletter-jobs?sort=tenantId&order=asc"
            if "page" in request.GET:
                url = url + "&size=" + str(page_size) + "&start=" + str((int(request.GET["page"]) - 1)*page_size)
            else:
                url = url + "&size=" + str(page_size)

            data = requests.get(url, auth=HTTPBasicAuth(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), headers={"Content-Type" : "application/json"}, verify= False)
            res_data = data.json()["data"]

            for res in res_data:
                pid = res["processInstanceId"]
                if tenant_id:
                    pv_url = PROCESS_ENGINE_READ_REPLICA_URL + 'service/runtime/process-instances/' + pid + '/variables/entity_name?tenantId=' + tenant_id
                else:
                    pv_url = PROCESS_ENGINE_READ_REPLICA_URL + 'service/runtime/process-instances/' + pid + '/variables/entity_name'

                pv_data = requests.get(pv_url, auth=HTTPBasicAuth(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), headers={"Content-Type" : "application/json"}, verify= False)
                try:
                    res["entity_name"] = pv_data.json()["value"]
                except:
                    res["entity_name"] = ""
            
            page_url = request.get_raw_uri().split("?")[0]
            if "tenant" in request.GET:
                page_url = page_url + "?tenant=" + request.GET["tenant"] + "&page="
            elif "tenantId" in request.GET:
                page_url = page_url + "?tenantId=" + request.GET["tenantId"] + "&page="
            else:
                page_url = page_url + "?page="
            context = {
                'data' : res_data,
                'total' : data.json()["total"],
                "page_count" : range(1, int(data.json()["total"]/page_size) + 2),
                "page_size" : page_size,
                "page_url" : page_url,
            }
            logger.info("Drishti DeadLetter Jobs page returned successfully.")
            return render(request, 'drishti/deadletterJobs.html', context)
        except Exception as error:
            context = exceptionHandle(error, 3001)
            return render(request, 'drishti/error.html',context)

class Result(View):
    @method_decorator(login_required)
    def get(self, request, *args, **kwargs):
        try:
            req_body = {}
            stack_trace_data = None; app_diagram = None; deadletter_jobs_response=None; suspended_jobs_response=None; timer_jobs_response=None
            tasks_response=None; identity_links_response=None; activities_response=None; process_variables_response=None; variables_details_response=None
            search_variable = None; start_activity=None; start_variables=None; start_tasks=None; history_process_data= None; type_of_response=None; variables_data_response = None
            activitiesTab = False
            size = 1000
            start = 0
            if request.GET:
                processInstanceId = request.GET["process_id"]
                tenantId = request.GET["tenant"]
                request_type = request.GET["requested_data"]
                if "search_data" in request.GET:
                    search_variable = request.GET["search_data"]
                if "next_activities" in request.GET:
                    activitiesTab = True
                    start_activity = int(request.GET["start"])+10
                if "previous_activities" in request.GET:
                    activitiesTab = True
                    start_activity = int(request.GET["start"])-10
                if "next_variables" in request.GET:
                    start_variables = int(request.GET["start"])+10
                if "previous_variables" in request.GET:
                    start_variables = int(request.GET["start"])-10
                if "next_tasks" in request.GET:
                    start_tasks = int(request.GET["start"])+10
                if "previous_tasks" in request.GET:
                    start_tasks = int(request.GET["start"])-10
            else:
                processInstanceId = request.session["process_instance_id"]
                tenantId = request.session["tenant"]
                request_type = request.session["request_type"]
                if "stack_trace" in request.session:
                    stack_trace_data = request.session["stack_trace"]

            req_body["process_instance_id"] = processInstanceId
            tenant = Organisation.objects.filter(id=tenantId).first()
            tenant_name = tenant.name
            users_list = []
            logger.info("Requested for {} data of id: {} and tenant id: {}.".format(request_type, processInstanceId, tenantId))
            response = call (module= process_engine.HistoryProcessApi, func= process_engine.HistoryProcessApi.list_historic_process_instances, data= {"process_instance_id":processInstanceId, "include_process_variables":True}, tenant_id= tenantId, type="get", read_replica=True)
            if response[0]["data"]:
                type_of_response = response[0]["data"][0]["endTime"]
                variables_data_response = response[0]["data"][0]["variables"]
                history_process = copy.deepcopy(response)
                history_process[0]["data"][0]["variables"].clear()
                history_process_data = history_process[0]
            if request_type in ['all', 'jobs']:
                deadletter_jobs_response = call (module= process_engine.JobsApi, func= process_engine.JobsApi.list_dead_letter_jobs, data= req_body, tenant_id= tenantId, type="get", read_replica=True)[0]

                suspended_jobs_response = call (module= process_engine.JobsApi, func= process_engine.JobsApi.list_suspended_jobs, data= req_body, tenant_id= tenantId, type="get", read_replica=True)[0]

                timer_jobs_response = call (module= process_engine.JobsApi, func= process_engine.JobsApi.list_timer_jobs, data= req_body, tenant_id= tenantId, type="get", read_replica=True)[0]

            if request_type in ['all', 'tasks']:
                tasks_data={}
                tasks_data["process_instance_id"]=processInstanceId
                tasks_data["start"]=start_tasks or start
                tasks_data["size"]=size
                tasks_response = call (module= process_engine.HistoryTaskApi, func= process_engine.HistoryTaskApi.list_historic_task_instances, data= tasks_data, tenant_id= tenantId, type="get", read_replica=True)[0]

            if request_type in ['all', 'identity_links']:
                identity_links_response = call (module= process_engine.HistoryProcessApi, func= process_engine.HistoryProcessApi.list_historic_process_instance_identity_links, data= req_body, tenant_id= tenantId, type="get", read_replica=True)[0]

            if request_type in ['all', 'activities']:
                activity_data={}
                activity_data["process_instance_id"]=processInstanceId
                activity_data["start"]=start_activity or start
                activity_data["size"]=10
                activities_response = call (module= process_engine.HistoryApi, func= process_engine.HistoryApi.list_historic_activity_instances, data= activity_data, tenant_id= tenantId, type="get", read_replica=True)[0]
            if request_type in ['all', 'process_variables']:
                variables_data={}
                variables_data["process_instance_id"]=processInstanceId
                variables_data["start"]=start_variables or start
                variables_data["size"]=size
                variables_details_response = call (module= process_engine.HistoryApi, func= process_engine.HistoryApi.list_historic_details, data= variables_data, tenant_id= tenantId, type="get", read_replica=True)[0]
                if search_variable:
                    req_body["variable_name"]=search_variable
                    process_variables_response=[]
                    variables_response = call (module= process_engine.ProcessInstanceVariablesApi, func= process_engine.ProcessInstanceVariablesApi.get_process_instance_variable, data= req_body, tenant_id= tenantId, type="get", read_replica=True)[0]
                    process_variables_response.append(variables_response)
                else:
                    process_variables_response = variables_data_response

            context = {
                'response': history_process_data,
                'status':response[1],
                'deadletter_jobs_response':deadletter_jobs_response,
                'suspended_jobs_response':suspended_jobs_response,
                'timer_jobs_response':timer_jobs_response,
                'tasks_response':tasks_response,
                'identity_links_response':identity_links_response,
                'activities_response':activities_response,
                'process_variables_response': process_variables_response,
                'variables_details_response':variables_details_response,
                'process_instance_id':processInstanceId,
                'tenant_id':tenantId,
                'users_list':users_list,
                'stack_trace_data':stack_trace_data,
                'request_type':request_type,
                'search_data':search_variable,
                'type_of_response':type_of_response,
                'activitiesTab': activitiesTab,
                'tenant_name': tenant_name
            }
            logger.info("{} data of id: {} and tenant id: {} returned successfully.".format(request_type, processInstanceId, tenantId))
            return render(request, 'drishti/process_id_response.html',context)
        except Exception as error:
            context = exceptionHandle(error, 3002)
            return render(request, 'drishti/error.html',context)

class SearchResult(View):
    def get(self, request, *args, **kwargs):
        try:
            search_key = request.GET.get('search_key')
            search_value = request.GET.get('search_value')
            if not all([search_key, search_value]):
                return render(request, 'drishti/error.html',{"exception_data": "Values not passed correctly"} )

            tenantId = request.GET["tenant"]

            req_body = {}
            req_body['includeProcessVariables'] = True

            req_body_filter = {}
            req_body_filter["variables"] = []

            req_body_filter["variables"].append({"name": search_key,"operation":"likeIgnoreCase","variableOperation":"LIKE_IGNORE_CASE","value": search_value})

            req_body["variables"] = req_body_filter["variables"]
            req_body["size"] = 200
            response_data, status_code = call(module = process_engine.QueryApi, func = process_engine.QueryApi.query_historic_process_instance, data=req_body, tenant_id=tenantId, type="post", read_replica=True)
            data = []
            if status_code == 200:
                data = response_data.get('data')
            process_data = []
            requested_vars = ['entity_phone_number', 'entity_name', 'entity_email']
            for i in data:
                process = dict()
                variables = i['variables']
                process['id'] = i.get('id')
                process['url'] = "/cw/admin/drishti/result?tenant={}&process_id={}&requested_data=all".format(tenantId, i.get('id'))
                for var in variables:
                    if var['name'] in requested_vars:
                        process[var['name']] = var['value']
                process_data.append(process)
            context = {"data": process_data}
            return render(request, 'drishti/searchresult.html', context)
        except Exception as error:
            context = exceptionHandle(error, 3003)
            return render(request, 'drishti/error.html',context)


class SearchTaskResult(View):
    def get(self, request, *args, **kwargs):
        try:
            task_id = request.GET.get('task_id')
            if not task_id:
                return render(request, 'drishti/error.html',{"exception_data": "Task Id not passed correctly"} )
            tenantId = request.GET["tenant"]

            response_data, status_code = call(module=process_engine.TasksApi,func= process_engine.TasksApi.get_task, data={"task_id" : task_id}, tenant_id= tenantId, type="get")
            if status_code != 200:
                return render(request, 'drishti/error.html',{"exception_data": "Task not found"} )
            context = dict()
            pid = response_data.get('processInstanceId')
            context['task_id'] = response_data.get('id')
            context['assignee'] = response_data.get('assignee')
            context['name'] = response_data.get('name')
            context['processInstanceId'] = pid
            context['url'] = "/cw/admin/drishti/result?tenant={}&process_id={}&requested_data=all".format(tenantId, pid)
            return render(request, 'drishti/task-search-result.html', context)
        except Exception as error:
            context = exceptionHandle(error, 3004)
            return render(request, 'drishti/error.html',context)

class IdentityLinkResult(View):
    def get(self, request, *args, **kwargs):
        try:
            task_id = request.GET.get('task_id')
            if not task_id:
                return render(request, 'drishti/error.html',{"exception_data": "Task Id not passed correctly"} )
            tenantId = request.GET["tenant"]

            req_id = {}
            req_id["task_id"] = task_id
            TaskIdentityLinks = process_engine.TaskIdentityLinksApi
            list_tasks_instance_identity = TaskIdentityLinks.list_tasks_instance_identity_links
            response_data, status_code  = call(module = TaskIdentityLinks, func= list_tasks_instance_identity, data=req_id, tenant_id= tenantId, type="get", read_replica=True)

            if status_code != 200:
                return render(request, 'drishti/error.html',{"exception_data": "Task not found"} )
            context = dict()
            context['data'] = response_data
            return render(request, 'drishti/identity-link.html', context)
        except Exception as error:
            context = exceptionHandle(error, 3005)
            return render(request, 'drishti/error.html',context)

class DeadLetterJobs(View):
    @method_decorator(login_required)
    def post(self, request, data_type, process_id, tenant_id, job_id, *args, **kwargs):
        logger.info("Requested for Dead Letter Jobs of id: {} and tenant id: {}.".format(process_id, tenant_id))
        try:
            req_body={}
            req_body["job_id"] = job_id
            if isinstance(tenant_id, str):
                tenant_id = str(Organisation.objects.get(id=tenant_id).id)
            if request.POST["type"] == "move":
                stack_trace_response = call (module= process_engine.JobsApi, func= process_engine.JobsApi.execute_dead_letter_job_action,id=req_body, data={"action":"move"} , tenant_id= tenant_id, type="post")
                request.session['stack_trace'] = None
                logger.info("Dead Letter Jobs of id: {} and tenant id: {} moved successfully".format(process_id, tenant_id))
            else:
                stack_trace_response = call (module= process_engine.JobsApi, func= process_engine.JobsApi.get_dead_letter_job_stacktrace, data= req_body, tenant_id= tenant_id, type="get", read_replica=True)[0]
                request.session['stack_trace'] = stack_trace_response
                logger.info("Dead Letter Jobs of id: {} and tenant id: {} stack trace successfully displayed".format(process_id, tenant_id))
            request.session['process_instance_id'] = process_id
            request.session['tenant'] = tenant_id
            request.session['request_type'] = data_type
            return redirect('drishti:Result')
        except Exception as error:
            context = exceptionHandle(error, 3006)
            return render(request, 'drishti/error.html',context)

class SuspendedJobs(View):
    @method_decorator(login_required)
    def post(self, request, data_type, process_id, tenant_id, job_id, *args, **kwargs):
        logger.info("Requested for Suspended Jobs of id: {} and tenant id: {}.".format(process_id, tenant_id))
        try:
            req_body={}
            req_body["job_id"] = job_id
            stack_trace_response = call (module= process_engine.JobsApi, func= process_engine.JobsApi.get_suspended_job_stacktrace, data= req_body, tenant_id= tenant_id, type="get", read_replica=True)[0]
            request.session['stack_trace'] = stack_trace_response
            request.session['process_instance_id'] = process_id
            request.session['tenant'] = tenant_id
            request.session['request_type'] = data_type
            logger.info("Suspended Jobs of id: {} and tenant id: {} stack trace successfully displayed".format(process_id, tenant_id))
            return redirect('drishti:Result')
        except Exception as error:
            context = exceptionHandle(error, 3007)
            return render(request, 'drishti/error.html',context)

class TimerJobs(View):
    @method_decorator(login_required)
    def post(self, request, data_type, process_id, tenant_id, job_id, *args, **kwargs):
        logger.info("Requested for Timer Jobs of id: {} and tenant id: {}.".format(process_id, tenant_id))
        try:
            req_body={}
            req_body["job_id"] = job_id
            if request.POST["type"] == "move":
                stack_trace_response = call (module= process_engine.JobsApi, func= process_engine.JobsApi.execute_timer_job_action,id=req_body, data={"action":"move"} , tenant_id= tenant_id, type="post")
                request.session['stack_trace'] = None
                logger.info("Timer Jobs of id: {} and tenant id: {} moved successfully".format(process_id, tenant_id))
            else:
                stack_trace_response = call (module= process_engine.JobsApi, func= process_engine.JobsApi.get_timer_job_stacktrace, data= req_body, tenant_id= tenant_id, type="get", read_replica=True)[0]
                request.session['stack_trace'] = stack_trace_response
                logger.info("Timer Jobs of id: {} and tenant id: {} stack trace successfully displayed".format(process_id, tenant_id))
            request.session['process_instance_id'] = process_id
            request.session['tenant'] = tenant_id
            request.session['request_type'] = data_type
            return redirect('drishti:Result')
        except Exception as error:
            context = exceptionHandle(error, 3008)
            return render(request, 'drishti/error.html',context)

class TaskUpdate(View):
    @method_decorator(login_required)
    def post(self, request, data_type, process_id, tenant_id, task_id, *args, **kwargs):
        logger.info("Requested to update a task of id: {} and tenant id: {}.".format(process_id, tenant_id))
        try:
            req_data={}
            req_data["process_instance_id"] = process_id
            req_data["assignee"] = request.POST["Email"]
            req_data["tenant_id"] = tenant_id

            if request.POST["type"] == "Reassign":
                response = TaskActionUpdateViewSet.put(TaskActionUpdateViewSet, req_data, task_id)
            else:
                req_data = {}
                req_data["action"] = "claim"
                req_data["assignee"] = request.POST["Email"]
                response = call(module=process_engine.TasksApi,func= process_engine.TasksApi.execute_task_action, data={"task_id": task_id, "body": req_data}, tenant_id= tenant_id, type="put")

            request.session['process_instance_id'] = process_id
            request.session['tenant'] = tenant_id
            request.session['request_type'] = data_type
            logger.info("Task of id: {} and tenant id: {} {} successfully.".format(process_id, tenant_id, request.POST["type"]))
            return redirect('drishti:Result')
        except Exception as error:
            logger.info(error)
            context = exceptionHandle(error, 3009)
            return render(request, 'drishti/error.html',context)

class AddIdentityLink(View):
    @method_decorator(login_required)
    def post(self, request, data_type, process_id, tenant_id, *args, **kwargs):
        logger.info("Requested to add a user of id: {} and tenant id: {}.".format(process_id, tenant_id))
        try:
            req_id = {}
            req_id["process_instance_id"] = process_id
            req_body = {}
            req_body["user"]=request.POST["User"]
            req_body["type"]=request.POST["Type"]
            #can't pass group because "Only user identity links are supported on a process instance."
            identity_links_response = call (module= process_engine.ProcessInstanceIdentityLinksApi, func= process_engine.ProcessInstanceIdentityLinksApi.create_process_instance_identity_links, id=req_id, data= req_body, tenant_id= tenant_id, type="post")
            request.session['process_instance_id'] = process_id
            request.session['tenant'] = tenant_id
            request.session['request_type'] = data_type
            logger.info("User:{} of id: {} and tenant id: {} added successfully.".format(request.POST["User"], process_id, tenant_id))
            return redirect('drishti:Result')
        except Exception as error:
            context = exceptionHandle(error, 3010)
            return render(request, 'drishti/error.html',context)

class DeleteIdentityLink(View):
    def post (self, request, data_type, process_id, tenant_id, user, user_type, *args, **kwargs):
        logger.info("Requested to delete user:{} of id: {} and tenant id: {}.".format(user, process_id, tenant_id))
        try:
            req_body = {}
            req_body["process_instance_id"] = process_id
            req_body["identity_id"] = user
            req_body["type"] = user_type
            identity_links_response = call (module= process_engine.ProcessInstanceIdentityLinksApi, func= process_engine.ProcessInstanceIdentityLinksApi.delete_process_instance_identity_links, data= req_body, tenant_id= tenant_id, type="delete")
            request.session['process_instance_id'] = process_id
            request.session['tenant'] = tenant_id
            request.session['request_type'] = data_type
            logger.info("User:{} of id: {} and tenant id: {} is deleted successfully.".format(user, process_id, tenant_id))
            return redirect('drishti:Result')
        except Exception as error:
            context = exceptionHandle(error, 3011)
            return render(request, 'drishti/error.html',context)

class AddProcessVariables(View):
    @method_decorator(login_required)
    def post(self, request, data_type, process_id, tenant_id, *args, **kwargs):
        logger.info("Requested to add process variable of id: {} and tenant id: {}.".format(process_id, tenant_id))
        try:
            data=[]
            req_id = {}
            req_id["process_instance_id"] = process_id
            req_body = {}
            req_body["name"]=request.POST["Name"]
            req_body["type"]=request.POST["Type"]
            if request.POST["Type"] == "integer":
                req_body["value"]=int(request.POST["Value"])
            elif request.POST["Type"] in ["boolean", "json"]:
                req_body["value"]=json.loads(request.POST["Value"])
            else:
                req_body["value"]=request.POST["Value"]
            data.append(req_body)
            process_variables_response = call (module= process_engine.ProcessInstanceVariablesApi, func= process_engine.ProcessInstanceVariablesApi.create_process_instance_variable, id= req_id, data=data, tenant_id= tenant_id, tenant=None, type="post")
            if process_variables_response[1] == 201:
                logger.info("Process variable of id: {} and tenant id: {} added successfully.".format(process_id, tenant_id))
            else:
                context = exceptionHandle(process_variables_response[0], 3015)
                logger.info("Failed to Create Process variable of id: {} and tenant id: {}.".format(process_id, tenant_id))
                return render(request, 'drishti/error.html',context)
            request.session['process_instance_id'] = process_id
            request.session['tenant'] = tenant_id
            request.session['request_type'] = data_type
            return redirect('drishti:Result')
        except Exception as error:
            context = exceptionHandle(error, 3012)
            return render(request, 'drishti/error.html',context)

class UpadateProcessVariables(View):
    def post (self, request, data_type, process_id, tenant_id, variable_name, *args, **kwargs):
        logger.info("Requested to update variable {} of id: {} and tenant id: {}.".format(variable_name, process_id, tenant_id))
        try:
            data={}
            req_body = {}
            req_body["process_instance_id"] = process_id
            req_body["variable_name"] = variable_name
            data["name"]=variable_name
            data["type"]=request.POST["Type"]
            if request.POST["Type"] == "integer":
                data["value"]=int(request.POST["Value"])
            elif request.POST["Type"] == ["boolean", "json"]:
                data["value"]=json.loads(request.POST["Value"])
            else:
                data["value"]=request.POST["Value"]
            req_body["body"]=data

            process_variables_response = call (module= process_engine.ProcessInstanceVariablesApi, func= process_engine.ProcessInstanceVariablesApi.update_process_instance_variable, data=req_body, tenant=None, tenant_id= tenant_id, type="put")
            request.session['process_instance_id'] = process_id
            request.session['tenant'] = tenant_id
            request.session['request_type'] = data_type
            logger.info("Variable {} of id: {} and tenant id: {} is updated successfully.".format(variable_name, process_id, tenant_id))
            return redirect('drishti:Result')
        except Exception as error:
            context = exceptionHandle(error, 3013)
            return render(request, 'drishti/error.html',context)

class DeleteProcessVariables(View):
    def post (self, request, data_type, process_id, tenant_id, variable_name, *args, **kwargs):
        logger.info("Requested to delete variable {} of id: {} and tenant id: {}.".format(variable_name, process_id, tenant_id))
        try:
            req_body = {}
            req_body["process_instance_id"] = process_id
            req_body["variable_name"] = variable_name
            process_variables_response = call (module= process_engine.ProcessInstanceVariablesApi, func= process_engine.ProcessInstanceVariablesApi.delete_process_instance_variable, data= req_body, tenant_id= tenant_id, type="delete")
            request.session['process_instance_id'] = process_id
            request.session['tenant'] = tenant_id
            request.session['request_type'] = data_type
            logger.info("Variable {} of id: {} and tenant id: {} is successfully deleted.".format(variable_name, process_id, tenant_id))
            return redirect('drishti:Result')
        except Exception as error:
            context = exceptionHandle(error, 3014)
            return render(request, 'drishti/error.html',context)

class AddBulkProcessVariables(View):
    @method_decorator(login_required)
    def post(self, request, data_type, process_id, tenant_id, *args, **kwargs):
        logger.info("Requested to add process variable of id: {} and tenant id: {}.".format(process_id, tenant_id))
        try:
            data=[]
            req_id = {}
            req_id["process_instance_id"] = process_id
            body_data = request.POST["body"]
            try:
                req_data = json.loads(body_data)
            except Exception as error:
                context = exceptionHandle(error, 3016)
                return render(request, 'drishti/error.html',context)
            for variable_data in req_data:
                req_body = {}
                req_body["name"]=variable_data['name']
                req_body["type"]=variable_data['type']
                req_body["value"]=variable_data['value']
                data.append(req_body)
            if request.POST['action'] == 'add':
                process_variables_response = call (module= process_engine.ProcessInstanceVariablesApi, func= process_engine.ProcessInstanceVariablesApi.create_process_instance_variable, id= req_id, data=data, tenant_id= tenant_id, tenant=None, type="post")
                if process_variables_response[1] == 201:
                    logger.info("Process variable of id: {} and tenant id: {} added successfully.".format(process_id, tenant_id))
                else:
                    context = exceptionHandle(process_variables_response[0], 3017)
                    logger.info("Failed to Create Process variable of id: {} and tenant id: {}.".format(process_id, tenant_id))
                    return render(request, 'drishti/error.html',context)
            else:
                process_variables_response = call (module= process_engine.ProcessInstanceVariablesApi, func= process_engine.ProcessInstanceVariablesApi.create_or_update_process_variable, data={"body" : data, "process_instance_id" : process_id}, tenant=None, tenant_id= tenant_id, type="put")
                if process_variables_response[1] == 201:
                    logger.info("Process variable of id: {} and tenant id: {} updated successfully.".format(process_id, tenant_id))
                else:
                    context = exceptionHandle(process_variables_response[0], 3018)
                    logger.info("Failed to update Process variable of id: {} and tenant id: {}.".format(process_id, tenant_id))
                    return render(request, 'drishti/error.html',context)
            request.session['process_instance_id'] = process_id
            request.session['tenant'] = tenant_id
            request.session['request_type'] = data_type
            return redirect('drishti:Result')
        except Exception as error:
            context = exceptionHandle(error, 3019)
            return render(request, 'drishti/error.html',context)

class MoveAllDeadLetterJobs(View):
    @method_decorator(login_required)
    def post(self, request, *args, **kwargs):
        tenant_id = request.tenant.id
        move_all_deadletter_jobs.apply_async(args=[tenant_id], priority=MEDIUM_PRIORITY_TASK)
        request.session['tenant'] = tenant_id
        request.session['request_type'] = "jobs"
        return redirect('drishti:deadletterJobs')

@app.task(bind=True, name='move_all_deadletter_jobs')
def move_all_deadletter_jobs(self, tenant_id):
    logger.info("Requested to move all Dead Letter Jobs of tenant id: {}.".format(tenant_id))
    try:
        req_body={"size" : 10000}
        deadletter_jobs_response = call (module= process_engine.JobsApi, func= process_engine.JobsApi.list_dead_letter_jobs, data= req_body, tenant_id= tenant_id, type="get")[0]
        for item in deadletter_jobs_response["data"]:
            try:
                req_body={}
                req_body["job_id"] = item["id"]
                tenant = Organisation.objects.get(id=tenant_id)
                call(module= process_engine.JobsApi, func= process_engine.JobsApi.execute_dead_letter_job_action,id=req_body, data={"action":"move"}, tenant_id= tenant_id, tenant=tenant, type="post")
            except Exception as error:
                logger.exception(error)
    except Exception as error:
        logger.exception(error)