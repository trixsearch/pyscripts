import csv, os, requests, traceback

from django.contrib.auth.models import Group
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.org_jobs.models import JobRole,HeadCountPlan

from ezedox.celery import app
from ezedox.settings import SSL_VERIFICATION
from apps.org_users.models import OrganisationUser
from apps.org_import.models import EntityImport
from apps.org_import.utils import send_updates_for_import
from apps.organisations.models import Organisation
from apps.org_lists.models import OrganisationLists
from utils.prime_generic_methods import get_custom_field_errors
from utils.loggerwrapper import Logger, getMessage
from .models import Location
from .serializers import LocationSerializer
from .internal_errors import org_location_errors

logger = Logger(__name__)

@app.task(bind=True, name="bulk_import_locations")
def import_locations(self,request_body,custom_attribs, tenant_id):
    try:
        obj_org = OrganisationUser.default_manager.get(id=request_body["user"])
        tenant = Organisation.objects.get(id=tenant_id)
        import_obj = EntityImport.objects.create(
            transaction_id  = self.request.id,
            started_at      = timezone.now(),
            status          = EntityImport.STATUS_CHOICES[0][0],
            entity_type     = "location",
            user_id         = obj_org.id
        )
        with open(request_body["csv_path"], encoding="utf8", errors='ignore') as csv_file:
            locations = csv.reader(csv_file)
            extra_info_list = []
            total_count = 0
            success_count = 0
            failed_count = 0
            import_result = {}
            err_logs = {}
            for index, location_data in enumerate(locations): #pylint: disable=too-many-nested-blocks
                if index == 0:
                    location_data_length = len(location_data)
                    extra_info_list = location_data[2:location_data_length]
                if index > 1:
                    is_location = False
                    is_location_head = False
                    location_index = 0
                    location_head_index = 1
                    total_count += 1
                    location_data_length = len(location_data)
                    location = {}
                    location_head = ""
                    if location_data[location_index]:
                        is_location = True
                        location["name"] = location_data[location_index]
                    if is_location:
                        if location_data[location_head_index]:
                            location_head_email = location_data[location_head_index]
                            location_head = OrganisationUser.default_manager.filter(email__iexact = location_head_email)
                            if location_head.exists():
                                location_head = str(location_head[location_index].id)
                                is_location_head = True
                            else:
                                logger.info("Incorrect location head for {}".format(location["name"]))
                        else:
                            owner = Group.objects.get(name = 'Owner')
                            location_head = str(OrganisationUser.default_manager.get(groups = owner).id)
                            is_location_head = True
                        extra_info_data = location_data[2:location_data_length]
                        extra_attr = {}
                        error_flag = False
                        if location_data_length >2:
                            for (extra_info_value, extra_info_key) in zip(extra_info_data, extra_info_list):
                                if extra_info_value:
                                    for custom_attrib in  custom_attribs:
                                        if custom_attrib['type'] =='number' and custom_attrib['key'] == extra_info_key:
                                            extra_info_value = int(extra_info_value)
                                            break
                                        if custom_attrib['type'] =='list' and custom_attrib['key'] == extra_info_key:
                                            is_multi = custom_attrib['isMulti']
                                            list_id = custom_attrib['list_type']
                                            list_obj = OrganisationLists.objects.filter(id = list_id)
                                            selected_list_data = list_obj[0].list
                                            extra_info_change_value = {}
                                            for check_data in selected_list_data:
                                                if extra_info_value == check_data['value']:
                                                    extra_info_change_value = {'key':check_data['key'],'value':extra_info_value}
                                                    if is_multi:
                                                        extra_info_value = [extra_info_change_value]
                                                    else:
                                                        extra_info_value = extra_info_change_value
                                                    break
                                            if not extra_info_change_value:
                                                error_flag = True
                                                break
                                if not error_flag:
                                    extra_attr[extra_info_key] = extra_info_value
                                else:
                                    break
                        if not error_flag:
                            location["extra_fields"] = extra_attr
                            req_data = {}
                            req_data["head"] = location_head
                            req_data["location"] = location
                            serializer_class = LocationSerializer
                            if is_location_head:
                                serializer = serializer_class(data=req_data)
                                if serializer.is_valid():
                                    try :
                                        serializer.save()
                                        logger.info("Location {} imported Successfully".format(location["name"]))
                                        success_count += 1
                                    except Exception as e:
                                        internal_error = 17015
                                        logger.exception(getMessage(org_location_errors, internal_error).format(location["name"], str(e)), internal_error)
                                        err_logs[location["name"]] = str(e)
                                else:
                                    internal_error = 17016
                                    err_logs[location["name"]] = get_custom_field_errors(serializer.errors)
                                    logger.error(getMessage(org_location_errors, internal_error).format(serializer.errors, location["name"]), internal_error)
                            else:
                                internal_error = 17017
                                err_logs[location["name"]] = "Location head email not found"
                                logger.error(getMessage(org_location_errors, internal_error).format(location["name"]), internal_error)
                        else:
                            internal_error = 17018
                            err_logs[location["name"]] = "Data not matched"
                            logger.error(getMessage(org_location_errors, internal_error).format(location["name"]), internal_error)
                    else:
                        internal_error = 17019
                        err_logs["Invalid"] = "Location Name is not provided at row no. {}".format(index+1)
                        logger.error(getMessage(org_location_errors, internal_error).format(index+1), internal_error)
            failed_count = total_count - success_count
            import_result["success"] = success_count
            import_result["failed"] = failed_count
            import_result["error_results"] = err_logs
            import_obj.completed_at = timezone.now()
            import_obj.result = import_result
            if failed_count:
                import_obj.status = EntityImport.STATUS_CHOICES[2][0]
            else:
                import_obj.status = EntityImport.STATUS_CHOICES[1][0]
            import_obj.save()
            send_updates_for_import(tenant, import_obj)
    except Exception as e:
        internal_error = 17020
        logger.exception(getMessage(org_location_errors, internal_error).format(e), internal_error)
    print("csv_path : {0}".format(request_body["csv_path"]))
    os.remove(request_body["csv_path"])
    print("File removed")


