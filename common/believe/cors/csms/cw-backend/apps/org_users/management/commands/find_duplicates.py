from django.db import connection
from django.db.models import Count
from apps.org_users.models import ExternalUser 
from apps.organisations.models import Organisation
from django.core.management.base import BaseCommand


class Command(BaseCommand):

    def add_arguments(self, parser):
        parser.add_argument('--org', type=str)

    def handle(self, *args, **options):
        try:
            connection.set_tenant(Organisation.objects.get(schema_name="ezedox_" + options["org"]))
            query_set = ExternalUser.objects.all().values('extra_fields__partnerId').annotate(Count('extra_fields__partnerId')).order_by('extra_fields__partnerId__count').filter(extra_fields__partnerId__count__gt=1)
            for item in query_set:
                if item["extra_fields__partnerId"] is None:
                    print("None : " + str(item["extra_fields__partnerId__count"]))
                else:
                    print(item["extra_fields__partnerId"] + " : " + str(item["extra_fields__partnerId__count"]))
            print("Script Ran Successfully")
        except Exception as e:
            print("Failed {}".format(str(e)))