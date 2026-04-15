from django.db import connection
from django.core.management.base import BaseCommand
from tenant_schemas.utils import get_tenant_model

import process_engine

from utils.process_engine_proxy import call
from apps.org_apps.models import OrganisationWorkflow

class Command(BaseCommand):
    def handle(self, *args, **options):
        try:
            connection.set_schema_to_public()
            for i in get_tenant_model().objects.all():
                if i.schema_name != 'public':
                    connection.set_tenant(i)
                    print(i.schema_name)
                    print("------------")
                    try:
                        workflow_queryset = OrganisationWorkflow.objects.all()
                        for workflow_obj in workflow_queryset:
                            if workflow_obj.bulk_sample_url.name  != '':
                                print(workflow_obj.name)
                            else:
                                pass
                    except Exception as error:
                        print(error)
            print("===========")
        except Exception as error:
            print("Unexpected Error Occured {}".format(error))