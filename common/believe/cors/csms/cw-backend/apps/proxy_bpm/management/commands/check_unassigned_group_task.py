import requests
import json

from django.core.management.base import BaseCommand, CommandError

import process_engine

from utils.process_engine_proxy import call

class Command(BaseCommand):
    help="To find process Instance Id with group task performed by null"

    def add_arguments(self, parser):
        parser.add_argument('--tenant_name', type=str)
        parser.add_argument('--group_id', type=str)

    def handle(self, *args, **options):
        try:
            if options['tenant_name'] == None:
                raise CommandError(
                    "Option `--tenant_name=<tenant_name>` must be specified.")
            if options['group_id'] == None:
                raise CommandError(
                    "Option `--group_id=<group_id>` must be specified.")
            
            try:
                req_body = {}
                req_body['taskAssignee'] = None
                req_body["finished"] = True
                req_body["tenantId"] = options['tenant_name']
                processVariable = {}
                processVariable["name"] = "ob_executive"
                processVariable["value"] = ""
                processVariable["operation"] = "equals"
                processVariable["variableOperation"] = "EQUALS"
                req_body["taskCandidateGroup"] = options['group_id']
                req_body["processVariables"] = processVariable
                response_data, response_status =  call(module=process_engine.HistoryTaskApi,func= process_engine.HistoryTaskApi.query_historic_task_instance, data=json.dumps(req_body), type="post")
                tasks_instances = response_data["data"]
                if response_data['size'] > 0:
                    for task in tasks_instances:
                        print("{} - {}".format(task['id'], task['name']))
            except Exception:
                pass
        except Exception as err:
            print("Unexpected error occcured - {0}".format(err))