@receiver(post_save, sender=Location, dispatch_uid="headcount_plan_location")
def headcount_plan(sender, instance, created, **kwargs):
    if created:
        for item in JobRole.objects.filter(tenant=instance.tenant):
            HeadCountPlan.objects.create(location=instance, role=item, tenant=instance.tenant)
    else:
        pass

def recursive_api_call(url, source, expected_type, locations, token, hashset, category="geographical"):
    try:
        if source:
            tag_index = url.find("/tag")
            new_url = url[:tag_index] + f"/tag/{source}/subtag?category={category}"
        else:
            new_url = url
        response = requests.get(new_url, headers={"Authorization": f"Bearer {token}"}, verify=SSL_VERIFICATION)
        if response.status_code == 200:
            data = response.json()
            if data.get("tagList"):
                for item in data["tagList"]:
                    if item["type"] != expected_type:
                        recursive_api_call(new_url, item['uuid'] ,expected_type , locations, token, hashset, category)
                    else:
                        if item["uuid"] not in hashset:
                            parent = []
                            if isinstance(item.get("parents", []), list):
                                for a in item.get(" ", []):
                                    if isinstance(a, dict) and all (k in a for k in ("uuid", "name", "type")):
                                        parent.append({"uuid": a["uuid"], "name": a["name"], "type": a["type"]})
                            hashset.add(item["uuid"])
                            location_payload = {"parent": parent, "name": item["name"], "type": item["type"], "uuid": item["uuid"]}
                            if "attributes" in item:
                                location_payload["attributes"] = item["attributes"]
                            locations.append(location_payload)
            return
        else:
            logger.info(response.status_code)
            return
    except Exception as error:
        logger.info(traceback.format_exc())
        return