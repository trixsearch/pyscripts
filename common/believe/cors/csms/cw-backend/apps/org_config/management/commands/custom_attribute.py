from django.db import connection
from apps.org_location.models import Location
from apps.org_config.models import CustomAttribute
from django.core.management.base import BaseCommand
from utils.utils import get_tenant_model

class Command(BaseCommand):

    help="""Creating custom attribute for existing extra field data in location and department
            if you want to continue with tenant type 'yes' or 'no'."""

    def handle(self, *args, **options):
        try:
            connection.set_schema_to_public()
            for i in get_tenant_model().objects.all():
                if i.schema_name != 'public':
                    connection.set_tenant(i)
                    try:
                        choice = str(input("do you want to continue for tenant {} ?? if yes type 'yes' else type 'no' :".format(i)))
                        if choice == 'yes':
                            location_cus_att_need_to_create = False
                            locations = Location.objects.all()
                            if locations:
                                for location in locations:
                                    name = location.name
                                    extra_fields = location.extra_fields
                                    if extra_fields:
                                        location_cus_att_need_to_create = True
                                if location_cus_att_need_to_create:
                                    expected_location_key = []
                                    expected_location_label = []
                                    n = int(input("Enter the size of list for location custom attribut in tenant {} :".format(i) ))
                                    expected_location_label = list(map(str, input("Enter the expected labels for location custom attribute separated by comma for tenant {} : ".format(i)).strip().split(',')))[:n]
                                    expected_location_key = list(map(str, input("Enter the expected keys for labels in the same order as you entered labels for location custom attribute separated by comma for tenant {} : ".format(i)).strip().split(',')))[:n]
                                    for location in locations:
                                        name = location.name
                                        extra_fields = location.extra_fields
                                        total_keys = []
                                        no_match = []
                                        diff_list = []
                                        if extra_fields:
                                            total_keys = extra_fields.keys()
                                            for key in total_keys:
                                                if key not in expected_location_key:
                                                    diff_list.append(key)
                                            if diff_list:
                                                print("""\n\nthese are the extra key found {} for location {} in tenant {}. these keys data
                                                needed to be fixed""".format(str(diff_list),name,i))
                                        for key in expected_location_key:
                                            if key not in total_keys:
                                                no_match.append(key)
                                        if no_match:
                                            print("""\n\nmissing key from expected keys are {} for location {} in tenant {}. 
                                            go to extra field in location and create it""".format(str(no_match),name,i))
                                    attributes = []
                                    for (key,label) in zip(expected_location_key,expected_location_label):
                                        data = {}
                                        data["label"] = label
                                        data["key"] = key
                                        data["type"] = "string"
                                        data["required"] = True
                                        data["list_type"] = None
                                        data["isMulti"] = False
                                        attributes.append(data)
                                    try:
                                        location_attribute = CustomAttribute.objects.update_or_create(
                                            type = "locations",
                                            defaults={"custom_attribute":{"components":attributes}},
                                        )
                                    except Exception as e:
                                        print("\n \nFailed to create custom attribute for location in tenant {} . due to {}".format(i,str(e)))
                                    
                                    if not diff_list and not no_match:
                                        print("\n\nCustom Attribute craeted Successfully for Location in tenant {}.".format(i))
                                        print("**********************************************************\n")
                                    else:
                                        print("\n\n*****Fix the above error and retry for tenant {}*****".format(i))
                            else:
                                print("\n*****no data found for location in tenant {}. No need to create custom attribute for loctaion*****.".format(i))
                        else:
                            print("\n\nskipping tenant: {}".format(i))
                    except Exception as e:
                        print("\n \nFailed for tenant {} due to {}".format(i,str(e)))
        except Exception as e:
            print("Failed  {}".format(str(e)))