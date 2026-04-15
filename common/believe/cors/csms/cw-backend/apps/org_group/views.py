import io
import copy
import xlsxwriter
from django.utils.decorators import method_decorator
from django.utils.translation import gettext as _
from django.http import HttpResponse
from django.db import IntegrityError
from rest_framework import filters, status, viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound

from apps.license.decorators import permission_and_license_required
from apps.org_apps.utils import xls_to_csv, get_uploaded_file
from apps.organisations.models import OrganisationLicense
from apps.org_config.models import CustomAttribute
from apps.org_users.models import OrganisationUser
from apps.organisations.models import Organisation
from apps.notifications.notification import send_user_related_updates
from apps.notifications.constants import UpdatesConstant
from utils.prime_generic_methods import get_custom_field_errors
from utils.CustomSearch import CustomSearchFilter, get_filter_fields
from utils.loggerwrapper import Logger, getMessage, getLogMessage
from ezedox.settings import MEDIUM_PRIORITY_TASK, HIGH_PRIORITY_TASK
from .models import OrganisationGroup
from .serializers import CreateGroupSerializer, GroupSerializer, GroupDesignerSerializer
from .utils import import_groups, diff_of_users_in_group
from .internal_errors import org_group_errors
from .filters import OrganisationGroup_filter_fields

