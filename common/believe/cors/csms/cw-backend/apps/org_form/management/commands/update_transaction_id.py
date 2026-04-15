import json
import requests

from django.core.management.base import BaseCommand, CommandError
from django.db import connection

from apps.org_form.models import Transaction
from apps.organisations.models import Organisation

from utils.constants import QUERY_IN_HISTORY_PROCESS_INSTANCE, HISTORY_PROCESS_INSTANCES_BASE_ENDPOINT, QUERY_IN_HISTORY_PROCESS_INSTANCE

from ezedox.settings import PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD, PROCESS_ENGINE_URL

def get_all_process_list(total, SIZE, TENANT_ID, GET_URL):
    """
        To return a list of all the process instance id
        rtype: List
    """
    print("Retrieving all the processInstanceId")
    process_list = []
    for i in range(0,total, SIZE):
        params = {
        "tenantId":TENANT_ID,
        "size":SIZE,
        "start":i
        }
        response = requests.get(GET_URL, auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), params=params)
        res = response.json()
        for data in res['data']:
            process_list.append(data['id'])
    process_list=list(dict.fromkeys(process_list))
    print("Retrieved all the processInstanceId")
    return process_list

def set_transaction_id(total,batch, TENANT_ID, post_url, all_process_list):
    """
        To get process instances in batches and mapping the transaction ids to procecss instance ids. 
        rtype: None
    """

    #creating a empty keyValue from variables for data consistancy
    # empty_variable = {}
    count = 0
    for index in range(0,total,batch):
        data = {
            "tenantId": TENANT_ID,
            "size": batch,
            "processInstanceIds": all_process_list[index: index+batch],
            "includeProcessVariables": True,
            "sort":"startTime",
            "order":"desc"
        }
        headers = {'Content-type': 'application/json'}
        var_response = requests.post(post_url,data= json.dumps(data), auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), headers=headers)
        var_res = var_response.json()
        process_instances = var_res['data']
        for process_instance in process_instances:
            pid = process_instance['id']
            variables = process_instance['variables']
            for variable in variables:
                if variable['name'] == "transaction_id":
                    tid = variable['value']
                    try:
                        obj = Transaction.objects.get(id=tid)
                        if obj.process_instance_id is None:
                            obj.process_instance_id = pid
                            obj.save()
                            print("Transaction Id {} mapped with Process Instance id {}".format(tid, pid))
                    except Exception as error:
                        print(error)
                    break
        count += 1
        print("-------------------- Batch {} Checked".format(count))


class Command(BaseCommand):
    help=   """
                Updating transaction id with its process instance id 
                Usage : python manage.py update_transaction_id --tenantId=<tenant_name> --processKey=<processKey of a workflow>
            """

    help_for_tenant = "--tenantId=<tenant_name>"

    help_for_processKey = "--processKey=<process key of an app>"

    def add_arguments(self, parser):
        parser.add_argument('--tenantId', type=str, help=self.help_for_tenant)
        parser.add_argument('--processKey', type=str, help=self.help_for_processKey)

    def handle(self, *args, **options):
        if options['tenantId'] == None:
            raise CommandError("Option `--tenantId=<tenant_name>` must be specified.")
        if options['processKey'] == None:
            raise CommandError("Option `--processKey=<process key of an app> must be specified`")
        try:
            tenantId = options['tenantId']
            processKey = options['processKey']
            schema_name = 'ezedox_' + tenantId
            tenant = Organisation.objects.get(schema_name=schema_name)
            connection.set_tenant(tenant)
            url = PROCESS_ENGINE_URL + QUERY_IN_HISTORY_PROCESS_INSTANCE
            get_url = PROCESS_ENGINE_URL + HISTORY_PROCESS_INSTANCES_BASE_ENDPOINT
            post_url = PROCESS_ENGINE_URL + QUERY_IN_HISTORY_PROCESS_INSTANCE
            BATCH_SIZE=100
            req_body = {}
            req_body['finished'] = False
            req_body['deleted'] = False
            req_body['tenantId'] = tenantId
            req_body['processDefinitionKey'] = processKey
            print("Fetching the total no. of ongoing process")

            # Fetching the total no. of ongoing process instances
            response = requests.post(url, auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), data = json.dumps(req_body), headers={"Content-Type" : "application/json"})
            if response.status_code == 200:
                response_body = response.json()
                total_process_instances = response_body['total']
                print("Total no. of Processes {}".format(total_process_instances))
                process_list = get_all_process_list(total_process_instances, BATCH_SIZE, tenantId, get_url)
                set_transaction_id(total_process_instances, BATCH_SIZE, tenantId, post_url, process_list)
            else:
                print("Proxy call failed with status code {}".format(response.status_code))
        except Exception as error:
            print("Unexpected error occured {}".format(error))
