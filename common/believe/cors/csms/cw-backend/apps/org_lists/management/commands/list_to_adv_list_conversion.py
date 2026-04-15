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
            tenant_name = str(input("Enter tenant Name:"))
            connection.set_schema_to_public()
            obj = get_tenant_model().objects.get(schema_name = 'ezedox_'+tenant_name)
            if obj:
                connection.set_tenant(obj)
                try:
                    list_key = str(input("Enter List Key:"))
                    list_obj = OrganisationLists.objects.get(key = list_key)
                    if list_obj:
                        list_name = list_obj.name
                        list_data = list_obj.list
                        key_data = list(list_data[0].keys())
                        new_key_data = key_data.copy()
                        #createing req body for adv list
                        schema = []
                        if len(key_data) > 2:
                            new_key_data.remove('key')
                            for key_item in new_key_data:
                                item_dic = {}
                                if key_item == 'value':
                                    item_dic['required'] = True
                                    item_dic['name'] = 'name'
                                    item_dic['type'] = "string"
                                    schema.append(item_dic)
                                else:
                                    item_dic['required'] = True
                                    item_dic['name'] = key_item
                                    item_dic['type'] = "string"
                                    schema.append(item_dic)
                        else:
                            item_dic = {}
                            new_key_data.remove('key')
                            item_dic['required'] = True
                            item_dic['name'] = 'name'
                            item_dic['type'] = "string"
                            schema.append(item_dic)
                        lists = []
                        for value_data in list_data:
                            list_dict = {}
                            list_dict['name'] = value_data['value']
                            if len(new_key_data) > 1:
                                for extra_data in new_key_data:
                                    if extra_data == 'value':
                                        pass
                                    else:
                                        list_dict[extra_data] = value_data[extra_data]
                            lists.append(list_dict)
                        req_body = {}
                        req_body['name'] = list_name
                        req_body['key'] = list_key
                        req_body['schema'] = schema
                        req_body['lists'] = lists
                        serializer = OrganisationAdvancedListsSerializer(data = req_body)
                        if serializer.is_valid():
                            adv_list_obj = serializer.save()
                            print("Advanced Lists has been added successfully.")
                        else:
                            print("error {}".format(get_custom_field_errors(serializer.errors)))
                    else:
                        print("list with key {} does not exists.".format(list_key))
                except Exception as e:
                    print("Failed  {}".format(str(e)))      
            else:
                print("tenant with name {} does not exists.".format(tenant_name))
        except Exception as e:
            print("Failed  {}".format(str(e)))