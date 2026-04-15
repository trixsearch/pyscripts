from django.db import connection
from django.core.management.base import BaseCommand
from utils.utils import get_tenant_model
from apps.org_lists.models import OrganisationLists, OrganisationAdvancedLists
from utils.prime_generic_methods import get_custom_field_errors
from apps.org_lists.utils import strip_list_data

class Command(BaseCommand):

    help="""List and Advanced List Whitespace Cleanup."""
    
    def handle(self, *args, **options):
        try:
            connection.set_schema_to_public()
            for i in get_tenant_model().objects.all():
                if i.schema_name != 'public':
                    connection.set_tenant(i)
                    try:
                        print("Checking list and advanced list data for tenant {}.".format(i))
                        list_data = OrganisationLists.objects.all()
                        if list_data.exists():
                            for list in list_data:
                                list.list = strip_list_data(list.list)
                                list.save()
                            print("list cleanup completed for tenant {}.".format(i))
                        else:
                            print("No List found in tenant {}.".format(i))
                        adv_list_data = OrganisationAdvancedLists.objects.all()
                        if adv_list_data.exists():
                            for adv_list in adv_list_data:
                                adv_list.lists = strip_list_data(adv_list.lists)
                                adv_list.schema = strip_list_data(adv_list.schema)
                                adv_list.save()
                            print("Advanced list cleanup completed for tenant {}.".format(i))
                        else:
                            print("No Advanced List found in tenant {}.".format(i))
                    except Exception as e:
                        print("Failed to cleanup list and adv list in tenant{}. due to {}".format(i, str(e)))
            print("List and Advanced List cleanup completed.")
        except Exception as e:
            print("Failed  {}".format(str(e)))