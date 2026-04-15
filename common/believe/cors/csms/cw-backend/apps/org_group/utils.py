import csv
import os

from django.utils import timezone

from ezedox.celery import app
from apps.org_users.models import OrganisationUser
from apps.org_import.models import EntityImport
from apps.org_import.utils import send_updates_for_import
from apps.organisations.models import Organisation
from utils.prime_generic_methods import get_custom_field_errors
from utils.loggerwrapper import Logger
from .serializers import CreateGroupSerializer

logger = Logger(__name__)


@app.task(bind=True, name="bulk_import_groups")
def import_groups(self,request_body,label_type, tenant_id):
    try:
        obj_org = OrganisationUser.default_manager.get(id=request_body["user"])
        tenant = Organisation.objects.get(id=tenant_id)
        import_obj = EntityImport.objects.create(
            transaction_id  = self.request.id,
            started_at      = timezone.now(),
            status          = EntityImport.STATUS_CHOICES[0][0],
            entity_type     = "groups",
            user_id         = obj_org.id
        )
        with open(request_body["csv_path"], encoding="utf8", errors='ignore') as csv_file:
            groups = csv.reader(csv_file)
            total_count = 0
            success_count = 0
            failed_count = 0
            import_result = {}
            err_logs = {}
            for index, group_data in enumerate(groups):
                if index > 1:
                    name_index = 0
                    user_index = 1
                    filter_field_index = 2
                    total_count += 1
                    group = {}
                    if group_data[name_index]:
                        group["name"] = group_data[name_index]
                    else:
                        err_logs["Invalid"] = "Group Name is not provided at row no. {}".format(index+1)
                        logger.error("Group Name is not provided at row no {} in Group bulk import".format(index+1))
                        continue
                    if group_data[user_index]:
                        user_email_data = group_data[user_index]
                        user_email_list = user_email_data.split(',')
                        users = []
                        for user in user_email_list:
                            if OrganisationUser.default_manager.filter(email = user):
                                users.append(str(OrganisationUser.default_manager.filter(email = user)[0].id))
                            else:
                                err_logs[group_data[name_index]] = "Wrong users data provided at row no. {}".format(index+1)
                                logger.error("Wrong users data provided at row no {} in Group bulk import".format(index+1))
                                continue
                        group["users"] = users
                    else:
                        err_logs[group_data[name_index]] = "users not provided at row no. {}".format(index+1)
                        logger.error("users not provided at row no {} in Group bulk import".format(index+1))
                        continue
                    if group_data[filter_field_index]:
                        fil_field = group_data[filter_field_index]
                        if fil_field in label_type.keys():
                            group["filter_by"] = label_type[fil_field]
                        else:
                            err_logs["Invalid"] = "Wrong value found for filter at row no. {}".format(index+1)
                            logger.error("Wrong value found at row no {} in Group bulk import".format(index+1))
                            continue
                    else:
                        group["filter_by"] = ''
                    req_data = {}
                    req_data["name"] = group['name']
                    req_data["users"] = group['users']
                    req_data["filter_by"] = group['filter_by']
                    serializer_class = CreateGroupSerializer
                    serializer = serializer_class(data = req_data)
                    if serializer.is_valid():
                        try :
                            serializer.save()
                            logger.info("Group {} imported Successfully".format(group["name"]))
                            success_count += 1
                        except Exception as e:
                            logger.exception("error for Group {} is {}".format(group["name"], str(e)))
                            err_logs[group["name"]] = str(e)
                    else:
                        err_logs[group["name"]] = get_custom_field_errors(serializer.errors)
                        logger.error('{} raised for group named {} in group bulk import'.format(serializer.errors, group["name"]))
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
        logger.exception("Unexpected error occured : {}".format(e))
    print("csv_path : {0}".format(request_body["csv_path"]))
    os.remove(request_body["csv_path"])
    print("File removed")


def diff_of_users_in_group(before, after):
    b, a = set(before), set(after)
    return list(a - b), list(b - a), list(a & b)
