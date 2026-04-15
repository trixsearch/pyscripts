import csv, xlsxwriter
from django.db import connection
from django.db.models import Count
from apps.org_users.models import ExternalUser 
from apps.organisations.models import Organisation
from django.core.management.base import BaseCommand
from apps.org_inventory.models import OrganisationAssetDistribution

class Command(BaseCommand):

    def add_arguments(self, parser):
        parser.add_argument('--org', type=str)
        parser.add_argument('--filepath', type=str)

    def handle(self, *args, **options):
        try:
            workbook = xlsxwriter.Workbook("UserDistributionDump.xlsx")
            worksheet = workbook.add_worksheet()
            worksheet.write_row('A1', ["Mobile", "External User UUID ", "Partner Id", "Number of distribution"])
            data_row = 1
            filepath = options['filepath']
            connection.set_tenant(Organisation.objects.get(schema_name="ezedox_" + options["org"]))
            with open(filepath) as csv_file:
                csv_reader = csv.reader(csv_file)
                for row in csv_reader:
                    query_set = ExternalUser.objects.filter(mobile="+91" + str(row[0]))
                    for item in query_set:
                        asset_distribution = OrganisationAssetDistribution.objects.filter(distribution__allottee=item).count()
                        worksheet.write_row(data_row, 0, [row[0], str(item.id), item.extra_fields.get("partnerId",""), str(asset_distribution)])
                        data_row = data_row + 1
            workbook.close()
            print("Script Ran Successfully. Output at : UserDistributionDump.xlsx")
        except Exception as e:
            print("Failed {}".format(str(e)))