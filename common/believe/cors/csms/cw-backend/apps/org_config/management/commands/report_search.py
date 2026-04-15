from django.db import connection
from apps.org_config.models import ReportTemplate
from django.core.management.base import BaseCommand
from utils.utils import get_tenant_model


class Command(BaseCommand):

    def add_arguments(self, parser):
        parser.add_argument('--type', type=str)

    def handle(self, *args, **options):
        try:
            connection.set_schema_to_public()
            for i in get_tenant_model().objects.all():
                if i.schema_name != 'public':
                    connection.set_tenant(i)
                    reports = ReportTemplate.objects.all()
                    try:
                        print('\nFor {}'.format(str(i)))
                        totalReport = 0
                        for report in reports:
                            reportCount = 0
                            searchResult = False
                            if report.report_on == "PROCESS":
                                if(len(report.query['query'])):
                                    for query in report.query['query']:
                                        try:
                                            if options["type"] == "comparision":
                                                if query["comparision"] == "NOT_EQUALS_IGNORE_CASE":
                                                    reportCount +=1
                                                    searchResult = True
                                            elif options["type"] == "attribute":
                                                if query["attribute"] == "" or query["attribute"] == "Select Attribute":
                                                    reportCount +=1
                                                    searchResult = True
                                        except Exception as e:
                                            print("Failed {}".format(str(e)))
                                elif options["type"] == "attribute":
                                    searchResult = True
                            if searchResult: 
                                totalReport +=1
                                print("Report name: %s Total Query: %d "%(report.name, reportCount))
                        print("Total Reports: %d "%(totalReport))
                    except Exception as e:
                            print("Failed {}".format(str(e)))
        except Exception as e:
            print("Failed {}".format(str(e)))
        
        print("Done.......\n")