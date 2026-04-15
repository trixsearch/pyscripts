from functools import wraps
from django.core.exceptions import PermissionDenied
from django.db import connection

from apps.organisations.models import OrganisationLicense

from utils.loggerwrapper import Logger
logger = Logger(__name__)

def user_passes_test(test_func):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if test_func(request):
                return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator


#for both license and user permission
def permission_and_license_required(perm, only_license = False):
    def check_perms(request):
        try:
            user = request.user
            tenant = request.tenant
            path_info = request.path_info
            #we need to send in tuple
            if isinstance(perm, str):
                perms = (perm,)
            else:
                perms = perm

            connection.set_schema_to_public()
            permissions = OrganisationLicense.objects.filter(organisation=tenant).values_list('license__permissions__codename', flat=True)
            has_license_perms = all([perm.split('.')[1] in permissions for perm in perms])
            if only_license:
                if has_license_perms:
                    connection.set_tenant(tenant)
                    return True
            else:
                connection.set_tenant(tenant)
                if has_license_perms and user.has_perms(perms):
                    return True
        except Exception as error:
            logger.exception("{} Failed to verify license or permission to access the view {}. due to {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", path_info, str(error)))
            connection.set_tenant(tenant)
            raise PermissionDenied
        logger.exception("{} trying to access the view {} for which user does not have the permission.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", path_info))
        connection.set_tenant(tenant)
        raise PermissionDenied

    return user_passes_test(check_perms)


#for only license checking
def license_required(perm):
    return permission_and_license_required(perm, only_license=True)
