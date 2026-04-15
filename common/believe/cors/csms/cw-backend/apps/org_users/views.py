# Third-Party imports
import base64
import datetime
import json
import uuid
import io
import os
import mimetypes
import tempfile
import xlsxwriter
import requests

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import Group, Permission, update_last_login
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import SuspiciousOperation
from django.db import transaction, connection
from django.db.models import Q, ProtectedError
from django.http import HttpResponse
from django.utils.crypto import get_random_string
from django.utils.decorators import method_decorator
from django.utils.http import urlsafe_base64_decode
from django.utils.translation import gettext as _
from django.core.files.uploadedfile import SimpleUploadedFile

from rest_framework import filters, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotAuthenticated, PermissionDenied, NotFound
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from rest_framework_api_key.permissions import HasAPIKey
from rest_framework.response import Response
from rest_framework_jwt.utils import jwt_encode_handler, jwt_payload_handler

from apps.org_apps.utils_urls import DELETE_USER
from apps.organisations.models import OrganisationLicense, Organisation
from apps.org_config.models import CustomAttribute
from apps.notifications.notification import send_user_related_updates
from apps.notifications.constants import UpdatesConstant
from apps.org_group.models import OrganisationGroup
from ezedox.settings import ( OTP_EXPIRATION_TIME, 
                             PROCESS_ENGINE_PASSWORD, PROCESS_ENGINE_USER, HIGH_PRIORITY_TASK, FAKE_SMS, BASE_ORG_DOMAIN_URL , KALEYRA_OTP_TEMPLATE_ID)
from utils.prime_generic_methods import get_custom_field_errors
from utils.communication_alerts import send_notification
from apps.org_portals.utils import create_default_content_and_portal_and_associate
from utils.sms import send_otp, only_send_otp, resend_otp, verify_otp, send_otp_v5
from utils.serializers import EmptySerializer
from utils.loggerwrapper import Logger, getMessage, getLogMessage
from utils.CustomSearch import CustomSearchFilter, get_filter_fields
from utils.platform_employe_sync import employee_sync_update

# Relative imports
from .utils import (get_tenant, password_hash, send_account_activation_email, send_forgot_password_email,
                    get_modeller_access, send_otp_email)
from .models import ExternalUser, InternalUser, OrganisationUser, OpenExternalUser, PlatformPolicy
from .internal_errors import org_users_errors

from .serializers import (ExternalUserDynamicFieldsModelSerializer, OrganisationUserRegistrationSerializer, 
                          ExternalUserOTPSerializer, ExternalUserSerializer,
                          OrganisationUserSerializer, OrganisationUserUpdateSerializer, OpenExternalUserDynamicFieldsModelSerializer, OpenExternalUserSerializer, PlatformPolicySerializer)
from django_filters.rest_framework import DjangoFilterBackend
from .filters import (OrganisationUser_filter_fields,
                    OrganisationUser_search_fields,
                    ExternalUser_filter_fields, 
                    ExternalUser_search_fields
                    )


logger = Logger(__name__)

class OrganisationUserViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationUser
    queryset = OrganisationUser.default_manager.all()
    serializer_class = OrganisationUserSerializer
    create_serializer_class = OrganisationUserRegistrationSerializer
    update_serializer_class = OrganisationUserUpdateSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = OrganisationUser_search_fields
    filter_fields = get_filter_fields(OrganisationUser_filter_fields)
    ordering_fields = OrganisationUser_search_fields
    
    def get_queryset(self):
        if "type" in self.request.query_params:
            if self.request.query_params["type"] == 'all':
                qs = OrganisationUser.default_manager.all_with_deleted()
            elif self.request.query_params["type"] == 'inactive':
                qs = OrganisationUser.default_manager.deleted_set()
            else:
                qs = OrganisationUser.default_manager.all()
        else:
            qs = OrganisationUser.default_manager.all()
        for item in self.request.query_params.keys():
            if item.startswith("extra_fields"):
                value = self.request.query_params[item]
                custom_item = CustomAttribute.objects.get(type="users").custom_attribute['components']
                for item_data in custom_item:
                    if item_data["key"] == item.split("__")[-1] and item_data["type"] == "number":
                        value = int(value)
                qs = qs.filter(**{item:value})
        if 'ordering' in self.request.query_params.keys() and (self.request.query_params['ordering'].startswith("extra_fields") or self.request.query_params['ordering'][1:].startswith("extra_fields")):
            qs = qs.order_by(self.request.query_params['ordering'])
        return qs

    # @method_decorator(license_required(["org_users.view_organisationuser", ]))
    def list(self, request, tenant=None):
        logger.info("{} requested the list of Organization User for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        filtered_queryset = None
        try:
            if 'userId' in request.query_params:
                try:
                    serializer = self.serializer_class(self.model.default_manager.get(userId=request.query_params["userId"]), context={"request":request, "tenant" : tenant})
                    context = {"success": True, "message": _("Organisation User details retrieved successfully"), "data": serializer.data}
                    return Response(context, status=status.HTTP_200_OK)
                except Exception as error:
                    logger.exception(error)
                    context = {"success": True, "message": _("User Id not present in database.")}
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            filtered_queryset = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant))
            pagination_data = None
            page = self.paginate_queryset(filtered_queryset)

            if page is not None:
                serializer = self.serializer_class(page, many=True, fields=('id', 'last_login', 'email', 'first_name', 'last_name',
                  'middle_name', 'employee_id', 'manager', 'gender', 'created_at',
                  'location', 'department', 'is_active', 'email_verified','mobile', 'full_name', 'extra_fields','is_deleted'), context={"request":request})
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True, fields=('id', 'last_login', 'email', 'first_name', 'last_name',
                  'middle_name', 'employee_id', 'manager', 'gender', 'created_at',
                  'location', 'department', 'is_active', 'email_verified','mobile', 'full_name', 'extra_fields','is_deleted'), context={"request":request})
            context = {"success": True, "message": _("Organisation Users data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} Organisation Users data returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,
                       'message': _('Organisation Users data returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 23016
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception("{} Failed to get Organisation Users data, due to: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    # @method_decorator(permission_and_license_required(["org_users.view_organisationuser", ]))
    @action(detail=False,  name='third-party-users')
    def third_party(self, request, tenant=None):
        logger.info("requested to get Third party users data for tenant: {}".format(tenant))
        try:
            third_party_users_queryset = self.queryset.filter(tenant__id=tenant, groups__name__in=['Third Party Users'])
            filtered_queryset = self.filter_queryset(third_party_users_queryset)
            pagination_data = None
            page = self.paginate_queryset(filtered_queryset)

            if page is not None:
                serializer = self.serializer_class(page, many=True, fields=('id', 'last_login', 'email', 'first_name', 'last_name',
                  'middle_name', 'employee_id', 'manager', 'gender', 'created_at',
                  'location', 'department', 'is_active', 'email_verified', 'roles'), context={"request":request})
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True, fields=('id', 'last_login', 'email', 'first_name', 'last_name',
                  'middle_name', 'employee_id', 'manager', 'gender', 'created_at',
                  'location', 'department', 'is_active', 'email_verified', 'roles'), context={"request":request})
            context = {"success": True, "message": _("Third party users data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("Third party users data returned successfully for tenant: {}.".format(tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 23017
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_users.view_organisationuser", ]))
    @action(detail=False,  name='all-org-users')
    def all_org_users(self, request, tenant=None):
        logger.info("requested to get get all organisation users data for tenant: {}.".format(tenant))
        try:
            all_org_users_queryset = self.queryset.filter(tenant__id=tenant)
            filtered_queryset = self.filter_queryset(all_org_users_queryset)
            pagination_data = None
            page = self.paginate_queryset(filtered_queryset)

            if page is not None:
                serializer = self.serializer_class(page, many=True, fields=('id', 'last_login', 'email', 'first_name', 'last_name',
                  'middle_name', 'employee_id', 'manager', 'gender', 'created_at',
                  'location', 'department', 'is_active', 'email_verified', 'roles','mobile', 'full_name','extra_fields'),context={"request":request})
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True, fields=('id', 'last_login', 'email', 'first_name', 'last_name',
                  'middle_name', 'employee_id', 'manager', 'gender', 'created_at',
                  'location', 'department', 'is_active', 'email_verified', 'roles','mobile', 'full_name','extra_fields'), context={"request":request})
            context = {"success": True, "message": _("All Organisation users data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("All Organisation users data returned successfully for tenant: {}.".format(tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 23018
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False,  name='users-who-manage-tasks')
    def task_users(self, request, tenant=None):
        logger.info("requested to get Task users data for tenant: {}.".format(tenant))
        try:
            filtered_queryset = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant))
            pagination_data = None
            page = self.paginate_queryset(filtered_queryset)

            if page is not None:
                serializer = self.serializer_class(page, many=True, fields=('id', 'last_login', 'email', 'first_name', 'last_name',
                  'middle_name', 'employee_id', 'manager', 'gender', 'created_at',
                  'location', 'is_active', 'email_verified', 'roles','mobile', 'full_name', 'extra_fields', 'userId'), context={"request":request})
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True, fields=('id', 'last_login', 'email', 'first_name', 'last_name',
                  'middle_name', 'employee_id', 'manager', 'gender', 'created_at',
                  'location', 'is_active', 'email_verified', 'roles','mobile', 'full_name', 'extra_fields', 'userId'), context={"request":request})
            context = {"success": True, "message": _("Task users data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("Task users data returned successfully for tenant: {}.".format(tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 23019
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    # @method_decorator(license_required(["org_users.add_organisationuser", ]))
    def create(self, request, tenant=None):
        logger.info("{} requested to create Organisation user for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:

            request_data = request.data.copy()
            request_data["tenant"] = Organisation.objects.get(key=tenant).id
            request_data['email'] = request_data['email'].lower()

            org_user_queryset = OrganisationUser.default_manager.all_with_deleted().filter(email=request_data['email'], tenant__id=tenant)
            if org_user_queryset.exists():
                if org_user_queryset[0].is_deleted:
                    context = {'success': False, 'message': _('This user was deleted, contact your system administrator to add this user back')}
                    logger.error("{}, This user was deleted, contact your system administrator to add this user back , status: HTTP_400_BAD_REQUEST".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"))
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
                internal_error = 23020
                context = {'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            if request_data['is_active']:
                if not('password' in request_data and len(request_data['password']) >= 8):
                    internal_error = 23021
                    context = {'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
                else:
                    request_data['email_verified'] = True
            else:
                request_data['password'] = get_random_string(length=8)

            serializer = self.create_serializer_class(data=request_data)

            if serializer.is_valid():
                # Opening new transaction with context manager to make atomic_requests only.
                with transaction.atomic():

                    user_obj = serializer.save()
                    # If is_active is false from create user request, only then an activation email link will be sent.
                    if not request_data['is_active']:
                        send_account_activation_email(request, user_obj)

                    # Creating Flowable User for Organisation Owner, modeler, superadmin
                    # TODO exception handling for Process Engine Calls
                    request_user_permissions_list = Permission.objects.filter(
                                    group__user=user_obj).values_list('codename', flat=True)
                    if 'change_organisationworkflow' in request_user_permissions_list:
                        engine_url = OrganisationLicense.objects.get(organisation=request.tenant)
                        tenant = get_tenant(request)
                        get_modeller_access(engine_url.processengine, user_obj, tenant)

                message = ""
                if request_data['is_active']:
                    message = "Organisation user created successfully."
                else:
                    message = "Organisation user created successfully. Activation link is sent to email."
                context = {"success": True, "message": _(message), "data": self.serializer_class(user_obj, context={"request":request}).data}
                logger.info("{} {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", message, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 23022
            context = {'error': get_custom_field_errors(serializer.errors), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", context), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except serializers.ValidationError as error:
            internal_error = 23023
            context = {'error': get_custom_field_errors(error.detail), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", context), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 23024
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # method decorator to check the permissions is not enabled because the "self_access_or_has_view_organisationuser_permission" class is handling this action permissions
    # @method_decorator(permission_required(["org_users.view_organisationuser", ], raise_exception=True))
    def retrieve(self, request, pk=None, tenant=None):
        logger.info("{} requested to retrieve Organisation user for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except PermissionDenied as error:
                internal_error = 23025
                context = {'error': str(error), 'success': False, 'message': _(error.detail), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, context), internal_error)
                return Response(context, status=status.HTTP_403_FORBIDDEN )
            except NotAuthenticated as error:
                internal_error = 23026
                context = {'error': str(error), 'success': False, 'message': _(error.detail), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, context), internal_error)
                return Response(context, status=status.HTTP_401_UNAUTHORIZED)
            except Exception as error:
                internal_error = 23027
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj, context={"request":request})
            context = {"success": True, "message": _("Organisation User details retrieved successfully"), "data": serializer.data}
            logger.info("{} Organisation User details retrieved successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 23028
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # method decorator to check the permissions is not enabled because the "self_access_or_has_view_organisationuser_permission" class is handling this action permissions
    # @method_decorator(permission_required(["org_users.change_organisationuser", ], raise_exception=True))
    def update(self, request, pk=None, tenant=None):
        logger.info("{} requested to update Organisation user for id {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try: # pylint: disable=too-many-nested-blocks
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 23029
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.update_serializer_class(obj, data=request.data, partial=True, context={"request":request})
            if serializer.is_valid(raise_exception=True):
                updated_user = serializer.save()
                context = {"success": True, "message": _("Organisation User details updated successfully."), "data": self.serializer_class(obj, context={"request":request}).data}
                logger.info("{} Organisation User details updated successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 230230
            context = {'error': get_custom_field_errors(serializer.errors), "success": False, "message": _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, context), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except serializers.ValidationError as error:
            internal_error = 23031
            context = {'error': get_custom_field_errors(error.detail), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, context), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 23032
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_users.delete_organisationuser", ]))
    def destroy(self, request, pk=None, tenant=None):
        logger.info("{} requested to delete Organisation user for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 23033
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            if obj.groups.filter(Q(name='Owner')).exists() :
                context = {'error': "Owner cannot be deleted", 'success': False, 'message': _('You cannot delete Owner of a organisation.')}
                logger.error("{} Failed to delete Organisation user for id: {}, due to : {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, context))
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            engine_url = OrganisationLicense.objects.get(organisation=request.tenant)
            user_id = get_tenant(request) + "_" + obj.email
            request_user_permissions_list = Permission.objects.filter(
                                                group__user=obj).values_list('codename', flat=True)
            #check the user role and delete their BPMN engine account accordingly
            if 'change_organisationworkflow' in request_user_permissions_list:
                #Delete BPMN engine users
                # TODO exception handling for Process Engine Calls
                url = DELETE_USER.format(engine_url.processengine,base64.b64encode(bytes(user_id, 'utf-8')).decode("utf-8"))
                action = requests.delete(url, auth=(PROCESS_ENGINE_USER, PROCESS_ENGINE_PASSWORD), headers={'Content-Type': "application/json"})
            self.perform_destroy(obj)

            context = {"success": True, "message": _("Organisation User deleted successfully"), "data": None}
            logger.info("{} Organisation User deleted successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except ProtectedError as error:
            text_d = ""
            text_l = ""
            response = ""
            for head in error.protected_objects:
                if type(head).__name__.replace('Detail','') == 'Department':
                    text_d = text_d + head.department.name + ','
                if type(head).__name__.replace('Detail','') == 'Location':
                    text_l = text_l + head.location.name + ','
            if len(text_l)>0:
                text_l = text_l[:-1]
                response = response + "User is head of " + type(head).__name__.replace('Detail','') + " for " + text_l + "."
            if len(text_d)>0:
                text_d = text_d[:-1]
                response = response + "User is head of " + type(head).__name__.replace('Detail','') + " for " + text_d + "."

            response = response + "Please remove him from head and delete the user"
            internal_error = 23034
            context = {'error': response, 'success': False,
                       'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, context), internal_error)
            return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)
        except Exception as error:
            internal_error = 23035
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], name="user-involved-group")
    def user_involved_group(self, request, pk=None, tenant=None):
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 23039
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            user_id = str(obj.id)
            groups_data = []
            for group in OrganisationGroup.objects.filter(tenant__id=tenant):
                if group.users.filter(id=user_id).exists():
                    filter_field = group.filter_by
                    groups_data.append({"id":group.id,"name":group.name,"filter_field":filter_field, "key":group.key})
            context = {"success": True, "message": _("Organisation User involved group data retrieved successfully."), "data": groups_data}
            logger.info("{} Organisation User involved group data retrieved successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 23040
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # post to update user with email
    # @method_decorator(license_required(["org_users.change_organisationuser", ]))
    @action(detail=False, methods=['post'], name="update_user")
    def update_user(self, request, tenant=None):
        try:
            try:
                email = request.data.get("email")
                instance = self.model.objects.get(email=email, tenant__id=tenant)
                request.data.pop('email')
                data = {}
                message = "{} user is updated".format(email)
                data["message"] = message
                tenant_id = request.tenant.id
                user_data = {}
                user_data["id"] = instance.id
                user_data["email"] = instance.email
                send_user_related_updates.apply_async(
                    args=[tenant_id, user_data, UpdatesConstant.UPDATE_USER_ATTR, data],
                    priority=HIGH_PRIORITY_TASK,
                    countdown=10
                )
                request.user = instance
                return self.partial_update(request, pk=instance.id)
            except Exception as error:
                internal_error = 23041
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error).format(error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
        except Exception as error:
            internal_error = 23042
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['patch'], name='recover-user')
    def recover_user(self, request, pk=None, tenant=None):
        logger.info("requested to activate, deleted organisation user for id: {} for tenant: {}.".format(pk, tenant))
        try:
            try:
                instance = OrganisationUser.default_manager.deleted_set().get(id = pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 23043
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            user_status = instance.is_deleted
            if user_status:
                instance.is_deleted = False
                instance.save()
                send_forgot_password_email(request, instance)
            context = {"success": True, "message": _("Organisation users activated successfully. Reset password link has been sent to registered email id.")}
            logger.info("Organisation users with email {} activated successfully. Reset password link has been sent to registered email id for tenant: {}".format(instance.email, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 23044
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], name='platform_user_sync')
    def platform_user_sync(self, request, tenant=None):
        try:
            logger.info("requested to sync, platform user data user for tenant: {}.".format(tenant))
            request_data = request.data.copy()
            if "delete" in request.query_params and request.query_params["delete"] == "true":
                user = OrganisationUser.objects.get(userId = request_data["userId"])
                user.delete()
                status_code = status.HTTP_200_OK
                context = {"success": True, "message": _("Platform user synced successfully.")}
                return Response(context, status=status_code)
            user_response = employee_sync_update(request_data)
            if user_response:
                status_code = status.HTTP_200_OK
                context = {"success": True, "message": _("Platform user synced successfully.")}
            else:
                status_code = status.HTTP_400_BAD_REQUEST
                context = {"success": False, "message": _("Failed to sync Platfrom user.")}
            return Response(context, status=status_code)
        except Exception as error:
            internal_error = 23109
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], name="transform_userId")
    def transform_userid(self, request, tenant=None):
        try:
            data = request.data
            users_list = {}
            users = OrganisationUser.objects.filter(userId__in=data, tenant__id=tenant).values('userId','first_name', 'last_name')
            for item in users:
                users_list[item['userId']] = item['first_name'] + ' ' +item['last_name']
            context = {"success": True, "message": _("Organisation Users retrived successfully."), "data" : users_list}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 23109
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ExternalUserViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = ExternalUser
    queryset = ExternalUser.objects.all()
    serializer_class = ExternalUserSerializer
    create_serializer_class = ExternalUserDynamicFieldsModelSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = ExternalUser_search_fields
    filter_fields = get_filter_fields(ExternalUser_filter_fields)
    ordering_fields = ExternalUser_search_fields
    

    # def get_permissions(self):
    #     if self.action == 'create':
    #         permission_classes = [AllowAny]
    #         return [permission() for permission in permission_classes]
    #     if self.action == 'list':
    #         permission_classes = [has_open_access_or_has_api_key_access_or_individual_permission]
    #         return [permission(["view_externaluser", ]) for permission in permission_classes]
    #     return super().get_permissions()

    def list(self, request, tenant=None):
        logger.info("{} requested the list of External User for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            filtered_queryset = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant))
            if "extra_fields" in request.query_params and "search" in request.query_params:
                if "type" in request.query_params and request.query_params["type"] == "iexact":
                    filtered_queryset = self.get_queryset().filter(**{"extra_fields__" + request.query_params["extra_fields"] + "__iexact":request.query_params["search"]})
                else:
                    filtered_queryset = filtered_queryset | self.get_queryset().filter(**{"extra_fields__" + request.query_params["extra_fields"] + "__icontains":request.query_params["search"]})
            pagination_data = None
            page = self.paginate_queryset(filtered_queryset)

            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True)
            context = {"success": True, "message": _("External Users data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} External Users data returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 23050
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_users.add_externaluser", ]))
    # @method_decorator(license_required(["org_users.add_externaluser", ]))
    def create(self, request, tenant=None):
        # import ipdb; ipdb.set_trace()
        logger.info("requested to create External User for tenant: {}.".format(tenant))                                                                           
        try:
            request_data = request.data.copy()
            request_data["tenant"] = tenant
            if 'email' in request_data :
                if request_data['email'] == '':
                    request_data['email'] = request_data['mobile'][1:] + "@ezedox.com"
                else:
                    request_data['email'] = request_data['email'].lower()
            request_data['password'] = get_random_string(length=8)
            request_data["userId"] = request_data['email'].lower()
            existing_org_user_email=OrganisationUser.default_manager.filter(email__iexact = request_data['email'], tenant=tenant).exists()
            if existing_org_user_email:
                internal_error = 23051
                error_message = getMessage(org_users_errors, internal_error)
                context = {"success": False, "message": _(error_message), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_403_FORBIDDEN)
            existing_email_id = ExternalUser.objects.filter(email__iexact = request_data['email'], tenant=tenant).exists()
            existing_phone_number = ExternalUser.objects.filter(mobile = request_data['mobile'], tenant=tenant).exists()
            if existing_email_id and existing_phone_number:
                internal_error = 23052
                context = {"success": False, "message": _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_409_CONFLICT)
            if existing_email_id:
                existing_user_obj = ExternalUser.objects.filter(email__iexact = request_data['email'], tenant=tenant)[0]
                serializer = self.serializer_class(existing_user_obj, data=request_data, partial=True)
                if serializer.is_valid():
                    obj = serializer.save()
                    context = {"success": True, "message": _("External user updated successfully."), "data": self.serializer_class(obj).data}
                    logger.info("{} External user updated successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                    return Response(context, status=status.HTTP_200_OK)
                else:
                    internal_error = 23088
                    context = {'error': get_custom_field_errors(serializer.errors), "success": False, "message": _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", context), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = self.create_serializer_class(data=request_data)

            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _("External user created successfully."), "data": self.serializer_class(obj).data}
                logger.info("{} External user created successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 23053
            context = {'error': get_custom_field_errors(serializer.errors), "success": False, "message": _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", context), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 23054
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_users.view_externaluser", ]))
    def retrieve(self, request, pk=None, tenant=None):
        logger.info("{} requested to retrieve External User for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 23055
                context = {'error': str(error), 'success': False, 'message': getMessage(org_users_errors, internal_error), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {"success": True, "message": _("External User details retrieved successfully"), "data": serializer.data}
            logger.info("{} External User details retrieved successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 23056
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_users.change_externaluser", ]))
    def partial_update(self, request, pk=None, tenant=None):
        logger.info("{} requested to update External User for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 23057
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            if 'extra_fields' in request.data:
                extra_field_data = obj.extra_fields.copy()
                extra_field_data.update(request.data['extra_fields'])
                request.data['extra_fields'] = extra_field_data
            serializer = self.serializer_class(obj, data=request.data, partial=True, fields=('email', 'first_name', 'last_name', 'mobile', 'gender','extra_fields'))
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _("External User details updated successfully."), "data": self.serializer_class(obj).data}
                logger.info("{} External User details updated successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 23058
            context = {'error': get_custom_field_errors(serializer.errors), "success": False, "message": _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, context), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 23059
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_users.delete_externaluser", ]))
    def destroy(self, request, pk=None, tenant=None):
        logger.info("{} requested to delete External User for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 23060
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            self.perform_destroy(obj)

            context = {"success": True, "message": _("External User deleted successfully"), "data": None}
            logger.info("{} External User deleted successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)

        except Exception as error:
            internal_error = 23061
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None):
        context = {'error': '', 'success': False, 'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=False, methods=['post'], name='external_user_authorizer')
    def authorize(self, request, tenant=None):
        logger.info("requested, External User Authorizer for tenant: {}.".format(tenant))
        logger.info(request.data)
        logger.info(request.headers)
        try:
            if request.user.is_anonymous:
                context = {'Authorization token not passed'}
                return Response(context, status=status.HTTP_401_UNAUTHORIZED)
            elif request.user.is_authenticated:
                context = {'User Authorization successful'}
                return Response(context, status=status.HTTP_200_OK)
            else:
                context = {'User Authorization Failed'}
                return Response(context, status=status.HTTP_403_FORBIDDEN)
        except Exception as error:
            context = {'User Authorization Failed'}
            return Response(context, status=status.HTTP_403_FORBIDDEN)
        
class ExternalUserOTP(CreateAPIView):
    permission_classes = [AllowAny]
    model = ExternalUser
    serializer_class = ExternalUserOTPSerializer

    def post(self, request, tenant=None):
        logger.info("requested to send External User OTP for tenant: {}.".format(tenant))
        try:
            if not('mobile' in request.data or 'email' in request.data):
                internal_error = 23062
                context = {'error': "Invalid input", 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            if request.data.get('mobile',None):
                user_obj = ExternalUser.objects.filter(mobile=request.data['mobile'], tenant__id=tenant)
            else:
                user_obj = ExternalUser.objects.filter(email=request.data['email'], tenant__id=tenant)

            if not user_obj:
                internal_error = 23063
                context = {'error': _("User with this mobile number or email does not exist"), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            if len(user_obj) > 1 and ('email' not in request.data or not request.data['email']):
                internal_error = 23064
                serializer = self.serializer_class(user_obj, many=True, fields=('email',))
                context = {'error': _("More than one user with this mobile number exists"), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getMessage(org_users_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_409_CONFLICT)
            otp_via_sms_only = False
            otp_via_email_only = False
            success_response_message = "OTP is sent your email and mobile successfully."
            if len(user_obj) > 1 and request.data['email']:
                user_obj = ExternalUser.objects.filter(mobile=request.data['mobile'], email=request.data['email'])

                if not user_obj:
                    internal_error = 23065
                    context = {'error': _("User does not exists"), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_users_errors, internal_error), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
                # OTP is sent only via email if more than one user uses the same mobile number.
                otp_via_email_only = False
                success_response_message = "OTP is sent your email successfully."

            user_obj = user_obj.first()
            if user_obj.email == request.data['mobile'][1:] + "@ezedox.com":
                otp_via_sms_only = True
                success_response_message = "OTP is sent your mobile successfully."

            if FAKE_SMS:
                generated_OTP = "123456"
            else:
                generated_OTP = get_random_string(length=6, allowed_chars='0123456789')
            if not otp_via_email_only or otp_via_sms_only:
                PhoneNumber=user_obj.mobile
                sms_body = {
                    "type" : "SMS",
                    "subject": "",
                    "templateId" : KALEYRA_OTP_TEMPLATE_ID,
                    "phoneNumber" : str(PhoneNumber),
                    "otp" : generated_OTP,
                    "orgName" : user_obj.tenant.name if user_obj.tenant.name else ""
                }
                send_notification(sms_body, 'SMS', "", KALEYRA_OTP_TEMPLATE_ID, attachments=[])
                # response = send_otp_v5(PhoneNumber, TENANT="Demo", OTP=str(generated_OTP))
                # if not response.data['success']:
                #     internal_error = 23066
                #     context = {"success": False, "message": _(getMessage(org_users_errors, internal_error)), "internal_error": internal_error, "error": response.data['error']}
                #     logger.error(getLogMessage(org_users_errors, internal_error).format(context), internal_error)
                #     return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            user_obj.set_password(generated_OTP)
            user_obj.otp_expiration_time = datetime.datetime.now() + datetime.timedelta(seconds=OTP_EXPIRATION_TIME)
            user_obj.save()
            if not otp_via_sms_only:
                send_otp_email(user_obj,tenant,Organisation.objects.get(id=tenant).name,generated_OTP)
            context = {"success": True, "message": _(success_response_message), "data": None}
            logger.info("External User OTP send successfully")
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 23067
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExternalUserLogin(CreateAPIView):
    permission_classes = [AllowAny]
    model = ExternalUser
    serializer_class = ExternalUserDynamicFieldsModelSerializer
    list_serializer_class = ExternalUserSerializer

    def post(self, request, tenant=None):
        logger.info("requested, External User Login for tenant: {}.".format(tenant))
        try:
            if not('mobile' in request.data or 'email' in request.data):
                context = {'error': "Invalid input", 'success': False, 'message': _('Mobile number is required.')}
                logger.error("Mobile number is required.")
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            if request.data.get('mobile', None):
                user_obj = ExternalUser.objects.filter(mobile=request.data['mobile'], tenant__id=tenant)
            else:
                user_obj = ExternalUser.objects.filter(email=request.data['email'], tenant__id=tenant)

            if not user_obj:
                internal_error = 23068
                context = {'error': "User with this mobile number or email address does not exist", 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getMessage(org_users_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            if len(user_obj) > 1 and ('email' not in request.data or not request.data['email']):
                internal_error = 23069
                serializer = self.serializer_class(user_obj, many=True, fields=('email',))
                context = {'error': "More than one user with this mobile number exists", 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error, 'data': serializer.data}
                logger.error(getMessage(org_users_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            if len(user_obj) > 1 and request.data['email']:
                user_obj = ExternalUser.objects.filter(mobile=request.data['mobile'], email=request.data['email'], tenant__id=tenant)

                if not user_obj:
                    internal_error = 23070
                    context = {'error': "User does not exists", 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_users_errors, internal_error), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)

            user_obj = user_obj.first()

            if datetime.datetime.now().timestamp() > user_obj.otp_expiration_time.timestamp():
                context = {'error': "OTP has expired", 'success': False, 'message': _('Your OTP has expired, please regenrate OTP')}
                logger.error("Your OTP has expired, please regenrate OTP")
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            email = user_obj.email
            password = request.data['password']

            user = authenticate(username=email, password=password)

            if user is not None:
                if not user.is_active:
                    internal_error = 23071
                    message = _(getMessage(org_users_errors, internal_error))
                    context = {'success': False, 'message': message, 'error': '', 'internal_error': internal_error}
                    logger.error(getMessage(org_users_errors, internal_error), internal_error)
                    return Response(context, status.HTTP_400_BAD_REQUEST)

                try:
                    external_user_details = self.model.objects.get(email=email)
                except:
                    internal_error = 23072
                    message = _(getMessage(org_users_errors, internal_error))
                    context = {'success': False, 'message': message, 'error': '', 'internal_error': internal_error}
                    logger.error(getMessage(org_users_errors, internal_error), internal_error)
                    return Response(context, status.HTTP_400_BAD_REQUEST)

                payload = jwt_payload_handler(user)
                token = jwt_encode_handler(payload)
                expiration = datetime.datetime.utcnow() + settings.JWT_AUTH['JWT_EXPIRATION_DELTA']
                expiration_epoch = expiration.timestamp()

                # Resetting the password so that user cannot re-use this password in other device
                reset_OTP = get_random_string(length=8)
                user.set_password(reset_OTP)
                user.otp_expiration_time = datetime.datetime.now()
                user.save()

                message = _('OTP validated successfully')
                context = {'success': True, 'message': message, 'token_expiration': expiration_epoch, 'token': token, 'error': '', 'data': self.list_serializer_class(external_user_details).data}
                logger.info("OTP validated successfully for tenant: {}".format(tenant))
                return Response(context, status.HTTP_200_OK)
            else:
                internal_error = 23073
                message = _(getMessage(org_users_errors, internal_error))
                context = {'success': False, 'message': message, 'error': '', 'internal_error': internal_error}
                logger.error(getMessage(org_users_errors, internal_error), internal_error)
                return Response(context, status.HTTP_400_BAD_REQUEST)

        except Exception as error:
            internal_error = 23074
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GetCredentialsView(CreateAPIView):
    permission_classes = [AllowAny]
    model = OrganisationUser
    serializer_class = EmptySerializer
    def create(self, request, pk=None, tenant=None):
        try:
            obj = self.model.default_manager.get(id=request.data['instance_id'],tenant__id=tenant)
            org_license = OrganisationLicense.objects.get(organisation__id=tenant)
            hashed_password = password_hash(obj.userId)
            username = base64.b64encode(bytes(obj.userId, 'utf-8')).decode("utf-8")
            base_org_domain_url = BASE_ORG_DOMAIN_URL
            data = {}
            data['designer_url'] = org_license.process_modeler
            data['username'] = username
            data['password'] = hashed_password
            data['token'] = "dummy"
            data['idm_url'] = org_license.process_idm[:-4] + "app/authentication"
            data['platform_url'] = "https://" + base_org_domain_url
            context = {'success': True, 'data' : data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 23075
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SendOtpViewSet(CreateAPIView):
    permission_classes = [HasAPIKey]
    model = None
    queryset = None
    serializer_class = None

    def create(self, request, tenant=None):
        try:
            request_data = request.data.copy()

            mobile = request_data.get('mobile','')
            otp = request_data.get('otp','')
            resend = request_data.get('resend','')

            if not mobile:
                internal_error = 23076
                context = {"success": False, "message": _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            if otp:
                return verify_otp(mobile, otp)
            if resend:
                return resend_otp(mobile)
            return only_send_otp(mobile)
        except Exception as error:
            internal_error = 23077
            context = {'error': str(error), "success": False, "message": _(getMessage(org_users_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OpenExternalUserOTP(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = OpenExternalUser
    serializer_class = OpenExternalUserSerializer
    create_serializer_class = OpenExternalUserDynamicFieldsModelSerializer

    @action(detail=False, methods=['post'], name="send_otp")
    def send_otp(self, request, tenant=None):
        logger.info("requested to register and send Open External User OTP for tenant: {}.".format(tenant))
        try:
            if not 'mobile' in request.data or not request.data['mobile']:
                internal_error = 23090
                context = {'error': "Invalid input", 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
                
            if not str(request.data['mobile']).startswith("+91"):
                if len(str(request.data['mobile'])) > 10:
                    request.data['mobile'] = "+" + str(request.data['mobile'])
                else:
                    request.data['mobile'] = "+91" + str(request.data['mobile'])

            request_data = request.data.copy()
            request_data["tenant"] = tenant
            request_data['first_name'] = "dummy_signup"
            
            request_data['email'] = request_data['mobile'][1:] + "@ezedoxsignup.com"
            request_data['password'] = get_random_string(length=8)
            request_data["userId"] = request_data['email'].lower()
            existing_org_user_email=OrganisationUser.default_manager.filter(email__iexact = request_data['email'], tenant=tenant).exists()
            existing_email_id = OpenExternalUser.objects.filter(email__iexact = request_data['email'], tenant=tenant).exists()
            if existing_org_user_email:
                internal_error = 23104
                error_message = getMessage(org_users_errors, internal_error)
                context = {"success": False, "message": _(error_message), 'internal_error': internal_error}
                logger.error(getLogMessage(org_users_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_403_FORBIDDEN)
            existing_email_id = OpenExternalUser.objects.filter(email__iexact = request_data['email'], tenant=tenant).exists()

            success_response_message = "OTP is sent your email and mobile successfully."
            if existing_email_id:
                existing_user_obj = OpenExternalUser.objects.filter(email__iexact = request_data['email'], tenant=tenant)[0]
                serializer = self.serializer_class(existing_user_obj, data=request_data, partial=True)
                if serializer.is_valid():
                    obj = serializer.save()
                    logger.info("{} External user updated successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                else:
                    internal_error = 23088
                    context = {'error': get_custom_field_errors(serializer.errors), "success": False, "message": _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", context), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            else:
                serializer = self.create_serializer_class(data=request_data)

                if serializer.is_valid():
                    obj = serializer.save()
                    logger.info("{} External user created successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                else:
                    internal_error = 23106
                    context = {'error': get_custom_field_errors(serializer.errors), "success": False, "message": _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_users_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", context), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)

            if obj.email == request.data['mobile'][1:] + "@ezedoxsignup.com":
                success_response_message = "OTP is sent your mobile successfully."
                generated_OTP = None
            if FAKE_SMS:
                generated_OTP = "123456"
            else:
                generated_OTP = get_random_string(length=6, allowed_chars='0123456789')
            PhoneNumber=request.data['mobile']
            response = send_otp_v5(PhoneNumber, TENANT="Demo", OTP=str(generated_OTP))
            if not response.data['success']:
                internal_error = 23107
                context = {"success": False, "message": _(getMessage(org_users_errors, internal_error)), "internal_error": internal_error, "error": response.data['error']}
                logger.error(getLogMessage(org_users_errors, internal_error).format(context), internal_error)
                return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            obj.set_password(generated_OTP)
            obj.otp_expiration_time = datetime.datetime.now() + datetime.timedelta(seconds=OTP_EXPIRATION_TIME)
            obj.save()
            context = {"success": True, "message": _(success_response_message), "data": None}
            logger.info("External User OTP send successfully")
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 23093
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ExternalUserOpenLogin(CreateAPIView):
    permission_classes = [AllowAny]
    model = OpenExternalUser
    serializer_class = OpenExternalUserDynamicFieldsModelSerializer
    list_serializer_class = OpenExternalUserSerializer

    def post(self, request, tenant=None):
        logger.info("requested, External Open User Login for tenant: {}.".format(tenant))
        try:
            if not 'mobile' in request.data or not request.data['mobile']:
                context = {'error': "Invalid input", 'success': False, 'message': _('Mobile number is required.')}
                logger.error("Mobile number is required.")
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            user_obj = OpenExternalUser.objects.filter(mobile=request.data['mobile'], tenant__id=tenant)

            if not user_obj:
                internal_error = 23097
                context = {'error': "User with this mobile number does not exist", 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getMessage(org_users_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            if len(user_obj) > 1 and ('email' not in request.data or not request.data['email']):
                internal_error = 23098
                serializer = self.serializer_class(user_obj, many=True, fields=('email',))
                context = {'error': "More than one user with this mobile number exists", 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error, 'data': serializer.data}
                logger.error(getMessage(org_users_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            if len(user_obj) > 1 and request.data['email']:
                user_obj = OpenExternalUser.objects.filter(mobile=request.data['mobile'], email=request.data['email'], tenant__id=tenant)

                if not user_obj:
                    internal_error = 23099
                    context = {'error': "User does not exists", 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_users_errors, internal_error), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)

            user_obj = user_obj.first()

            if datetime.datetime.now().timestamp() > user_obj.otp_expiration_time.timestamp():
                context = {'error': "OTP has expired", 'success': False, 'message': _('Your OTP has expired, please regenrate OTP')}
                logger.error("Your OTP has expired, please regenrate OTP")
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            email = user_obj.email
            password = request.data['password']

            user = authenticate(username=email, password=password)

            if user is not None:
                if not user.is_active:
                    internal_error = 23100
                    message = _(getMessage(org_users_errors, internal_error))
                    context = {'success': False, 'message': message, 'error': '', 'internal_error': internal_error}
                    logger.error(getMessage(org_users_errors, internal_error), internal_error)
                    return Response(context, status.HTTP_400_BAD_REQUEST)

                try:
                    external_user_details = self.model.objects.get(email=email)
                except:
                    internal_error = 23101
                    message = _(getMessage(org_users_errors, internal_error))
                    context = {'success': False, 'message': message, 'error': '', 'internal_error': internal_error}
                    logger.error(getMessage(org_users_errors, internal_error), internal_error)
                    return Response(context, status.HTTP_400_BAD_REQUEST)

                payload = jwt_payload_handler(user)
                token = jwt_encode_handler(payload)
                expiration = datetime.datetime.utcnow() + settings.JWT_AUTH['JWT_EXPIRATION_DELTA']
                expiration_epoch = expiration.timestamp()

                # Resetting the password so that user cannot re-use this password in other device
                reset_OTP = get_random_string(length=8)
                user.set_password(reset_OTP)
                user.otp_expiration_time = datetime.datetime.now()
                user.save()

                message = _('OTP validated successfully')
                context = {'success': True, 'message': message, 'token_expiration': expiration_epoch, 'token': token, 'error': '', 'data': self.list_serializer_class(external_user_details).data}
                logger.info("OTP validated successfully for tenant: {}".format(tenant))
                headers = {'Content-Type': 'application/json'}

                mobile = request.data['mobile']
                if str(mobile).startswith("+91"):
                    mobile = mobile.split("+91")[1]

                dedup_url = "{0}://{1}/{2}/{3}/{4}?mobileNumber={5}".format(settings.DEFAULT_SCHEME, settings.BASE_ORG_DOMAIN_URL, "api/customer-mgmt/org", tenant ,"deDupCheck" , mobile)
                dedup_response = requests.request("GET", dedup_url, headers=headers)
                logger.info(dedup_url)
                if dedup_response and dedup_response.status_code == 200 and dedup_response.json() == {}:
                    return Response(context, status=status.HTTP_200_OK)
                else:
                    internal_error = 23108
                    logger.info("Employee already present with provided mobile number in platform.")
                    context = {'success': False, "message": _(getMessage(org_users_errors, internal_error)), "internal_error": internal_error}
                    logger.exception(getLogMessage(org_users_errors, internal_error).format(str(dedup_response.json())), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            else:
                internal_error = 23102
                message = _(getMessage(org_users_errors, internal_error))
                context = {'success': False, 'message': message, 'error': '', 'internal_error': internal_error}
                logger.error(getMessage(org_users_errors, internal_error), internal_error)
                return Response(context, status.HTTP_400_BAD_REQUEST)

        except Exception as error:
            internal_error = 23103
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PlatformPolicyViewset(viewsets.ModelViewSet):
    models = PlatformPolicy
    queryset = PlatformPolicy.objects.all()
    serializer_class = PlatformPolicySerializer
    permission_classes = [AllowAny]

    def list(self, request, tenant=None):
        logger.info("{} requested the list of Policy.".format(request.user.email))
        try:
            serializer = self.serializer_class(self.filter_queryset(self.get_queryset().filter(tenant__id=tenant, relation="MY_ORG").order_by('name')), many=True)
            context = {"success": True, "message": _("Policy data returned successfully."), "data": serializer.data, "count": self.get_queryset().filter(tenant__id=tenant).count()}
            logger.info("{} Policy data returned successfully.".format(request.user.email))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 23109
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_users_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_users_errors, internal_error).format(request.user.email, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)