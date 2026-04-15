import json

from django.utils.translation import gettext as _
from django.utils.decorators import method_decorator
from django.db import IntegrityError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets,filters
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_api_key.permissions import HasAPIKey
from rest_framework.exceptions import NotFound
from apps.org_apps.utils import get_uploaded_file
from apps.license.decorators import permission_and_license_required, license_required
from apps.org_config.models import CustomAttribute
from apps.organisations.models import Organisation
from utils.prime_generic_methods import get_custom_field_errors
from utils.loggerwrapper import Logger, getMessage, getLogMessage
from utils.CustomSearch import CustomSearchFilter, get_filter_fields
from .serializers import OrganisationListsSerializer, OrganisationAdvancedListsSerializer
from .models import OrganisationLists, OrganisationAdvancedLists
from .utils import get_csv_data
from .internal_errors import org_list_errors
from .filters import OrganisationLists_filter_fields, OrganisationAdvancedLists_filter_fields
logger = Logger(__name__)

# Create your views here.
class OrganisationListsViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationLists
    queryset = OrganisationLists.objects.all()
    serializer_class = OrganisationListsSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = OrganisationLists_filter_fields
    filter_fields = get_filter_fields(OrganisationLists_filter_fields)
    ordering_fields = OrganisationLists_filter_fields

    # def get_permissions(self):
    #     if self.action == 'list':
    #         permission_classes = [has_open_access_or_has_api_key_access_or_is_authenticated]
    #         return [permission([]) for permission in permission_classes]
    #     return super().get_permissions()

    # @method_decorator(permission_and_license_required(["org_lists.add_organisationlists", ]))
    def create(self, request, tenant=None, **args):
        logger.info("{} send the supply data to Organisation List for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            req_data = request.data.copy()
            req_data["tenant"] = tenant
            serializer = self.serializer_class(data=req_data)
            if serializer.is_valid():
                try:
                    obj = serializer.save()
                    context = {"success": True, "message": _(
                        "Lists has been added successfully."), "data": self.serializer_class(obj).data}
                    logger.info("{} Lists has been added successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                    return Response(context, status=status.HTTP_200_OK)
                except IntegrityError as error:
                    internal_error = 16001
                    context = {'error':str(error), "success": False, "message": getMessage(org_list_errors, internal_error), "internal_error": internal_error}
                    logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            internal_error = 16002
            err_message = getMessage(org_list_errors, internal_error)
            errors = get_custom_field_errors(serializer.errors)
            if 'key' in get_custom_field_errors(serializer.errors):
                err_message = get_custom_field_errors(serializer.errors)['key']
            if 'non_field_errors' in errors and errors['non_field_errors'].code == 'unique':
                errors['non_field_errors'] = 'Key must be unique.'
                err_message = 'Failed to add list, key must be unique.'
            context = {'error': errors, "success": False, "message": err_message, "internal_error": internal_error}
            logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 16003
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(license_required(["org_lists.view_organisationlists", ]))
    def list(self, request, tenant=None):
        logger.info("{} requested the list of Organisation List for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        filtered_queryset = None
        
        try:
            name = self.request.query_params.get('name', None)
            key = self.request.query_params.get('key', None)
            if name == "":
                context = {
                    "success": True, "data": []}
                logger.info("{} Lists details returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                return Response(context, status=status.HTTP_200_OK)
            if key == "":
                context = {
                    "success": True, "data": []}
                logger.info("{} Lists details returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                return Response(context, status=status.HTTP_200_OK)
            filtered_queryset =  self.filter_queryset(self.get_queryset().filter(tenant__id=tenant))
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(
                    serializer.data)
            else:
                serializer = self.serializer_class(
                    self.filter_queryset(self.get_queryset().filter(tenant__id=tenant)), many=True)
            context = {
                "success": True, "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} Lists details returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,
                       'message': _('Organisation lists data returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 16004
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_lists.change_organisationlists", ]))
    def update(self, request, tenant=None, pk=None):
        logger.info("{} requested to update of Organisation List for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(tenant__id=tenant, id=pk)
            except Exception as error:
                internal_error = 16005
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj, data=request.data, partial=True)
            if serializer.is_valid():
                try:
                    serializer.save()
                    context = {"success": True, "message": _("Lists details updated successfully"), "data": self.serializer_class(obj, fields=('id', 'name', 'description')).data}
                    logger.info("{} Lists details updated successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
                    return Response(context, status=status.HTTP_200_OK)
                except IntegrityError as error:
                    internal_error = 16006
                    context = {'error': str(error), "success": False, "message": getMessage(org_list_errors, internal_error), "internal_error": internal_error}
                    logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            internal_error = 16007
            err_message = getMessage(org_list_errors, internal_error)
            if 'key' in get_custom_field_errors(serializer.errors):
                err_message = get_custom_field_errors(serializer.errors)['key']
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": err_message, "internal_error": internal_error}
            logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 16008
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_lists.view_organisationlists", ]))
    def retrieve(self, request, tenant=None, pk=None):
        logger.info("{} requested to retrieve of Organisation List for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(tenant__id=tenant, id=pk)
            except Exception as error:
                internal_error = 16009
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {"success": True, "message": _(
                "Lists details retrieved successfully"), "data": serializer.data}
            logger.info("{} Lists details retrieved successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 16010
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_lists.delete_organisationlists", ]))
    def destroy(self, request, tenant=None, pk=None):
        logger.info("{} requested to delete of Organisation List for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try: # pylint: disable=too-many-nested-blocks
            try:
                obj = self.model.objects.get(tenant__id=tenant, id=pk)
            except Exception as error:
                internal_error = 16011
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            custom_attribute = CustomAttribute.objects.filter(tenant__id=tenant)
            if custom_attribute.exists():
                for custom_attribute_data in custom_attribute:
                    cus_att = custom_attribute_data.custom_attribute['components']
                    for cus_data in cus_att:
                        cus_list_id = cus_data['list_type']
                        if cus_list_id:
                            if cus_list_id == pk:
                                internal_error = 16012
                                context = {"success": False, "message": _(getMessage(org_list_errors, internal_error)), "internal_error": internal_error}
                                logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk), internal_error)
                                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            obj.delete()
            context = {
                "success": True, "message": _("Lists details deleted successfully"), "data": None}
            logger.info("{} Lists details deleted successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 16013
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrganisationAdvancedListsViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationAdvancedLists
    queryset = OrganisationAdvancedLists.objects.all()
    serializer_class = OrganisationAdvancedListsSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = OrganisationAdvancedLists_filter_fields
    filter_fields = get_filter_fields(OrganisationAdvancedLists_filter_fields)
    ordering_fields = OrganisationAdvancedLists_filter_fields

    # def get_permissions(self):
    #     if self.action == 'list' or self.action == 'query':
    #         permission_classes = [has_open_access_or_has_api_key_access_or_is_authenticated]
    #         return [permission([]) for permission in permission_classes]
    #     return super().get_permissions()

    # @method_decorator(permission_and_license_required(["org_lists.add_organisationlists", ]))
    def create(self, request, tenant=None, **args):
        logger.info("Organisation Advanced List creation requested by {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            req_data = request.data.copy()
            req_data["tenant"] = tenant
            serializer = self.serializer_class(data=req_data)
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _(
                    "Lists has been added successfully."), "data": self.serializer_class(obj).data}
                logger.info("{} Lists has been added successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                return Response(context, status=status.HTTP_200_OK)
            err_message = getMessage(org_list_errors, internal_error)
            errors = get_custom_field_errors(serializer.errors)
            if 'non_field_errors' in errors and errors['non_field_errors'].code == 'unique':
                errors['non_field_errors'] = 'Key must be unique.'
                err_message = 'Failed to add advanced list, key must be unique.'
            internal_error = 16014
            context = {'error': errors, "success": False, "message": err_message, "internal_error": internal_error}
            logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 16015
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_lists.add_organisationlists", ]))
    @action(detail=False, methods=['post'], name='advanced-lists-upload')
    def upload(self, request, tenant=None, **args):
        logger.info("Organisation Advanced List creation requested by {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            request_data = {}
            try:
                uploaded_file = request.FILES['file']
                request_data["name"] = request.data["name"]
                request_data["key"] = request.data["key"]
                request_data["lists"] = []
                request_data["tenant"] = tenant
            except Exception as error:
                internal_error = 16016
                context = {'error' : str(error), "success": False, "message": getMessage(org_list_errors, internal_error), "internal_error": internal_error}
                logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            if uploaded_file.name.endswith('.csv'):
                logger.info("Uploaded file is CSV.")
                csv_file_path = get_uploaded_file(uploaded_file)
                logger.info("csv_file_path: {}".format(csv_file_path))
            else:
                csv_file_path = None
                logger.info("Uploaded file is not CSV.")
                internal_error = 16017
                context = {'success' : False, "message" : getMessage(org_list_errors, internal_error), "error": "Uploaded file is not CSV.", "internal_error": internal_error}
                logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            request_data["lists"] = get_csv_data(csv_file_path)
            serializer = self.serializer_class(data=request_data)
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _(
                    "Lists has been added successfully."), "data": self.serializer_class(obj).data}
                logger.info("{} Lists has been added successfully.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 16018
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_list_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 16019
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(license_required(["org_lists.view_organisationlists", ]))
    def list(self, request, tenant=None):
        logger.info("{} requested the list of Organisation Advanced List for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try: # pylint: disable=too-many-nested-blocks
            if "search" in request.query_params and len(request.query_params)>1 and "page" not in request.query_params:
                search = self.request.query_params.get('search', None)
                if search == "":
                    context = {
                    "success": True, "message": _("Advanced Lists details returned successfully."), "data": []}
                    logger.info("{} Advanced Lists details returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                    return Response(context, status=status.HTTP_200_OK)

                query_params = request.query_params.copy()
                del query_params["search"]
                query_lists = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant))
                context = {}
                context["message"] = "Advanced Lists with search filter returned successfully."
                context["success"] = True
                if len(query_lists)>0:
                    query_lists = query_lists[0]
                    res_body = []
                    for items in query_lists.lists:
                        flag = 1
                        for it in query_params.keys():
                            try:
                                if query_params[it] == items[it]:
                                    pass
                                else:
                                    flag = 0
                            except :
                                flag = 0
                        if flag == 1:
                            res_body.append(items)
                    context["data"] = res_body
                else:
                    context["data"] = []
                return Response(context, status=status.HTTP_200_OK)
            filtered_queryset = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant))
            pagination_data = None
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(
                    serializer.data)
            else:
                serializer = self.serializer_class(
                    filtered_queryset, many=True)
            context = {
                "success": True, "message": _("Advanced Lists details returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} Lists details returned successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,
                       'message': _('Advanced Lists details returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 16020
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], name="advanced-lists-search")
    def query(self, request, tenant=None):
        try: # pylint: disable=too-many-nested-blocks
            req_data = json.loads(request.body.decode('utf-8'))
            if "search" in request.query_params:
                query_lists = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant))
                context = {}
                context["message"] = "Advanced Lists with search filter returned successfully."
                context["success"] = True
                data = req_data["query"]
                if len(query_lists)>0:
                    query_lists = query_lists[0]
                    res_body = []
                    for items in query_lists.lists:
                        flag = 1
                        for it in data.keys():
                            try:
                                if isinstance(data[it],str) and data[it] == items[it]:
                                    pass
                                elif isinstance(data[it],list) and ((set(data[it]) & set(items[it]))== set(data[it])):
                                    pass
                                else:
                                    flag = 0
                            except :
                                flag = 0
                        if flag == 1:
                            if 'fields' in req_data:
                                var_json = {}
                                for field in req_data["fields"]:
                                    var_json[field] = items[field]
                                res_body.append(var_json)
                            else:
                                res_body.append(items)
                    if "unique" in req_data and req_data["unique"]:
                        if len(req_data["fields"]) == 1:
                            res_body = { json_item[req_data["fields"][0]] : json_item for json_item in res_body }.values()
                        else:
                            context["message"] = "Unique list for more than 1 field cannot be retrieved"
                            context["success"] = False
                            return Response(context, status=status.HTTP_400_BAD_REQUEST)
                    context["data"] = res_body
                else:
                    context["data"] = []
                return Response(context, status=status.HTTP_200_OK)
            context = {"success" : True, "message" : _("Advanced Lists details returned successully"), "data": []}
            logger.info("{} Advanced Lists details returned successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 16020
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_lists.change_organisationlists", ]))
    def update(self, request, tenant=None, pk=None):
        logger.info("{} requested to update of Organisation List for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(tenant__id=tenant, id=pk)
            except Exception as error:
                internal_error = 16022
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {"success": True, "message": _("Advanced Lists details updated successfully"), "data": self.serializer_class(obj, fields=('id', 'name', 'description')).data}
                logger.info("{} Lists details updated successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 16023
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_list_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 16024
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_lists.change_organisationlists", ]))
    @action(detail=True, methods=['put'], name='advanced-lists-update-upload')
    def partial_update_upload(self, request, tenant=None, pk=None):
        logger.info("{} requested to update of Organisation List for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(tenant__id=tenant, id=pk)
            except Exception as error:
                internal_error = 16025
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            request_data = {}
            try:
                uploaded_file = request.FILES['file']
                request_data["name"] = obj.name
                request_data["key"] = obj.key
                request_data["lists"] = []
                request_data["tenant"] = tenant
            except Exception as error:
                internal_error = 16026
                context = {'error' : str(error), "success": False, "message": getMessage(org_list_errors, internal_error), "internal_error": internal_error}
                logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            if uploaded_file.name.endswith('.csv'):
                logger.info("Uploaded file is CSV.")
                csv_file_path = get_uploaded_file(uploaded_file)
                logger.info("csv_file_path: {}".format(csv_file_path))
            else:
                csv_file_path = None
                logger.info("Uploaded file is not CSV.")
                internal_error = 16027
                context = {'success' : False, "message" : getMessage(org_list_errors, internal_error), "error": "Uploaded file is not CSV.", "internal_error": internal_error}
                logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            request_data["lists"] = get_csv_data(csv_file_path)

            serializer = self.serializer_class(obj, data=request_data, partial=True)
            if serializer.is_valid():
                obj1 = serializer.save()
                context = {"success": True, "message": _("Advanced Lists details updated successfully"), "data": self.serializer_class(obj1).data}
                logger.info("{} Advanced Lists details updated successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 16028
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_list_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 16029
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_lists.view_organisationlists", ]))
    def retrieve(self, request, tenant=None, pk=None):
        logger.info("{} requested to retrieve of Organisation List for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(tenant__id=tenant, id=pk)
            except Exception as error:
                internal_error = 16030
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {"success": True, "message": _(
                " Advanced Lists details retrieved successfully"), "data": serializer.data}
            logger.info("{} Advanced Lists details retrieved successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 16031
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_lists.delete_organisationlists", ]))
    def destroy(self, request, tenant=None, pk=None):
        logger.info("{} requested to delete of Organisation Advanced List for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(tenant__id=tenant, id=pk)
            except Exception as error:
                internal_error = 16032
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            obj.delete()
            context = {
                "success": True, "message": _("Advanced Lists details deleted successfully"), "data": None}
            logger.info("{} Lists details deleted successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 16033
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_list_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_list_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
