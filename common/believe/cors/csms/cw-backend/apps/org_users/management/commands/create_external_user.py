import csv
from django.db import connection
from django.core.management.base import BaseCommand
from apps.organisations.models import Organisation
from apps.org_users.models import ExternalUser


class Command(BaseCommand):

    help="""External User Creation."""

    def add_arguments(self, parser):
        parser.add_argument('--org', type=str)
        parser.add_argument('--filepath', type=str)

    def handle(self, *args, **options):
        try:
            org = options['org']
            filepath = options['filepath']
            data=[]
            counter = 0
            with open(filepath, encoding="utf-8") as csvfile:
                csv_data_rows = csv.reader(csvfile)
                for csv_data_row in csv_data_rows:
                    data.append(csv_data_row)
            connection.set_tenant(Organisation.objects.get(schema_name="ezedox_" + org))
            for row_data in data:
                counter = counter + 1
                print("COUNTER " + str(counter) + " STARTED")
                try:
                    partnerId = str(row_data[0])
                    first_name = str(row_data[1])
                    last_name = str(row_data[2])
                    mobile = str(row_data[3])
                    if not first_name:
                        print("Error for counter - {} : First Name is empty for Partner id : {}".format(str(counter),partnerId))
                    else:
                        if not last_name:
                            last_name = " "
                        if mobile:
                            mobile = "+91" + mobile
                            email = "91"+ str(row_data[3]) + "@ezedox.com"
                            extra_fields = {"partnerId": partnerId}
                            try:
                                external_user_obj = ExternalUser.objects.create(first_name=first_name, last_name=last_name, mobile=mobile, email=email, extra_fields=extra_fields)
                                print("Success for counter - {} : External User Created Successfully for Partner Id : {}, External User Id: {}".format(counter,partnerId, str(external_user_obj.id)))
                            except Exception as e:
                                print("Error for counter - {} : Failed to create External User for Partner Id : {}, due to - {}".format(counter,partnerId,e))

                        else:
                            print("Error for counter - {} : Mobile Number is empty for Partner Id : {}".format(counter,partnerId))
                except Exception as e:
                    print("Error for counter - {} : Failed to create External User for Partner Id : {}, due to - {}".format(counter,partnerId,e))
            print("Completed............")
        except Exception as e:
            print("Error: Unexpected error occcured - {0}".format(e))