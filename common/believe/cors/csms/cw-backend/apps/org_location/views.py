import io
import requests
import xlsxwriter
# Third-Party imports
from django.utils.decorators import method_decorator
from django.utils.translation import gettext as _
from django.http import HttpResponse
from django.db import IntegrityError
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from rest_framework.decorators import action
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend

# Application imports
from ezedox.settings import MEDIUM_PRIORITY_TASK
from apps.license.decorators import permission_and_license_required, license_required
from apps.org_users.models import OrganisationUser
from apps.org_location.utils import import_locations
from apps.org_config.models import CustomAttribute
from apps.org_apps.utils import xls_to_csv, get_uploaded_file
from apps.organisations.models import Organisation
from utils.prime_generic_methods import get_custom_field_errors
from utils.loggerwrapper import Logger, getMessage, getLogMessage
from utils.CustomSearch import CustomSearchFilter, get_filter_fields
from .models import Location
from .serializers import LocationSerializer
from .internal_errors import org_location_errors
from .filters import Location_filter_fields, Location_search_fields
from django.db.models import Q
from .utils import recursive_api_call
from ezedox.settings import PLATFORM_BASE_URL,PLATFORM_INTERNAL_TOKEN, SSL_VERIFICATION


logger = Logger(__name__)

class LocationViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = Location
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    lookup_field = 'location_id'
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = Location_search_fields
    filter_fields = get_filter_fields(Location_filter_fields)
    ordering_fields = Location_search_fields


    # def get_permissions(self):
    #     if self.action == 'list' or self.action == 'retrieve':
    #         permission_classes = [has_open_access_or_has_api_key_access_or_is_authenticated]
    #         return [permission([]) for permission in permission_classes]
    #     if self.action == 'create':
    #         permission_classes = [has_open_access_or_has_api_key_access_or_individual_permission]
    #         return [permission(["add_locationdetail", "add_location", ]) for permission in permission_classes]
    #     if self.action == 'partial_update':
    #         permission_classes = [has_open_access_or_has_api_key_access_or_individual_permission]
    #         return [permission(["change_locationdetail", "change_location", ]) for permission in permission_classes]
    #     if self.action == 'destroy':
    #         permission_classes = [has_open_access_or_has_api_key_access_or_individual_permission]
    #         return [permission(["delete_locationdetail", "delete_location", ]) for permission in permission_classes]
    #     if self.action == 'open':
    #         permission_classes = [AllowAny]
    #         return [permission() for permission in permission_classes]
    #     return super().get_permissions()
    
    def get_queryset(self, tenant=None):
        qs = Location.objects.filter(tenant__id=tenant)
        for item in self.request.query_params.keys():
            if item.startswith("extra_fields"):
                value = self.request.query_params[item]
                custom_item = CustomAttribute.objects.get(type="locations", tenant__id=tenant).custom_attribute['components']
                for item_data in custom_item:
                    if item_data["key"] == item.split("__")[-1] and item_data["type"] == "number":
                        value = int(value)
                qs = qs.filter(**{item:value})
            if item.startswith("location_type"):
                qs = qs.filter(Q(type__icontains=self.request.query_params[item]) | Q(type='Both'))

        if 'ordering' in self.request.query_params.keys() and (self.request.query_params['ordering'].startswith("extra_fields") or self.request.query_params['ordering'][1:].startswith("extra_fields")):
            qs = qs.order_by(self.request.query_params['ordering'])
        
        if 'ordering' in self.request.query_params.keys() and self.request.query_params["ordering"] == "location_type":
            self.request.query_params._mutable = True
            self.request.query_params["ordering"] = "type"
            self.request.query_params._mutable = False
        
        if 'ordering' in self.request.query_params.keys() and self.request.query_params["ordering"] == "-location_type":
            self.request.query_params._mutable = True
            self.request.query_params["ordering"] = "-type"
            self.request.query_params._mutable = False
        return qs

    # @method_decorator(license_required(['org_location.view_location']))
    def list(self, request, tenant=None):
        logger.info("{} requested the list of Location Detail for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        filtered_queryset = None
        try:
            if 'attribute_value' in request.query_params:
                attr = request.query_params['attribute_value']
                data = self.filter_queryset(self.get_queryset(tenant=tenant)).exclude(**{attr + '__exact':''}).values_list(attr, flat=True).distinct()
                context = {"success": True, "data": data}
                logger.info("{} Locations attribute list returned successfully for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                return Response(context, status=status.HTTP_200_OK)
            filtered_queryset = self.filter_queryset(self.get_queryset(tenant=tenant))
            pagination_data = None
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True)
            context = {
                "success": True, "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} Locations returned successfully for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,
                       'message': _('Organisation location data returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 17001
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_location_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_location_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(license_required(['org_location.add_location']))
    def create(self, request, tenant=None):
        logger.info("{} send data to create Location Detail for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            req_data = request.data.copy()
            req_data["tenant"] = tenant
            serializer = self.serializer_class(data=req_data)
            if serializer.is_valid():
                try:
                    obj = serializer.save()
                    context = {
                        "success": True, "message": _("Location added successfully"), "data": self.serializer_class(obj).data}
                    logger.info("{} Location added successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                    return Response(context, status=status.HTTP_200_OK)
                except IntegrityError as error:
                    internal_error = 17002
                    context = {'error':str(error), "success": False, "message": getMessage(org_location_errors, internal_error), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_location_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            internal_error = 17003
            err_message = getMessage(org_location_errors, internal_error)
            errors = get_custom_field_errors(serializer.errors)
            if 'location' in errors:
                err_message = get_custom_field_errors(serializer.errors)['location']['name']
            if 'non_field_errors' in errors and errors['non_field_errors'].code == 'unique':
                errors['non_field_errors'] = 'Location name must be unique.'
                err_message = 'Failed to add location, name must be unique.'
            context = {'error': errors, "success": False, "message": err_message, "internal_error": internal_error}
            logger.error(getLogMessage(org_location_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 17004
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_location_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_location_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(license_required(['org_location.view_location']))
    def retrieve(self, request, tenant=None, location_id=None):
        logger.info("{} requested to retrieve Location Details for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", location_id, tenant))
        try:
            try:
                obj = self.model.objects.get(tenant__id=tenant, id=location_id)
            except Exception as error:
                internal_error = 17005
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_location_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_location_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", location_id, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {
                "success": True, "message": _("Location retrieved successfully"), "data": serializer.data}
            logger.info("{} Location retrieved successfully for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", location_id, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 17006
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_location_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_location_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", location_id, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(license_required(['org_location.change_location']))
    def update(self, request, tenant=None, location_id=None):
        logger.info("{} requested to update Location Detail for id :{} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", location_id, tenant))
        try:
            try:
                obj = self.model.objects.get(tenant__id=tenant, id=location_id)
            except Exception as error:
                internal_error = 17007
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_location_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_location_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", location_id, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            req_data = request.data.copy()
            req_data["tenant"] = tenant
            serializer = self.serializer_class(obj, data=req_data, partial=True)

            if serializer.is_valid():
                try:
                    serializer.save()
                    context = {
                        "success": True, "message": _("Location updated successfully"), "data": self.serializer_class(obj).data}
                    logger.info("{} Location Details updated successfully for id : {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", location_id, tenant))
                    return Response(context, status=status.HTTP_200_OK)
                except IntegrityError as error:
                    internal_error = 17008
                    context = {'error': str(error), "success": False, "message": getMessage(org_location_errors, internal_error), "internal_error": internal_error}
                    logger.error(getLogMessage(org_location_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", location_id, error), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            internal_error = 17009
            err_message = getMessage(org_location_errors, internal_error)
            if 'location' in get_custom_field_errors(serializer.errors):
                err_message = get_custom_field_errors(serializer.errors)['location']['name']
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": err_message, "internal_error": internal_error}
            logger.error(getLogMessage(org_location_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", location_id, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)

        except Exception as error:
            internal_error = 17010
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_location_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_location_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", location_id, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(license_required(['org_location.delete_location']))
    def destroy(self, request, tenant=None, location_id=None):
        logger.info("{} requested to delete Location Details for id : {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", location_id, tenant))
        try:
            try:
                obj = self.model.objects.get(tenant__id=tenant, id=location_id)
            except Exception as error:
                internal_error = 17011
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_location_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_location_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", location_id, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            location_org_users = OrganisationUser.default_manager.filter(location=location_id, tenant__id=tenant)
            if location_org_users:
                internal_error = 17012
                context = {'error': None, "success": False, "message": _(getMessage(org_location_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_location_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", location_id), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            location = obj.location
            self.perform_destroy(obj)
            location.delete()

            context = {"success": True,
                       "message": _("Location deleted successfully."), "data": None}
            logger.info("{}, Location Details deleted successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", location_id, tenant))
            return Response(context, status=status.HTTP_200_OK)

        except Exception as error:
            internal_error = 17013
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_location_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_location_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", location_id, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_location.add_locationdetail", "org_location.add_location", ]))
    @action(detail=False, methods=['post', 'get'], name="import-bulk-locations")
    def import_bulk_locations(self, request, tenant=None):
        logger.info("{} requested to start Bulk import for locations for tenant: {}".format(request.user.email, tenant))
        try:
            custom_data = CustomAttribute.objects.filter(type='locations')
            label = []
            label_type = []
            keys = []
            custom_attribs = []
            if custom_data:
                custom_attribs = custom_data[0].custom_attribute['components']
                if custom_attribs:
                    for custom_attrib in  custom_attribs:
                        label.append(custom_attrib['label'])
                        keys.append(custom_attrib['key'])
                        label_type.append({"label":custom_attrib['label'],"type":custom_attrib['type']})
            if request.method == "GET":
                output = io.BytesIO()
                workbook = xlsxwriter.Workbook(output)
                worksheet = workbook.add_worksheet()
                row = 0
                col = 0
                #printing the headers
                headers = ['Location', 'Location Head']
                total_keys = ['Location','Location Head']

                if label:
                    headers += label
                if keys:
                    total_keys += keys
                for key in total_keys:
                    worksheet.write(row, col, key)
                    col += 1
                row = 1
                col = 0
                for header in headers:
                    worksheet.write(row, col, header)
                    col += 1
                #populating the sample data
                row = 2
                col = 0
                values_data = ['Banglore','a@b.com']
                for label_test in label_type:
                    if label_test['type']=='string':
                        data = 'value1'
                    if label_test['type']=='number':
                        data = '1234567890'
                    if label_test['type']=='list':
                        data = 'value1'
                    if label_test['type']=='date':
                        data = "yyyy-mm-dd"
                    values_data.append(data)
                worksheet.set_column(0, 3, 20)
                worksheet.write(row, col, values_data[0])
                worksheet.write(row, col+1, values_data[1])
                for i in range(2,len(values_data)):
                    worksheet.write(row, col+i, values_data[i])
                row += 1
                worksheet.set_row(0, None, None, {'hidden': True})
                workbook.close()
                output.seek(0)
                response = HttpResponse(output.read(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                response['Content-Disposition'] = 'inline; filename=' + "Sample.xlsx"
                return response
            if request.method == "POST":
                uploaded_file = request.FILES['file']
                csv_file_path = ""
                if uploaded_file.name.endswith('.xlsx'):
                    logger.info('Uploaded File is xlsx')
                    converted_file = get_uploaded_file(uploaded_file)
                    logger.info(converted_file)
                    csv_file_path = xls_to_csv(converted_file)
                    logger.info("csv_file_path: {}".format(csv_file_path))
                elif uploaded_file.name.endswith('.csv'):
                    logger.info('Uploaded File is csv')
                    csv_file_path = get_uploaded_file(uploaded_file)
                    logger.info(csv_file_path)
                    logger.info("csv_file_path: {}".format(csv_file_path))
                else:
                    csv_file_path = None
                    logger.info("Uploaded file is not XLSX/CSV.")
                request_body = {}
                request_body["csv_path"] = csv_file_path
                request_body["user"] =str(request.user.id)
                job = import_locations.apply_async(args=[request_body,custom_attribs, request.tenant.id], priority=MEDIUM_PRIORITY_TASK)
                response = {}
                response["transaction_id"] = job.id
                logger.info("Bulk import of locations has been started for job id {} for tenant: {}".format(job.id, tenant))
                context = {'success': True, 'message': _('Bulk import of locations has started'), 'data' : response}
                logger.info("{}, Bulk import for locations has started for tenant: {}".format(request.user.email, tenant))
                return Response(context, status=status.HTTP_200_OK)
        except Exception as e:
            internal_error = 17014
            context = {'error': str(e), 'success': False, 'message': _(getMessage(org_location_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_location_errors, internal_error).format(request.user.email, e), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], name="extra_field")
    def open(self, request, tenant=None):
        logger.info("{} requested the list of Location Detail for tenant: {}".format("AnonymousUser", tenant))
        try:
            if "attribute" in request.query_params:
                pk = request.query_params["attribute"]
                data_list = list(self.filter_queryset(self.get_queryset(tenant=tenant)).exclude(**{"extra_fields__" + pk + "__isnull":True}).distinct().values_list('extra_fields__' + pk, flat=True))
            else:
                data_list = list(self.filter_queryset(self.get_queryset(tenant=tenant)).values_list('name', flat=True))
            context = {"success": True, "data": data_list}
            logger.info("{} Locations returned successfully for tenant: {}".format("AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 17001
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_location_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_location_errors, internal_error).format("AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], name="get_all_location_by_key")
    def get_all_location_by_key(self, request, tenant=None):
        try:
            if "expected_type" not in request.query_params and request.query_params["expected_type"]:
                internal_error = 17022
                context = {'success': False, 'message': _(getMessage(org_location_errors, internal_error)), 'internal_error': internal_error}
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            expected_type = request.query_params["expected_type"]
            category = 'geographical'
            if "category" in request.query_params and request.query_params["category"]:
                category = request.query_params["category"]
            try:
                token = PLATFORM_INTERNAL_TOKEN
                url = "{}/api/customer-mgmt/org/{}/tags/list?category={}&type={}".format(PLATFORM_BASE_URL, tenant, category, expected_type)
                response = requests.get(url, headers={"Authorization": f"Bearer {token}"}, verify=SSL_VERIFICATION)
                if response.status_code == 200:
                    locations = []
                    data = response.json()
                    for item in data:
                            parent = []
                            if isinstance(item.get("parents", []), list):
                                for a in item.get(" ", []):
                                    if isinstance(a, dict) and all (k in a for k in ("uuid", "name", "type")):
                                        parent.append({"uuid": a["uuid"], "name": a["name"], "type": a["type"]})
                            location_payload = {"parent": parent, "name": item["name"], "type": item["type"], "uuid": item["uuid"]}
                            if "attributes" in item:
                                location_payload["attributes"] = item["attributes"]
                            locations.append(location_payload)
                context = {"success": True, "data": locations}
            except PlatformTags.DoesNotExist:
                context = {"success": True, "data": data}
            logger.info("{} Locations tags returned successfully for tenant: {}".format("AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 17021
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_location_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_location_errors, internal_error).format("AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], name="get_all_custom_tags_by_key")
    def get_all_custom_tags_by_key(self, request, tenant=None):
        try:
            if "expected_type" not in request.query_params and request.query_params["expected_type"]:
                internal_error = 17022
                context = {'success': False, 'message': _(getMessage(org_location_errors, internal_error)), 'internal_error': internal_error}
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            expected_type = request.query_params["expected_type"]
            source = None
            if "source" in request.query_params and request.query_params["source"]:
                source = request.query_params["source"]
            logger.info(source)
            result = []
            url = "{}/api/customer-mgmt/org/{}/tag?category=custom".format(PLATFORM_BASE_URL, tenant)
            token = PLATFORM_INTERNAL_TOKEN
            hashset = set()
            recursive_api_call(url, source, expected_type, result, token, hashset, "custom")
            context = {"success": True, "data": result}
            logger.info("{} Locations tags returned successfully for tenant: {}".format("AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 17021
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_location_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_location_errors, internal_error).format("AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)