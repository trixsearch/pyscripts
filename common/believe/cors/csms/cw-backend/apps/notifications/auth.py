import logging

from channels.auth import AuthMiddlewareStack
from django.contrib.auth.models import AnonymousUser
from django.contrib.contenttypes.models import ContentType
from django.db import connection
from django.http import QueryDict
from rest_framework_jwt.serializers import VerifyJSONWebTokenSerializer
from utils.utils import get_tenant_model

logger = logging.getLogger(__name__)

def remove_www(hostname):
    """
    Removes www. from the beginning of the address. Only for
    routing purposes. www.test.com/login/ and test.com/login/ should
    find the same tenant.
    """
    if hostname.startswith("www."):
        return hostname[4:]

    return hostname

# class TenantChannelsMiddleware(SuspiciousTenantMiddleware):

#     def get_tenant(self, model, hostname, request):
#         return model.objects.get(domain_url=hostname)

#     def hostname_from_request(self, request):
#         """ Extracts hostname from request. Used for custom requests filtering.
#             By default removes the request's port and common prefixes.
#         """
#         if request.get('server') and ('localhost' in request['server'] or '127.0.0.1' in request['server']):
#             origin = dict(request['headers'])[b'origin'].decode("utf-8")
#             return remove_www(origin.split('://')[-1]).lower()
#         else:
#             return remove_www(request['server'].split(':')[0]).lower()

#     def process_request(self, request):
#         # Connection needs first to be at the public schema, as this is where
#         # the tenant metadata is stored.
#         connection.set_schema_to_public()

#         hostname = self.hostname_from_request(request)
#         TenantModel = get_tenant_model()

#         try:
#             # get_tenant must be implemented by extending this class.
#             tenant = self.get_tenant(TenantModel, hostname, request)
#             assert isinstance(tenant, TenantModel)
#         except TenantModel.DoesNotExist:
#             raise self.TENANT_NOT_FOUND_EXCEPTION(
#                 'No tenant for {!r}'.format(request.get_host()))
#         except AssertionError:
#             raise self.TENANT_NOT_FOUND_EXCEPTION(
#                 'Invalid tenant {!r}'.format(request.tenant))

#         request['tenant'] = tenant
#         connection.set_tenant(request['tenant'])

#         # Content type can no longer be cached as public and tenant schemas
#         # have different models. If someone wants to change this, the cache
#         # needs to be separated between public and shared schemas. If this
#         # cache isn't cleared, this can cause permission problems. For example,
#         # on public, a particular model has id 14, but on the tenants it has
#         # the id 15. if 14 is cached instead of 15, the permissions for the
#         # wrong model will be fetched.
#         ContentType.objects.clear_cache()


# class JwtTokenAuthMiddleware:
#     """
#     JWT token authorization middleware for Django Channels 2
#     """

#     def __init__(self, inner):
#         self.inner = inner

#     def __call__(self, scope):
#         if scope.get('query_string'):
#             qs = QueryDict(scope['query_string'])
#             try:
#                 qs = {'token': qs.get('token')}
#                 valid_data = VerifyJSONWebTokenSerializer().validate(qs)
#                 user = valid_data['user']
#                 scope['user'] = user
#             except Exception as e:
#                 logger.exception(e)
#                 scope['user'] = AnonymousUser()
#         return self.inner(scope)


def TokenJwtTokenAuthMiddleware(inner): return JwtTokenAuthMiddleware(AuthMiddlewareStack(inner))
