from django.db import connection
from apps.org_config.models import ReportTemplate
from django.core.management.base import BaseCommand
from utils.utils import get_tenant_model


class Command(BaseCommand):

    def handle(self, *args, **options):
        try:
            connection.set_schema_to_public()
            for i in get_tenant_model().objects.all():
                if i.schema_name != 'public':
                    connection.set_tenant(i)
                    reports = ReportTemplate.objects.all()
                    try:
                        for report in reports:
                            print('for {}'.format(str(i)))
                            prompt = report.prompt_variable
                            for query in report.query['query']:
                                try:
                                    query['prompt'] = prompt
                                except Exception as e:
                                    print("Failed {}".format(str(e)))
                            report.save()
                    except Exception as e:
                            print("Failed {}".format(str(e)))
        except Exception as e:
            print("Failed {}".format(str(e)))
        
        print("Done.......\n")
