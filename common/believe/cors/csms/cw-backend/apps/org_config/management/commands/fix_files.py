from django.db import connection
from django.core.management.base import BaseCommand

import process_engine, requests
from apps.organisations.models import Organisation
from utils.process_engine_proxy import call

class Command(BaseCommand):

    help="""Generating Documents for Process."""

    def add_arguments(self, parser):
        parser.add_argument('--org', type=str)
        parser.add_argument('--process_variable', type=str)
        parser.add_argument('--server', type=str)
        parser.add_argument('--doc_template', type=str)
        parser.add_argument('--api_key', type=str)
        parser.add_argument('--v', type=str)
        parser.add_argument('--processInstanceId', type=str)

    def handle(self, *args, **options):
        try:
            org = Organisation.objects.get(schema_name="ezedox_" + options['org'])
            connection.set_tenant(org)
            if options.get("processInstanceId") is None:
                req_body = {
                    "size": 1000,
                    "includeProcessVariables": False,
                    "finished" : False,
                    "variables": [
                        {
                        "name": options["process_variable"],
                        "operation": "equals",
                        "value": {"success": False, "message": "Process Id not found"},
                        "type": "json",
                        "variableOperation": "EQUALS"
                        }
                    ],
                    "tenantId": options['org']
                }
                action = call(module = process_engine.QueryApi, func= process_engine.QueryApi.query_historic_process_instance, data= req_body, tenant_id = str(org.id), type="post")[0]
                print("Total Process : " + str(action["total"]))
                for item in action["data"]:
                    url = "https://" + options['org'] + "." + options['server'] + ".com/api/config/document/" + options['doc_template'] + "/template2?version=" + options['v']
                    payload = "{}"
                    headers = {
                    'X-Api-Key': options['api_key'],
                    'processInstanceId': item["id"],
                    'Content-Type': 'application/json'
                    }
                    response = requests.request("POST", url, headers=headers, data = payload)
                    print(item["id"] + " --- " + response.json()[0]["url"])
                    print(item["id"] + " --- ONGOING")
                    body_data = {"process_instance_id" : item["id"], "body" : [{"name" : options["process_variable"] , "value" : response.json(), "type" : "json"}]}
                    action_up = call(module = process_engine.ProcessInstanceVariablesApi, func= process_engine.ProcessInstanceVariablesApi.create_or_update_process_variable, data= body_data, tenant_id = str(org.id), type="put")
                    print(options["process_variable"] + " --- UPDATED")
            else:
                body_data = {"process_instance_id" : options["processInstanceId"], "variable_name" : options["process_variable"]}
                action_get, status_code = call(module = process_engine.ProcessInstanceVariablesApi, func= process_engine.ProcessInstanceVariablesApi.get_process_instance_variable, data= body_data, tenant_id = str(org.id), type="get")
                if status_code == 404:
                    print("Variable Not Found in " + options["processInstanceId"])
                else:
                    url = "https://" + options['org'] + "." + options['server'] + ".com/api/config/document/" + options['doc_template'] + "/template2?version=" + options['v']
                    payload = "{}"
                    headers = {
                    'X-Api-Key': options['api_key'],
                    'processInstanceId': options["processInstanceId"],
                    'Content-Type': 'application/json'
                    }
                    response = requests.request("POST", url, headers=headers, data = payload)
                    print(options["processInstanceId"] + " --- " + response.json()[0]["url"])
                    print(options["processInstanceId"] + " --- ONGOING")
                    body_data = {"process_instance_id" : options["processInstanceId"], "body" : [{"name" : options["process_variable"] , "value" : response.json(), "type" : "json"}]}
                    action_up = call(module = process_engine.ProcessInstanceVariablesApi, func= process_engine.ProcessInstanceVariablesApi.create_or_update_process_variable, data= body_data, tenant_id = str(org.id), type="put")
                    print(options["process_variable"] + " --- UPDATED")
        except Exception as e:
            print("Unexpected error occcured - {0}".format(e))