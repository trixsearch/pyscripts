import jwt
from apps.org_users.models import OrganisationUser
from apps.user.models import User
from apps.organisations.models import Organisation, OrganisationLicense
from apps.org_users.utils import get_modeller_access
from ezedox.settings import INTERNAL_IP, PLATFORM_INTERNAL_TOKEN, PLATFORM_BASE_URL
from django.core.validators import validate_ipv46_address
from ipware import get_client_ip
from ezedox.settings import HIGH_PRIORITY_TASK
from utils.loggerwrapper import Logger
from rest_framework_jwt.serializers import VerifyJSONWebTokenSerializer
from .platform_employe_sync import update_user_policy
from .utils import get_phone_number
logger = Logger(__name__)

OPEN_PATH = (
    "/cw/admin/",
    "/cw/swagger",
    "/cw/organisations/"
)

END_PATH = (
    "/users/external_users/otp",
    "/users/external_users/login"
)

class UserOrgMiddleWare(object):
    def __init__(self, get_response):
        """
        One-time configuration and initialisation.
        """
        self.get_response = get_response

    def __call__(self, request):
        """
        Code to be executed for each request before the view (and later
        middleware) are called.
        """
        response = self.get_response(request)
        return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        """
        Called just before Django calls the view.
        """

        #Designer Auth
        user_ip, is_routable = get_client_ip(request, request_header_order=['HTTP_X_FORWARDED_FOR'])
        if user_ip and user_ip in INTERNAL_IP:
            validate_ipv46_address(user_ip)
            return None
        
        #Django Admin Auth
        if '_auth_user_id' in request.session:
            user_data = User.objects.filter(pk=request.session["_auth_user_id"])
            if user_data.exists()and (user_data[0].is_staff or user_data[0].is_superuser):
                request._force_auth_user = user_data[0]
                return None
        
        #Django admin / Swagger Doc page loading
        if request.META["PATH_INFO"].startswith(OPEN_PATH) or request.META["PATH_INFO"].endswith(END_PATH):
            return None
        
        #External User Auth
        # if request.META.get('HTTP_AUTHORIZATION', ' ').startswith('JWT '):
        #     token = request.META.get('HTTP_AUTHORIZATION', " ")
        #     data = {'token': token.replace('JWT ', '')}
        #     valid_data = VerifyJSONWebTokenSerializer().validate(data)
        #     request._force_auth_user = valid_data['user']
        #     return None

        
        #Platform User Auth
        try:
            decoded = jwt.decode(request.META["HTTP_JWT_TOKEN"], options={"verify_signature": False})
            if "orgId" in decoded["user"]:
                request.tenant, created = Organisation.objects.get_or_create(id=decoded["user"]["orgId"])
            if not OrganisationUser.objects.filter(userId=decoded["user"]["userId"], tenant__id=decoded["user"]["orgId"] if "orgId" in decoded["user"] else None).exists():
                try:
                    user_obj = OrganisationUser.objects.create(
                        first_name = decoded["user"]["firstName"],
                        last_name = decoded["user"]["lastName"] if "lastname" in decoded["user"] else "",
                        email = decoded["user"]["email"] if "email" in decoded["user"] and decoded["user"]["email"] is not None else "",
                        tenant = Organisation.objects.get(id=decoded["user"]["orgId"]) if "orgId" in decoded["user"] else None ,
                        employee_id = decoded["user"]["empId"] if "empId" in decoded["user"] else "",
                        userId = decoded["user"]["userId"],
                        mobile = get_phone_number(decoded["user"]["mobileNumber"]) if "mobileNumber" in decoded["user"] else None,
                        is_superuser = True if "userGroup" in decoded["user"] and decoded["user"]["userGroup"] == "SUPER_ADMIN" and decoded["user"]["isActive"] else False
                    )
                    update_user_policy.apply_async(args=[PLATFORM_BASE_URL, str(request.tenant.id), decoded["user"]["userId"], PLATFORM_INTERNAL_TOKEN], priority=HIGH_PRIORITY_TASK)
                except Exception as error:
                    logger.exception("Exception occured while creating org user {}".format(error))
                    return None
                get_modeller_access(OrganisationLicense.objects.get(organisation=request.tenant).processengine, user_obj, str(request.tenant.id))
            request._force_auth_user = OrganisationUser.objects.get(userId=decoded["user"]["userId"])
            return None
        except Exception as error:
            return None

    def process_exception(self, request, exception):
        """
        Called when a view raises an exception.
        """
        return None

    def process_template_response(self, request, response):
        """
        Called just after the view has finished executing.
        """
        return response