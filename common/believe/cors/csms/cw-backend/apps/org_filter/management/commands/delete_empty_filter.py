from django.db import connection
from django.core.management.base import BaseCommand
from utils.utils import get_tenant_model
from apps.org_filter.models import OrganisationFilter
from utils.prime_generic_methods import get_custom_field_errors

class Command(BaseCommand):

    help="""Creating Seearch fields for Entity & Process"""

    def handle(self, *args, **options):
        try:
            connection.set_schema_to_public()
            for i in get_tenant_model().objects.all():
                if i.schema_name != 'public':
                    connection.set_tenant(i)
                    try:
                        print("Deleting empty filter in tenant {}.".format(i))
                        filter_model_data = OrganisationFilter.objects.all()
                        if filter_model_data:
                            for filter_data in filter_model_data:
                                if not filter_data.processDefinitionKey:
                                    filter_data.delete()
                            print("Successfully deleted filter in tenant {}.".format(i))
                        else:
                            print("No existing filter found in tenant {}.".format(i))
                    except Exception as e:
                        print("Failed to delete filter in tenant{}. due to {}".format(i, str(e)))
            print("Deletion of empty filter completed.")
        except Exception as e:
            print("Failed  {}".format(str(e)))