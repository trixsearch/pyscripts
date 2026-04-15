from django.db import connection
from django.core.management.base import BaseCommand
from apps.organisations.models import Organisation
from apps.org_users.models import ExternalUser
from apps.org_apps.utils import xls_data


class Command(BaseCommand):

    help="""Updating Partner Id in External User."""

    def add_arguments(self, parser):
        parser.add_argument('--org', type=str)
        parser.add_argument('--filepath', type=str)

    def handle(self, *args, **options):
        try:
            org = options['org']
            filepath = options['filepath']
            data = xls_data(filepath)
            connection.set_tenant(Organisation.objects.get(schema_name="ezedox_" + org))
            for row_data in data:
                try:
                    partnerId = str(row_data[0])
                    entity_phone_number = str(row_data[1])
                    search_entity_phone_number = "+91" + entity_phone_number
                    external_user_obj = ExternalUser.objects.filter(mobile = search_entity_phone_number)
                    if external_user_obj.count() == 0:
                        print("Error: no external user exist with mobile number: {}".format(entity_phone_number))
                    elif external_user_obj.count() > 1:
                        print("Error: more then one external user exists with this mobile number: : {}".format(entity_phone_number))
                        for user in external_user_obj:
                            print("User: {} {}".format(user.first_name, user.last_name))
                    else:
                        obj = external_user_obj[0]
                        extra_data = {}
                        extra_data["partnerId"] = partnerId
                        obj.extra_fields = extra_data
                        obj.save()
                        print("Success: External user with mobile number: {}, Successfully updated with partner id: {}".format(entity_phone_number, partnerId))
                except Exception as e:
                    print("Unexpected error occcured for {0} - {1}".format(entity_phone_number,e))
            print("Completed............")
        except Exception as e:
            print("Unexpected error occcured - {0}".format(e))