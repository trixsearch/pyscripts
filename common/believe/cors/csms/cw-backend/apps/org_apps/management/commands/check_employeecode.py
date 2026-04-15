import json
import requests
import xlsxwriter
from utils.process_engine_proxy import call
import process_engine

from django.core.management.base import BaseCommand
from ezedox.settings import PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD, PROCESS_ENGINE_URL
from utils.constants import QUERY_IN_HISTORY_PROCESS_INSTANCE
from apps.organisations.models import Organisation
from django.db import connection

class Command(BaseCommand):
    help=   """ Check employeecode """

    def add_arguments(self, parser):
        parser.add_argument('--tenantId', type=str)
        parser.add_argument('--processKey', type=str)
    
    def handle(self, *args, **options):
        try:
            tenantId = options['tenantId']
            processKey = options['processKey']
            schema_name = 'ezedox_' + tenantId
            tenant = Organisation.objects.get(schema_name=schema_name)
            connection.set_tenant(tenant)
            
            path = tenantId + "_" + processKey + ".xlsx"
            workbook = xlsxwriter.Workbook(path)
            worksheet = workbook.add_worksheet("Sheet 1")
            worksheet.write(0, 0, "Process Id")
            worksheet.write(0, 1, "employeeCode")
            worksheet.write(0, 2, "epCode")

            request_body = {
                "tenantId": tenantId,
                "size": 1000,
                "includeProcessVariables": False,
                "finished" : True,
                "processDefinitionKey" : processKey,
                "finishedAfter": "2021-04-01T05:30:00.000Z",
                "deleted" : False,
                # "variables" : [
                #     {
                #         "name" : "category",
                #         "operation" : "equals",
                #         "value" : "EP",
                #         "variableOperation" : "EQUALS"
                #     }
                # ]
            }
            headers = {'Content-type': 'application/json'}
            url = PROCESS_ENGINE_URL + QUERY_IN_HISTORY_PROCESS_INSTANCE
            var_response = requests.post(url,data= json.dumps(request_body), auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), headers=headers)
            process_list = []
            for item in var_response.json()["data"]:
                process_list.append(item["id"])
            row = 1
            while len(process_list) > 0:
                req_body = {"processInstanceIds" : process_list[:50], "includeProcessVariables": True, "size": 50}
                action_data2 = call(module = process_engine.HistoryProcessApi, tenant_id=Organisation.objects.get(schema_name=schema_name).id, func = process_engine.HistoryProcessApi.query_historic_process_instance, data=req_body, type="post")[0]["data"]
                for items in action_data2:
                    temp_varaiable = items.get('variables')
                    var_list = {}
                    for item_var in temp_varaiable:
                        var_list[item_var["name"]] = item_var["value"]
                    worksheet.write(row, 0, items["id"])
                    worksheet.write(row, 1, var_list.get("employeeCode","-"))
                    worksheet.write(row, 2, var_list.get("epCode", "-"))
                    if "epCode" in var_list and "employeeCode" in var_list and var_list["employeeCode"] != var_list["epCode"]:
                        worksheet.write(row, 3, "NOT EQUAL")
                    row = row + 1
                process_list = process_list[50:]
            workbook.close()
            print("Action Successful. Excel at : " + path)
        except Exception as error:
            print("Unexpected error occured {}".format(error))