logger = Logger(__name__)
class GroupViewSet(viewsets.ModelViewSet):
    """
    retrieve:
    Return the given group.

    list:
    Return a list of all the existing groups.

    create:
    Create a new group instance.

    partial_update:
    Update details of the given group.

    destroy:
    Deletes the given group.
    """

    permission_classes = [AllowAny]
    model = OrganisationGroup
    queryset = OrganisationGroup.objects.all()
    serializer_class = GroupSerializer
    create_serializer_class = CreateGroupSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = OrganisationGroup_filter_fields
    filter_fields = get_filter_fields(OrganisationGroup_filter_fields)
    ordering_fields = OrganisationGroup_filter_fields

    # @method_decorator(permission_and_license_required(["org_group.view_organisationgroup", ]))
    def list(self, request, tenant=None):
        logger.info("{} requested the list of Organisation Group data for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        filtered_queryset = None
        try:
            filtered_queryset = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant))
            pagination_data = None
            page = self.paginate_queryset(filtered_queryset)
            if "source" in request.query_params and request.query_params["source"] == "designer":
                self.serializer_class = GroupDesignerSerializer
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True)
            context = {
                "success": True, "message": _("Organisation Group data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} Organisation Group data returned successfully for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,
                       'message': _('Organisation group data returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 13001
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_group_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_group_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_group.add_organisationgroup", ]))
    def create(self, request, tenant=None):
        logger.info("{} send date to create Organisation Group for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            req_data = request.data.copy()
            req_data["tenant"] = tenant
            if "users_list" in req_data:
                req_data["users"] = []
                for item in req_data["users_list"]:
                    req_data["users"].append(OrganisationUser.objects.get(email=item, tenant=tenant).id)
            serializer = self.create_serializer_class(data=req_data)
            if serializer.is_valid():
                try:
                    obj = serializer.save()
                    context = {
                        "success": True, "message": _("Organisation Group created successfully."), "data": self.serializer_class(obj).data}
                    logger.info("{} Organisation Group created successfully for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
                    return Response(context, status=status.HTTP_200_OK)
                except IntegrityError as error:
                    internal_error = 13002
                    context = {'error':str(error), "success": False, "message": getMessage(org_group_errors, internal_error), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_group_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            internal_error = 13003
            err_message = getMessage(org_group_errors, internal_error)
            if 'name' in get_custom_field_errors(serializer.errors):
                err_message = get_custom_field_errors(serializer.errors)['name']
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": err_message, "internal_error": internal_error}
            logger.error(getLogMessage(org_group_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 13004
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_group_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_group_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_group.view_organisationgroup", ]))
    def retrieve(self, request, pk=None, tenant=None):
        logger.info("{} requested to retrieve Organisation Group details for id: {} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(tenant__id=tenant, id=pk)
            except Exception as error:
                internal_error = 13005
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_group_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_group_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {
                "success": True, "message": _("Organisation Group details retrieved successfully."), "data": serializer.data}
            logger.info("{} Organisation Group details retrieved successfully for id: {} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 13006
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_group_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_group_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_group.change_organisationgroup", ]))
    def update(self, request, tenant=None, pk=None):

        # def send_group_update_signal(tenant_id, user_email, pk):
        #     user = OrganisationUser.objects.get(email=user_email)
        #     message = "Organisation user {} got removed from Organisation Group for id:{}".format(user_email, pk)
        #     data = {}
        #     data["message"] = message
        #     user_data = {}
        #     user_data["id"] = user.id
        #     user_data["email"] = user.email
        #     send_user_related_updates.apply_async(
        #         args=[tenant_id, user_data, UpdatesConstant.UPDATE_USER_ATTR, data],
        #         priority=HIGH_PRIORITY_TASK,
        #         countdown=10
        #     )

        logger.info("{} requested to update Organisation Group details for id :{} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(tenant__id=tenant, id=pk)
            except Exception as error:
                internal_error = 13007
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_group_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_group_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            new_user_data = []
            old_user_data = []
            old_group_data = copy.deepcopy(obj.users.all())
            for user_data in old_group_data:
                old_user_data.append(user_data.email)
            serializer = self.create_serializer_class(
                obj, data=request.data, partial=True)
            new_user_data = []
            old_user_data = []
            old_group_data = copy.deepcopy(obj.users.all())
            for user_data in old_group_data:
                old_user_data.append(user_data.email)
            # tenant_id = request.tenant.id
            if serializer.is_valid():
                try:
                    serializer.save()
                except IntegrityError as error:
                    internal_error = 13008
                    context = {'error': str(error), "success": False, "message": getMessage(org_group_errors, internal_error), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_group_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
                # com_data = self.serializer_class(obj).data
                # for user_email in com_data['users']:
                #     new_user_data.append(user_email['email'])
                # return_data = diff_of_users_in_group(old_user_data, new_user_data)

                context = {
                    "success": True, "message": _("Organisation Group details updated successfully."), "data": self.serializer_class(obj).data}
                logger.info("{} Organisation Group details updated successfully for id :{} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
                # if return_data and return_data[1]:
                #     for user_email in return_data[1]:
                #         send_group_update_signal(tenant_id, user_email, pk)
                #     logger.info("Organisation user {} got removed from Organisation Group for id:{}".format(user_email, pk))
                # if return_data and return_data[0]:
                #     for user_email in return_data[0]:
                #         send_group_update_signal(tenant_id, user_email, pk)
                #     logger.info("{} Organisation user {} got added to Organisation Group for id:{}".format(request.user.email, return_data[0], pk))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 13009
            err_message = getMessage(org_group_errors, internal_error)
            if 'name' in get_custom_field_errors(serializer.errors):
                err_message = get_custom_field_errors(serializer.errors)['name']
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": err_message, "internal_error": internal_error}
            logger.error(getLogMessage(org_group_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 13010
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_group_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_group_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_group.delete_organisationgroup", ]))
    def destroy(self, request, pk=None, tenant=None):
        logger.info("{} requested to destroy Organisation Group for id :{} for tenant: {}.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
        try:
            try:
                obj = self.model.objects.get(tenant__id=tenant, id=pk)
            except Exception as error:
                internal_error = 13011
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_group_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_group_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            self.perform_destroy(obj)

            context = {
                "success": True, "message": _("Organisation Group deleted successfully."), "data": None}
            logger.info("{}, Organisation Group deleted successfully for id :{} for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, tenant))
            return Response(context, status=status.HTTP_200_OK)

        except Exception as error:
            internal_error = 13012
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_group_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_group_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_group.add_organisationgroup"]))
    @action(detail=False, methods=['post', 'get'], name="import-bulk-groups")
    def import_bulk_groups(self, request, tenant=None):
        logger.info("{} requested to start Bulk import of Groups for tenant: {}".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", tenant))
        try:
            custom_data = CustomAttribute.objects.filter(type='users')
            label_type = {"Location":"entity_location","Department":"entity_department"}
            custom_attribs = []
            if custom_data:
                custom_attribs = custom_data[0].custom_attribute['components']
                if custom_attribs:
                    for custom_attrib in  custom_attribs:
                        label_type.update({custom_attrib['label']:custom_attrib['key']})
            if request.method == "GET":
                output = io.BytesIO()
                workbook = xlsxwriter.Workbook(output)
                worksheet1 = workbook.add_worksheet()
                worksheet2 = workbook.add_worksheet()
                row = 0
                col = 0
                #printing the headers
                headers = ['Group', 'Users', 'Filter Field']
                total_keys = ['Group', 'Users', 'Filter Field']

                for key in total_keys:
                    worksheet1.write(row, col, key)
                    col += 1
                row = 1
                col = 0
                for header in headers:
                    worksheet1.write(row, col, header)
                    col += 1
                #populating the sample data
                row = 2
                col = 0
                values_data = ['HR','a@b.com,x@y.com','Location']
                worksheet1.set_column(0, 3, 20)
                worksheet1.write(row, col, values_data[0])
                worksheet1.write(row, col+1, values_data[1])
                worksheet1.write(row, col+2, values_data[2])
                row += 1
                worksheet1.set_row(0, None, None, {'hidden': True})
                col=0
                row=1
                worksheet2.set_column(0, 0, 30)
                worksheet2.write(0, 0, "Filter Options")
                filter_label_keys = label_type.keys()
                for filter_label in filter_label_keys:
                    label_data = "{}".format(filter_label)
                    worksheet2.write(row, col, label_data)
                    row += 1
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

                with open(csv_file_path, encoding="utf8", errors='ignore') as csv_file:
                    total = sum(1 for line in csv_file)
                    org_license = OrganisationLicense.objects.get(organisation=request.tenant)
                    total_group = OrganisationGroup.objects.filter().count()
                    if not total_group + total -1 <= org_license.groups_allowed:
                        context = {'error': 'Maximum allowed groups has already been created', "success": False, "message": _("You can create a maximum of {} groups.".format(org_license.groups_allowed))}
                        return Response(context, status=status.HTTP_400_BAD_REQUEST)

                request_body = {}
                request_body["csv_path"] = csv_file_path
                request_body["user"] =str(request.user.id)
                job = import_groups.apply_async(args=[request_body,label_type, request.tenant.id], priority=MEDIUM_PRIORITY_TASK)
                response = {}
                response["transaction_id"] = job.id
                logger.info("Bulk import of groups has been started for job id {} for tenant: {}".format(job.id, tenant))
                context = {'success': True, 'message': _('Bulk import of groups has started'), 'data' : response}
                logger.info("{}, Bulk import of groups has started for tenant: {}".format(request.user.email, tenant))
                return Response(context, status=status.HTTP_200_OK)
        except Exception as e:
            internal_error = 13013
            context = {'error': str(e), 'success': False, 'message': _(getMessage(org_group_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_group_errors, internal_error).format(request.user.email, e), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
