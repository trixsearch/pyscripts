from apps.org_users.models import OrganisationUser, PlatformPolicy
from apps.organisations.models import Organisation, OrganisationLicense
from ezedox.settings import HIGH_PRIORITY_TASK, PLATFORM_INTERNAL_TOKEN, PLATFORM_BASE_URL, SSL_VERIFICATION, FILE_DOMAIN_URL
from apps.org_users.utils import get_modeller_access
from .loggerwrapper import Logger
from ezedox.celery import app
import traceback, requests

logger = Logger(__name__)

def create_update_policy(orgId, policyId, name, relation="MY_ORG", source_tenant=None):
    org, created = Organisation.objects.get_or_create(id=orgId)
    if source_tenant:
        source_tenant, created = Organisation.objects.get_or_create(id=source_tenant)
    if PlatformPolicy.objects.filter(tenant=org, policy_id=policyId, relation=relation, source_tenant=source_tenant).exists():
        platform_policy = PlatformPolicy.objects.get(tenant=org, policy_id=policyId, relation=relation, source_tenant=source_tenant)
        if platform_policy.name != name:
            platform_policy.name = name
            platform_policy.save()
    else:
        platform_policy = PlatformPolicy.objects.create(tenant=org, policy_id=policyId, name=name, relation=relation, source_tenant=source_tenant)
    return platform_policy

@app.task(bind=True, name="update_user_policy")
def update_user_policy(self, url, org_id, userId, token):
    try:
        url = "{0}/api/identity/org/{1}/user/{2}/policy".format(url, org_id, userId)
        headers = {
            "content-type" : "application/json",
            "Authorization" : "Bearer " + token,
            "Host": FILE_DOMAIN_URL
        }
        response = requests.request("GET", url, headers=headers, verify=SSL_VERIFICATION).json()
        logger.info(response)
        all_user_policy = []
        for item in response["policies"]:
            if "relation" not in item:
                for item2 in item["policy"]:
                    all_user_policy.append(create_update_policy(item["orgId"], item2["policyId"], item2["name"], "MY_ORG", None))
            elif item["relation"] == "vendor":
                for item2 in item["policy"]:
                    all_user_policy.append(create_update_policy(item["sourceOrg"], item2["policyId"], item2["name"], "VENDOR_ORG", item["orgId"]))
            elif item["relation"] == "client":
                for item2 in item["policy"]:
                    all_user_policy.append(create_update_policy(item["orgId"], item2["policyId"], item2["name"], "CLIENT_ORG", item["sourceOrg"]))
            else:
                pass
        user = OrganisationUser.objects.get(userId=userId)
        user.platform_policy.set(all_user_policy)
        return None
    except Exception as e:
        logger.exception(e)

def employee_sync_update(employee):
    try:
        org_id = employee["tenant"]
        tenant, created = Organisation.objects.get_or_create(id=org_id)
        if not OrganisationUser.objects.filter(userId=employee["userId"], tenant=tenant).exists():
            user_obj = OrganisationUser.objects.create(
                first_name=employee["first_name"],
                last_name=employee["last_name"],
                email=employee["email"],
                tenant=tenant,
                employee_id=employee["employee_id"],
                userId=employee["userId"],
                mobile=employee["mobile"],
                is_superuser = employee["is_superuser"]
            )
            get_modeller_access(OrganisationLicense.objects.get(organisation=tenant).processengine, user_obj, str(org_id))
        else:
            user = OrganisationUser.objects.get(userId=employee["userId"], tenant=tenant)
            user.first_name = employee["first_name"]
            user.last_name = employee["last_name"]
            user.email = employee["email"]
            user.tenant = tenant
            user.employee_id = employee["employee_id"]
            user.userId = employee["userId"]
            user.mobile = employee["mobile"]
            user.save()
            logger.info("User profile Updated")
        update_user_policy.apply_async(args=[PLATFORM_BASE_URL, org_id, employee["userId"], PLATFORM_INTERNAL_TOKEN], priority=HIGH_PRIORITY_TASK)
        return True
    except Exception as e:
        logger.info(traceback.format_exc())
        logger.info(
            "Unexpected error occurred while parsing employee_sync_update - {0}".format(e))
        return None
