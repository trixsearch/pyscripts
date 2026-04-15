# Third-Party imports
from django.utils.decorators import method_decorator
from django.utils.translation import gettext as _
from django.db.models import Q
from django.db import IntegrityError
from rest_framework import status, viewsets, filters
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from django_filters.rest_framework import DjangoFilterBackend

from utils.prime_generic_methods import get_custom_field_errors
from utils.loggerwrapper import Logger, getMessage, getLogMessage
from utils.CustomSearch import CustomSearchFilter, get_filter_fields
from apps.org_users.models import OrganisationUser
from apps.organisations.models import Organisation
from apps.org_users.serializers import OrganisationUserBasicDetailsSerializer
from apps.license.decorators import permission_and_license_required
from apps.org_config.models import CustomAttribute
# Application imports
from .models import DepartmentDetail
from .serializers import (DepartmentDetailSerializer,
                          ListDepartmentDetailSerializer)
from .internal_errors import org_department_errors
from .filters import DepartmentDetail_filter_fields, DepartmentDetail_search_fields

logger = Logger(__name__)
class DepartmentDetailViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = DepartmentDetail
    queryset = DepartmentDetail.objects.all()
    serializer_class = DepartmentDetailSerializer
    list_serializer_class = ListDepartmentDetailSerializer
    list_user_serializer_class = OrganisationUserBasicDetailsSerializer
    lookup_field = 'department_id'
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = DepartmentDetail_search_fields
    filter_fields = get_filter_fields(DepartmentDetail_filter_fields)
    ordering_fields = DepartmentDetail_search_fields


    # def get_permissions(self):
    #     if self.action == 'list' or self.action == 'retrieve' or self.action == 'getusers':
    #         permission_classes = [has_open_access_or_has_api_key_access_or_is_authenticated]
    #         return [permission([]) for permission in permission_classes]
    #     return super().get_permissions()
    
    def get_queryset(self):
        qs = DepartmentDetail.objects.all()
        for item in self.request.query_params.keys():
            if item.startswith("department__extra_fields"):
                value = self.request.query_params[item]
                custom_item = CustomAttribute.objects.get(type="departments").custom_attribute['components']
                for item_data in custom_item:
                    if item_data["key"] == item.split("__")[-1] and item_data["type"] == "number":
                        value = int(value)
                qs = qs.filter(**{item:value})
        if 'ordering' in self.request.query_params.keys() and (self.request.query_params['ordering'].startswith("department__extra_fields") or self.request.query_params['ordering'][1:].startswith("department__extra_fields")):
            qs = qs.order_by(self.request.query_params['ordering'])
        return qs

    def list(self, request, tenant=None):
        logger.info("{} requested the list of departments for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        filtered_queryset = None
        try:
            filtered_queryset = self.filter_queryset(self.get_queryset().filter(department__tenant__id=tenant))
            pagination_data = None
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.list_serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.list_serializer_class(filtered_queryset, many=True)
            context = {
                "success": True, "message": _("Departments returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} Departments returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,
                       'message': _('Organisation department data returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 9001
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_department_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_department_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_department.add_departmentdetail", "org_department.add_department", ]))
    def create(self, request, tenant=None):
        logger.info("{} send data to create departments  for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            req_data = request.data.copy()
            req_data["department"]["tenant"] = tenant
            serializer = self.serializer_class(data=req_data)
            if serializer.is_valid():
                try:
                    obj = serializer.save()
                    context = {
                        "success": True, "message": _("Department added successfully."), "data": self.list_serializer_class(obj).data}
                    logger.info("{} Department added successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                    return Response(context, status=status.HTTP_200_OK)
                except IntegrityError as error:
                    internal_error = 9014
                    context = {'error':str(error), "success": False, "message": getMessage(org_department_errors, internal_error), "internal_error": internal_error}
                    logger.error(getLogMessage(org_department_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            internal_error = 9002
            err_message = getMessage(org_department_errors, internal_error)
            if 'department' in get_custom_field_errors(serializer.errors):
                err_message = get_custom_field_errors(serializer.errors)['department']['name']
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": err_message, "internal_error": internal_error}
            logger.error(getLogMessage(org_department_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 9003
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_department_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_department_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", internal_error))
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, department_id=None, tenant=None):
        logger.info("{} requested to retrieve department for id: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", department_id))
        try:
            try:
                obj = self.model.objects.get(department__tenant__id=tenant, department__id=department_id)
            except Exception as error:
                internal_error = 9004
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_department_errors, internal_error))}
                logger.error(getLogMessage(org_department_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", department_id, error))
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.list_serializer_class(obj)
            context = {
                "success": True, "message": _("Department retrieved successfully."), "data": serializer.data}
            logger.info("{} Department retrieved successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", department_id, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 9005
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_department_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_department_errors, internal_error).format(request.data.email, department_id, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], name="get_users_dept")
    def getusers(self, request, department_id=None, tenant=None):
        logger.info("{} requested to retrieve users of given departments for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            try:
                if "dept_name" in request.query_params:
                    obj = self.model.objects.get(department__tenant__id=tenant, department__name=request.query_params["dept_name"])
                else:
                    internal_error = 9006
                    context = {'success': False, 'message': _(getMessage(org_department_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_department_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            except Exception as error:
                internal_error = 9007
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_department_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_department_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            usr_obj = OrganisationUser.default_manager.filter(Q(department=obj.department.id) | Q(id=obj.head.id)).order_by('first_name')
            serializer = self.list_user_serializer_class(usr_obj, many=True)
            context = {
                "success": True, "message": _("Users for given Department retrieved successfully."), "data": serializer.data}
            logger.info("{} Users for given Department retrieved successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 9008
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_department_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_department_errors, internal_error).format(request.data.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_department.change_departmentdetail", "org_department.change_department", ]))
    def update(self, request, department_id=None, tenant=None):
        logger.info("{} requested to update department for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", department_id, tenant))
        try:
            try:
                obj = self.model.objects.get(department__tenant__id=tenant, department__id=department_id)
            except Exception as error:
                internal_error = 9009
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_department_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_department_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", department_id, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            req_data = request.data.copy()
            req_data["department"]["tenant"] = tenant
            serializer = self.serializer_class(obj, data=req_data, partial=True)
            if serializer.is_valid():
                try:
                    serializer.save()
                    context = {
                        "success": True, "message": _("Department updated successfully."), "data": self.list_serializer_class(obj).data}
                    logger.info("{} Department updated successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", department_id, tenant))
                    return Response(context, status=status.HTTP_200_OK)
                except IntegrityError as error:
                    internal_error = 9015
                    context = {'error': str(error), "success": False, "message": "Department with this name already exists."}
                    # logger.error("{} Failed to update Department Details for id {}, due to: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", department_id, error))
                    logger.error(getLogMessage(org_department_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", department_id, error), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            internal_error = 9010
            err_message = getMessage(org_department_errors, internal_error)
            if 'department' in get_custom_field_errors(serializer.errors):
                err_message = get_custom_field_errors(serializer.errors)['department']['name']
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": err_message, "internal_error": internal_error}
            logger.error(getLogMessage(org_department_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", department_id, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 9011
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_department_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_department_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", department_id, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_department.delete_departmentdetail", "org_department.delete_department", ]))
    def destroy(self, request, department_id=None, tenant=None):
        logger.info("{} requested to delete department for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", department_id, tenant))
        try:
            try:
                obj = self.model.objects.get(department__tenant__id=tenant, department__id=department_id)
            except Exception as error:
                internal_error = 9012
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_department_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_department_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", department_id, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            department_org_users =OrganisationUser.default_manager.filter(department=department_id)
            if department_org_users:
                context = {'error': None, "success": False, "message": _("Please remove your organisation users from this department and then delete it.")}
                logger.warning("{} organisation user can not be deleted if he is in a department, user needed to be removed from department before deletion.".format(request.user.email))
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            department = obj.department
            self.perform_destroy(obj)
            department.delete()

            context = {
                "success": True, "message": _("Department deleted successfully."), "data": None}
            logger.info("{} Department deleted successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", department_id, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 9013
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_department_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_department_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", department_id, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
