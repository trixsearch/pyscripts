from django.db import connection
from apps.org_location.models import Location
from apps.org_config.models import CustomAttribute
from apps.org_users.models import OrganisationUser
from django.core.management.base import BaseCommand
from utils.utils import get_tenant_model

class Command(BaseCommand):
    def handle(self, *args, **options):
        try:
            connection.set_schema_to_public()
            for i in get_tenant_model().objects.all():
                if i.schema_name != 'public':
                    connection.set_tenant(i)
                    try:
                        cus_att_data = CustomAttribute.objects.all()
                        if cus_att_data.exists():
                            for cus_type in cus_att_data:
                                if cus_type.type == 'users':
                                    data_obj = OrganisationUser.objects.all()
                                if cus_type.type == 'locations':
                                    data_obj = Location.objects.all()
                                if data_obj.exists():
                                    for sel_data in data_obj:
                                        data_keys=[]
                                        if sel_data.extra_fields:
                                            data_keys = sel_data.extra_fields.keys()
                                        cus_data = cus_type.custom_attribute['components']
                                        for cus_val in cus_data:
                                            key = cus_val['key']
                                            if key not in data_keys:
                                                sel_data.extra_fields[key] = ''
                                        try:        
                                            sel_data.save()
                                        except Exception as e:
                                            print("\n \nFailed to save object of {} for tenant {} due to {}".format(cus_type.type,i,str(e)))
                    except Exception as e:
                        print("\n \nFailed for tenant {} due to {}".format(i,str(e)))
        except Exception as e:
            print("Failed  {}".format(str(e)))
