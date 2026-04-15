from django.db import connection
from django.core.management.base import BaseCommand
from utils.utils import get_tenant_model
from apps.org_lists.models import OrganisationLists, OrganisationAdvancedLists
from apps.org_lists.serializers import OrganisationAdvancedListsSerializer
from utils.prime_generic_methods import get_custom_field_errors

class Command(BaseCommand):

    help="""List to Advanced List Conversion."""

    def handle(self, *args, **options):
        try:
            connection.set_tenant(get_tenant_model().objects.get(schema_name = 'ezedox_jll'))
            org_lists = OrganisationLists.objects.filter(name__istartswith = "jll")
            adv_list = []
            for item in org_lists:
                for list_item in item.list:
                    adv_list_item = {}
                    adv_list_item["client"] = item.name
                    adv_list_item["isBGV"] = True
                    adv_list_item["status"] = "Active"
                    adv_list_item["isProfileToBeCreated"] = True
                    adv_list_item["vendor"] = list_item["value"]
                    adv_list.append(adv_list_item)
            adv_list_schema = [
                {"name": "client", "type": "string", "required": True},
                {"name": "vendor", "type": "string", "required": True},
                {"name": "status", "type": "string", "required": True},
                {"name": "isBGV", "type": "boolean", "required": False},
                {"name": "isProfileToBeCreated", "type": "boolean", "required": False}
            ]
            obj = OrganisationAdvancedLists.objects.create(name="Client Details",key="clients_details",lists=adv_list,schema=adv_list_schema)
            print("Advance List created : " + obj.name)
        except Exception as e:
            print("Failed  {}".format(str(e)))