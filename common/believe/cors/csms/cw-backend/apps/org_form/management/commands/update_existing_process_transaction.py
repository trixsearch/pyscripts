import requests
from django.core.management.base import BaseCommand
from django.db import connection
from utils.utils import get_tenant_model
from apps.org_form.models import OrganisationFile, Transaction


class Command(BaseCommand):
    help="Creating transaction for updating existing process transaction"

    def add_arguments(self, parser):
        parser.add_argument('--user', type=str, help="--user=foo")
        parser.add_argument('--password', type=str, help="--password=bar")
        parser.add_argument('--processurl', type=str, help="--processurl=http://example.com/rest")


    def handle(self, *args, **options):
        PROCESS_USER = "admin"
        PROCESS_USER_PASSWORD = "test"
        PROCESS_URL = "http://localhost:9002/rest"

        user = options['user']
        password = options['password']
        processurl = options['processurl']

        if user:
            PROCESS_USER = user
        if password:
            PROCESS_USER_PASSWORD = password
        if processurl:
            PROCESS_URL = processurl

        try:
            connection.set_schema_to_public()
            for i in get_tenant_model().objects.all():
                if i.schema_name != 'public':
                    connection.set_tenant(i)
                    try:
                        #FOR CREATING TRANSACTION ID FROM
                        name = i.schema_name.split('_')[-1]
                        url = PROCESS_URL + "/service/history/historic-process-instances?tenantId=" + str(name)                    
                        req_body = {}
                        req_body["size"] = 15000
                        action = requests.get(url, auth=(PROCESS_USER, PROCESS_USER_PASSWORD), params=req_body)
                        total_process = action.json()['total']
                        if total_process > 0:
                            print('----------------UPDATING {} TRANSACTION ID FOR TENANT - {}------------------'.format(str(total_process), i.domain_url))
                            process_data = action.json()['data']
                            all_process_id = []
                            for process in process_data:
                                all_process_id.append(str(process['id']))

                            for process_id in all_process_id:
                                transaction_query = Transaction.objects.filter(process_instance_id = process_id)
                                if not transaction_query.exists():
                                    transaction_obj = Transaction.objects.create(process_instance_id = process_id)
                                    if transaction_obj:
                                        print(' Tid {}  <------->  Pid {} in {} created.'.format(str(transaction_obj.id), process_id, str(i.domain_url)))
                                    else:
                                        print('\n\n#### CREATING TRANSACTION ID FOR PROCESS INSTANCE ID {} IN TENANT {} FAILED ####\n\n'.format(process_id, str(i.domain_url)))
                                # else:
                                #     print('Process instance id {} already exist in {}.'.format(process_id, str(i.domain_url)))
                        else:
                            print('NO PROCESS FOUND FOR TENANT - {}'.format(i.domain_url))
                    except Exception as error:
                        print('\n\n#### TRANSACTION ID CREATION IN TENANT {} FAILED ####'.format(str(i.domain_url)))
                        print(str(error))

                    #FOR UPDATING FILES WITH TRANSACTION ID NULL
                    files = OrganisationFile.objects.filter(transaction_id__isnull = True)
                    print('\n')
                    if files.exists():
                        print('-------------------Updating {} files for {}----------------'.format(files.count() ,str(i.domain_url)))
                        for file in files:
                            print('Updating file {}.'.format(str(file)))
                            try:
                                transaction_query_file = Transaction.objects.filter(process_instance_id = file.process_instance_id)
                                if transaction_query_file.exists():
                                    transaction_obj = transaction_query_file.first()
                                    file.transaction_id = transaction_obj
                                    file.save()
                            except Exception as error:
                                print('Error occured in updating file {} because of {}\n\n'.format(str(file), str(error)))
                    else:
                        print('NO FILE NEEDS TO UPDATE FOR {} \n\n'.format(str(i.domain_url)))

                    print('\n\n')
        except Exception as e:
            print("Unexpected error occcured - {0}".format(e))
