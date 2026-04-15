from django.db import connection
from django.core.management.base import BaseCommand

import process_engine
from apps.organisations.models import Organisation
from utils.process_engine_proxy import call
#Example Command
#python manage.py update_variable_ongoing --variable_to=dlUrl --variable_from=drivingLicense --process_key=onboarding --org=bb

class Command(BaseCommand):

    help="""Moving one variable to another in ongoing process."""

    def add_arguments(self, parser):
        parser.add_argument('--variable_to', type=str)
        parser.add_argument('--variable_from', type=str)
        parser.add_argument('--process_key', type=str)
        parser.add_argument('--org', type=str)

    def handle(self, *args, **options):
        try:
            variable_to = options['variable_to']
            variable_from = options['variable_from']
            process_key = options['process_key']
            org = options['org']
            org_obj = Organisation.objects.get(schema_name="ezedox_" + org)
            connection.set_tenant(org_obj)

            req_body = {
                "process_definition_key" : process_key,
                'tenant_id' : org,
                "size" : 10000,
                "include_process_variables" : False
                }
            action_data = call(module = process_engine.ProcessInstancesApi, tenant_id=org_obj.id, func = process_engine.ProcessInstancesApi.list_process_instances, data=req_body, type="get")[0]
            process_ids = []
            for item in action_data["data"]:
                request_body = {"process_instance_id": item["id"], "variable_name" : variable_from}
                get_api_data, get_api_status = call(module = process_engine.ProcessInstanceVariablesApi, tenant_id=org_obj.id, func = process_engine.ProcessInstanceVariablesApi.get_process_instance_variable, data=request_body, type="get")
                if get_api_status == 200:
                    request_body = [{"name" : variable_to, "value" : get_api_data["value"], "type" : "json"}]
                    create_var_call, status = call(module = process_engine.ProcessInstanceVariablesApi, id={"process_instance_id": item["id"]}, tenant_id=org_obj.id, tenant=None, func = process_engine.ProcessInstanceVariablesApi.create_or_update_process_variable, data=request_body, type="post")
                    request_body = {"process_instance_id": item["id"], "variable_name" : variable_from}
                    delete_var_call, status = call(module = process_engine.ProcessInstanceVariablesApi, tenant_id=org_obj.id, func = process_engine.ProcessInstanceVariablesApi.delete_process_instance_variable, data=request_body, type="delete")
                    print("Operation successful for process : " + item["id"])
                else:
                    print("No operation needed for process : " + item["id"])
            print("Operation Successfully Completed.")
        except Exception as e:
            print("Unexpected error occcured - {0}".format(e))