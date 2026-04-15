import mimetypes
import hashlib
import uuid
import json
from collections import OrderedDict

from taggit.models import Tag

from django.core.files.uploadedfile import SimpleUploadedFile
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.utils.translation import gettext as _
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.generics import CreateAPIView
from rest_framework_api_key.permissions import HasAPIKey

import process_engine
from utils import storage_utils
from utils.prime_generic_methods import get_custom_field_errors
from utils.loggerwrapper import Logger, getMessage, getLogMessage
from utils.process_engine_proxy import call
from utils.serializers import EmptySerializer
from utils.cache import delete_cache
from utils.storage_utils import get_presigned_url_by_path
from ezedox.settings import BASE_ORG_DOMAIN_URL,FILE_DOMAIN_URL, SECRET_KEY, DEFAULT_SCHEME, FILE_BUCKET
from ezedox.custom_storage import FileStorage, read_file
from apps.org_users.models import ExternalUser, User
from apps.license.decorators import permission_and_license_required
from apps.org_apps.models import ProcessView
from apps.org_apps.models import OrganisationWorkflow
from apps.organisations.models import Organisation


from .models import OrganisationFile, OrganisationForm, generate_path, Transaction, get_default_bucket
from .serializers import (GetOrganisationFormSerializer,
                          OrganisationFileSerializer, GetFormSerializer,
                          OrganisationFormSerializer, GetListOrganisationFormSerializer, TransactionSerializer)
from .utils import get_form_util, get_file_label
from .renderers import PDFRenderer
from .internal_errors import org_form_errors

logger = Logger(__name__)
file_storage = FileStorage

class OrganisationFormViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationForm
    queryset = OrganisationForm.objects.all()
    serializer_class = OrganisationFormSerializer
    getlist_serializer_class = GetListOrganisationFormSerializer
    list_serializer_class = GetOrganisationFormSerializer
    form_serializer_class = GetFormSerializer
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter,)
    ordering_fields = ('created_at',)
    filter_fields = {
        'key': ['exact'],
        'version': ['exact']
    }
    # def get_permissions(self):
    #     if self.action == 'openformversionwrapper':
    #         permission_classes = [IsOpenWorkflow]
    #         return [permission() for permission in permission_classes]
    #     return super().get_permissions()

    # Implementation of this permission will not allow external user to retrive the forms before filling up as part of any task.
    # @method_decorator(permission_and_license_required(["org_form.view_organisationform", ]))
    def list(self, request, tenant=None):
        logger.info("{} request to list Organisation Form for tenant: {}".format(get_email(request), tenant))
        try:
            if not('key' in request.query_params or 'version' in request.query_params):
                # This query_set will return the forms with unique key but with latest version(sorted based on the id desc)
                filtered_queryset = self.model.objects.raw(
                    "select * from ( select distinct on (key) * from org_form_organisationform order by key, version desc ) t order by id desc")


                # This query_set will return the forms with unique key but with latest version(sorted based on the key and from id desc)
                # modified_queryset = self.get_queryset().order_by('key', '-created_at').distinct('key')
            else:
                modified_queryset = self.get_queryset().filter(tenant__id=tenant).order_by('key', 'version')
                filtered_queryset = self.filter_queryset(modified_queryset)

            serializer = self.getlist_serializer_class(filtered_queryset, many=True, context={})
            context = {
                "success": True, "message": _("OrganisationForm data returned successfully."), "data": serializer.data}
            logger.info("{}, OrganisationForm data returned successfully for tenant: {}.".format(get_email(request), tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 12001
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, name='open-form-version-wrapper')
    def openformversionwrapper(self, request, tenant=None):
        logger.info("{} request to retrive Organizetion Form for tenant: {}".format(get_email(request), tenant))
        try:
            obj = get_form_util(request, tenant)
            tid = request.query_params.get('transaction_id')

            try:
                Transaction.objects.get(id = tid, tenant__id=tenant)
            except Exception as error:
                internal_error = 12002
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_form_errors, internal_error).format(get_email(request), error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            serializer = self.list_serializer_class(obj, context={"transactionId": tid,"request" : request})
            context = {
                "success": True, "message": _("Organisation Form details retrieved successfully."), "data": serializer.data}
            logger.info("{}, Organisation Form details retrieved successfully for tenant: {}.".format(get_email(request), tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 12003
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=False, name='form-version-wrapper')
    def formversionwrapper(self, request, tenant=None):
        logger.info("{} request to retrive Organizetion Form for tenant: {}".format(get_email(request), tenant))
        try:
            tid = request.query_params.get('transaction_id')
            pid = request.query_params.get('processInstanceId')

            if tid:
                try:
                    Transaction.objects.get(id = tid, tenant__id=tenant)
                except Exception as error:
                    internal_error = 12004
                    context = {'error': str(error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_form_errors, internal_error).format(get_email(request), error), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            elif pid:
                try:
                    transaction_qs=Transaction.objects.filter(process_instance_id= pid, tenant__id=tenant)
                    transaction_obj = None
                    if transaction_qs.exists():
                        transaction_obj = transaction_qs.first()
                    else:
                        logger.info("Transaction Id not found for process id {}, getting transaction id from form data and saving it for tenant: {}.".format(pid, tenant))
                        response, status_code = call(module= process_engine.ProcessInstanceVariablesApi,
                                                func= process_engine.ProcessInstanceVariablesApi.get_process_instance_variable,
                                                data= {"process_instance_id": pid, "variable_name":"transaction_id"},
                                                request=request, tenant_id=tenant,
                                                type="get")
                        transaction_obj = Transaction.objects.get(id=response['value'], tenant__id=tenant)
                        transaction_obj.process_instance_id = pid
                        transaction_obj.save()
                    tid = transaction_obj.id
                except Exception as error:
                    internal_error = 12005
                    context = {'error': "Invalid Process Id or Transaction Id not found in form,{}".format(str(error)),
                               'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_form_errors, internal_error).format(get_email(request), error), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)

            obj,res = get_form_util(request, tenant)
            if not obj:
                return res
            if 'get_keytype' in request.query_params and bool(request.query_params.get('get_keytype')) == True:
                serializer = self.form_serializer_class(obj, context={"transactionId": tid, "request" : request })
            else:
                serializer = self.list_serializer_class(obj, context={"transactionId": tid, "request" : request })

            context = {
                "success": True, "message": _("Organisation Form details retrieved successfully."), "data": serializer.data}
            logger.info("{} Organisation Form details retrieved successfully for tenant: {}.".format(get_email(request), tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 12006
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_form.add_organisationform", ]))
    def create(self, request, tenant=None):
        logger.info("{} sent data to create Organizetion Form for tenant: {}".format(get_email(request), tenant))
        try:
            request_data = request.data.copy()
            request_data["tenant"] = tenant
            if 'key' in request_data and request_data['key']:

                latest_version_with_this_form_name = self.get_queryset().filter(key=request_data['key']).order_by('-version').first()
                if not latest_version_with_this_form_name:
                    request_data['version'] = 1
                else:
                    request_data['version'] = latest_version_with_this_form_name.version + 1

            serializer = self.serializer_class(data=request_data)
            if serializer.is_valid():
                obj = serializer.save()
                context = {
                    "success": True, "message": _("Organisation Form created successfully."), "data": self.serializer_class(obj).data}
                logger.info("{} Organisation Form created successfully.".format(get_email(request)))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 12007
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.error(getLogMessage(org_form_errors, internal_error).format(get_email(request), serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 12008
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, pk=None, tenant=None):
        logger.info("{} requested to retrive Organization Form for id : {} for tenant: {}".format(get_email(request), pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 12009
                context = {'error': str(
                    error), 'success': False, 'message': getMessage(org_form_errors, internal_error), 'internal_error': internal_error}
                logger.error(getLogMessage(org_form_errors, internal_error).format(get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.list_serializer_class(obj, context={"token": request.auth.decode("utf-8")})
            context = {
                "success": True, "message": _("Organisation Form details retrieved successfully."), "data": serializer.data}
            logger.info("{}, Organisation Form details retrieved successfully for id : {} for tenant: {}".format(get_email(request), pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 12010
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(get_email(request), pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_form.change_organisationform", ]))
    def update(self, request, pk=None, tenant=None):
        logger.info("{} sent data to partially update Organisation form for id : {} for tenant: {}".format(get_email(request), pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 12011
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_form_errors, internal_error).format(get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj, data=request.data, partial=True)
            if serializer.is_valid():
                saved_obj = serializer.save()
                # deleting form cache because form is updated
                delete_cache(saved_obj.key + "::" + str(saved_obj.version) + str(saved_obj.tenant.id))
                context = {
                    "success": True, "message": _("Organisation Form details updated successfully."), "data": self.serializer_class(obj).data}
                logger.info("{}, Organisation Form details updated successfully for id : {} for tenant: {}".format(get_email(request), pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 12012
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.error(getLogMessage(org_form_errors, internal_error).format(get_email(request), pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 12013
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(get_email(request), pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @method_decorator(permission_and_license_required(["org_form.delete_organisationform", ]))
    def destroy(self, request, pk=None, tenant=None):
        logger.info("{} requested to destroy Organisation form for id : {} for tenant: {}".format(get_email(request), pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 12014
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_form_errors, internal_error).format(get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            # deleting form cache because form is deleted
            delete_cache(obj.key + "::" + str(obj.version) + str(obj.tenant.id))
            self.perform_destroy(obj)

            context = {
                "success": True, "message": _("Organisation Form deleted successfully."), "data": None}
            logger.info("{}, Organisation Form deleted successfully for id : {} for tenant: {}".format(get_email(request), pk, tenant))
            return Response(context, status=status.HTTP_200_OK)

        except Exception as error:
            internal_error = 12015
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(get_email(request), pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ModelerFormViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationForm
    queryset = OrganisationForm.objects.all()
    serializer_class = OrganisationFormSerializer

    def list(self, request):
        context = {'error': '', 'success': False,
                   'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def retrieve(self, request, pk=None, tenant=None):
        logger.info("{} requested to retrive Organisation form for key : {} for tenant: {}".format(get_email(request), pk,tenant))
        try:
            try:
                if "version" in request.query_params:
                    obj = self.model.objects.get(key=pk, version=request.query_params["version"], tenant__id=tenant)
                else:
                    obj = self.model.objects.filter(key=pk, tenant__id=tenant).order_by("-version")
                    obj = obj[0]
            except Exception as error:
                internal_error = 12016
                context = {'error': str(
                    error), 'success': False, 'message': getMessage(org_form_errors, internal_error), 'internal_error': internal_error}
                logger.error(getLogMessage(org_form_errors, internal_error).format(get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {
                "success": True, "message": _("Organisation Form details retrieved successfully."), "data": serializer.data}
            logger.info("{} Organisation Form details retrieved successfully for key : {} for tenant: {}".format(get_email(request), pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 12017
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(get_email(request), pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

FILE_CONTENT_TYPE = {
    "video/x-msvideo" : ".avi",
    "image/bmp" : ".bmp",
    "text/csv" : ".csv",
    "application/msword" : ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : ".docx",
    "text/html" : ".html",
    "image/jpeg" : ".jpeg",
    "video/mpeg" : ".mpeg",
    "image/png" : ".png",
    "application/pdf" : ".pdf",
    "audio/webm" : ".weba",
    "video/webm" : ".webm",
    "image/webp" : ".webp",
    "application/vnd.ms-excel" : ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : ".xlsx",
    "video/3gpp" : ".3gp",
    "video/3gpp2" : ".3g2",
    "video/x-flv" : ".flv",
    "video/mp4" : ".mp4",
    "application/x-mpegURL" : ".m3u8",
    "video/MP2T" : ".ts",
    "video/x-msvideo" : ".mov",
    "video/x-ms-wmv" : ".wmv",
    "video/quicktime" : ".mov"
}

def file_extension(name, content_type):
    res_name = ""
    if content_type in FILE_CONTENT_TYPE:
        if len(name.split('.')) > 1:
            res_name = "." + name.split('.')[1]
        else:        
            res_name = FILE_CONTENT_TYPE[content_type]
    else:
        raise Exception("Unsupported File Format : " + content_type)
    return res_name

class OrganisationFileViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationFile
    queryset = OrganisationFile.objects.all()
    serializer_class = OrganisationFileSerializer

    # def get_permissions(self):
    #     if self.action == 'update':
    #         permission_classes = [HasAPIKey|IsAuthenticated]
    #         return [permission() for permission in permission_classes]
    #     elif self.action == 'replace_pdf' or self.action == "get_pdf":
    #         permission_classes = [AllowAny]
    #         return [permission() for permission in permission_classes]
    #     elif self.action == 'retrieve' or self.action == 'open':
    #         permission_classes = [AllowAny]
    #         return [permission() for permission in permission_classes]

    #     return super().get_permissions()

    def retrieve(self, request, pk=None, tenant=None):
        logger.info("requested to retrive File for id : {} for tenant: {}".format(pk,tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant=tenant)
            except Exception as error:
                internal_error = 12018
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_form_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            logger.info("File retrived successfully for id : {} for tenant: {}".format(pk, tenant))
            return HttpResponse(read_file(obj), content_type=obj.content_type)
        except Exception as error:
            internal_error = 12019
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, name='file_upload_open_form', methods=["post"])
    def open(self, request, tenant=None):
        try:
            transaction_id = request.query_params.get('transactionId')
            if  not transaction_id:
                internal_error = 12020
                context = {'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_form_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            try:
                transaction_obj = Transaction.objects.get(id = transaction_id)
                processInstanceId =  transaction_obj.process_instance_id
            except Exception as error:
                internal_error = 12021
                context = {'error': str(error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_form_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            form_field_label = request.query_params["label"]
            if not processInstanceId:
                processInstanceId = None
            doc = SimpleUploadedFile(str(uuid.uuid4()) + file_extension(request.FILES['file'].name, request.FILES['file'].content_type), request.FILES['file'].read(), content_type=request.FILES['file'].content_type)
            file_upload = OrganisationFile.objects.create(
                name = request.FILES['file'].name,
                user = None,
                file_label = form_field_label,
                content_type = request.FILES['file'].content_type,
                process_instance_id = processInstanceId,
                transaction_id = transaction_obj,
                file = doc,
                doc_type = OrganisationFile.TYPE_CHOICES[0][0]
            )

            try:
                storage_utils.load_file(file_upload)
            except Exception as error:
                if error.response['Error']['Code'] == "404":
                    internal_error = 12022
                    logger.error(getMessage(org_form_errors, internal_error), internal_error)
                    context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
                else:
                    internal_error = 12027
                    logger.exception(getLogMessage(org_form_errors, internal_error).format(error), internal_error)
                    context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            response = {
                "url" : "{0}://{1}{2}".format(DEFAULT_SCHEME, request.get_host(), "/api/forms/files/" + str(file_upload.id)),
                "name" : request.FILES['file'].name,
                "size" : request.FILES['file'].size
            }
            logger.info("File uploaded successfully")
            return Response(response, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 12023
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request, tenant=None):
        logger.info(" sent data to create File")
        try:
            # token = request.query_params["token"]
            # processInstanceId = request.query_params.get('processInstanceId')
            transaction_id = request.query_params.get('transactionId')
            aws_bucket = get_default_bucket()
            file_path = request.query_params.get('file_path', None)
            if file_path:
                aws_bucket, file_path = file_path.split(':')

            entity_id = None
            if  not transaction_id:
                transaction_obj = None
                processInstanceId = None
                entity_id = request.query_params.get('entityId')
            else:
                try:
                    transaction_obj = Transaction.objects.get(id = transaction_id, tenant=tenant)
                    processInstanceId =  transaction_obj.process_instance_id
                except Exception as error:
                    internal_error = 12025
                    context = {'error': str(error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_form_errors, internal_error), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)

            form_field_label = request.query_params["label"]
            # data = {'token': token}
            # valid_data = VerifyJSONWebTokenSerializer().validate(data)

            if not processInstanceId:
                processInstanceId = None

            # if valid_data:
            email = get_email(request)
            user = User.objects.get(email=email, tenant=tenant)
            doc = SimpleUploadedFile(str(uuid.uuid4()) + file_extension(request.FILES['file'].name, request.FILES['file'].content_type), request.FILES['file'].read(), content_type=request.FILES['file'].content_type)
            file_upload = OrganisationFile.objects.create(
                name = request.FILES['file'].name,
                user = user,
                file_label = form_field_label,
                content_type = request.FILES['file'].content_type,
                process_instance_id = processInstanceId,
                transaction_id = transaction_obj,
                file = doc,
                doc_type = OrganisationFile.TYPE_CHOICES[0][0],
                entity_id=entity_id,
                tenant = Organisation.objects.get(id=tenant),
                aws_bucket=aws_bucket,
                file_path=file_path
            )
            file_upload.tags.add('Uploaded')

            new_file_key = file_upload.file.name
            logger.info(new_file_key)
            try:
                storage_utils.load_file(file_upload)
            except Exception as error:
                if error.response['Error']['Code'] == "404":
                    internal_error = 12026
                    logger.error(getMessage(org_form_errors, internal_error), internal_error)
                    context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
                else:
                    internal_error = 12027
                    logger.exception(getLogMessage(org_form_errors, internal_error).format(error), internal_error)
                    context = {'error': str(error), 'success': False,
                       'message': _(getLogMessage(org_form_errors, internal_error).format(error)), 'internal_error': internal_error}
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
            response = {
                "url" : "{0}://{1}/api/cw/{2}/forms/files/{3}".format(DEFAULT_SCHEME, FILE_DOMAIN_URL, tenant, str(file_upload.id)),
                "name" : request.FILES['file'].name,
                "size" : request.FILES['file'].size,
                "file_path": "file/download/" + new_file_key
            }
            logger.info("File uploaded successfully")
            return Response(response, status=status.HTTP_200_OK)
            # else:
            #     context = {'error' : "UnAuthorized Access", 'success': False, 'message': _('Failed to upload File.')}
            #     logger.error("Failed to upload File, due to: {}".format(error))
            #     return Response(context, status=status.HTTP_401_UNAUTHORIZED)
        except ValidationError as error:
            internal_error = 12027
            context = {'error' : "UnAuthorized Access", 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.error(getLogMessage(org_form_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as error:
            internal_error = 12028
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None, tenant=None):
        logger.info("requested to destroy File for id : {} for tenant: {}".format(pk,tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant=tenant)
            except Exception as error:
                internal_error = 12029
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_form_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            self.perform_destroy(obj)

            context = {
                "success": True, "message": _("File deleted successfully."), "data": None}
            logger.info(" File deleted successfully for id : {} for tenant: {}".format(pk, tenant))
            return Response(context, status=status.HTTP_200_OK)

        except Exception as error:
            internal_error = 12030
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None, tenant=None):
        logger.info("requested to update File for id : {} for tenant: {}".format(pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant=tenant)
            except Exception as error:
                internal_error = 12031
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_form_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            if "file" in request.FILES :
                doc = SimpleUploadedFile(str(uuid.uuid4()) + file_extension(request.FILES['file'].name, request.FILES['file'].content_type), request.FILES['file'].read(), content_type=request.FILES['file'].content_type)
                obj.file = doc
                obj.save()
                response = {
                    "url" : "{0}://{1}/api/cw/{2}/forms/files/{3}".format(DEFAULT_SCHEME, FILE_DOMAIN_URL, tenant, str(obj.id)),
                    "name" : request.FILES['file'].name,
                    "size" : request.FILES['file'].size,
                }
                logger.info("File updated successfully for id : {} for tenant: {}".format(pk,tenant))
                return Response(response, status=status.HTTP_200_OK)
            else:
                serializer = self.serializer_class(obj, data=json.loads(request.body.decode('utf-8')), partial=True)
                if serializer.is_valid():
                    serializer.save()
                    new_file_key = generate_path(obj,obj.file.name.split('/')[-1])

                    logger.info(new_file_key)

                    logger.info(obj.aws_bucket + obj.file.name)
                    storage_utils.copy_file(obj, new_file_key)
                    storage_utils.delete_file(obj.aws_bucket, obj.file.name)
                    obj.file.name = new_file_key
                    obj.save()
                    context = {
                        "success": True, "message": _("File updated successfully."), "data": serializer.data}
                    logger.info("File updated successfully for id : {} for tenant: {}".format(pk, tenant))
                    return Response(context, status=status.HTTP_200_OK)
                internal_error = 12032
                context = {
                        "success": False, "message": _(getMessage(org_form_errors, internal_error)), "data": None, 'internal_error': internal_error}
                logger.error(getLogMessage(org_form_errors, internal_error).format(pk), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 12033
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods = ['post'], name="upload-process-document")
    def upload_process_document(self, request, tenant=None):
        logger.info("requested to replace / upload File")
        try:
            req_data = request.data
            process_instance_id = req_data["processInstanceId"]
            aws_bucket = get_default_bucket()
            file_path = request.query_params.get('file_path', None)
            if file_path:
                aws_bucket, file_path = file_path.split(':')

            transaction_obj =  Transaction.objects.filter(process_instance_id = process_instance_id).first()
            file_set = request.FILES.getlist('file')
            email = get_email(request)
            user = User.objects.get(email=email)
            tenant_obj=Organisation.objects.get(id=tenant)
            duplicate_files = True
            if file_set and process_instance_id:
                for file in file_set:
                    doc = SimpleUploadedFile(str(uuid.uuid4()) + file_extension(file.name, file.content_type), file.read(), content_type=file.content_type)
                    file_upload, is_created = OrganisationFile.objects.get_or_create(
                        defaults = {"file" : doc, "user" : user, "doc_type" : OrganisationFile.TYPE_CHOICES[1][0],},
                        name = file.name,
                        content_type = file.content_type,
                        process_instance_id = process_instance_id,
                        user = user,
                        doc_type = OrganisationFile.TYPE_CHOICES[1][0],
                        transaction_id=transaction_obj,
                        tenant=tenant_obj,
                        aws_bucket=aws_bucket,
                        file_path= file_path
                    )
                    file_upload.tags.add('Uploaded')
                    # is_file_uploaded = file_storage.exists(file_upload.file.url)
                    new_file_key = file_upload.file.name
                    logger.info("/files/" + new_file_key)
                    try:
                        storage_utils.load_file(file_upload)
                    except Exception as error:
                        if error.response['Error']['Code'] == "404":
                            internal_error = 12034
                            logger.error(getMessage(org_form_errors, internal_error), internal_error)
                            context = {'error': str(error), 'success': False,
                                'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                            return Response(context, status=status.HTTP_400_BAD_REQUEST)
                        else:
                            internal_error = 12027
                            logger.exception(getLogMessage(org_form_errors, internal_error).format(error), internal_error)
                            context = {'error': str(error), 'success': False,
                                'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                            return Response(context, status=status.HTTP_400_BAD_REQUEST)
                    if not is_created:
                        logger.info("file name with {0} already exists".format(file.name))
                    else:
                        duplicate_files = False
                if duplicate_files:
                    context = {
                        "success": True, "message": _
                        ("Files replaced successfully."), "data": None}
                    logger.info("{}, Files replaced successfully.")
                else:
                    context = {
                        "success": True, "message": _("Files uploaded successfully."), "data": None}
                    logger.info("Files uploaded successfully.")
                return Response(context, status=status.HTTP_200_OK)
            else:
                internal_error = 12035
                context = {'error': 'Bad request', 'success': False,
                        'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_form_errors, internal_error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            internal_error = 12036
            context = {'error': str(e), 'success': False,
                       'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(e), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods = ['post'], name="replace")
    def replace_pdf(self, request, pk=None, tenant=None):
        try:
            logger.info("requested to update File for id : {}".format(pk))
            try:
                obj = self.model.objects.get(id=pk, tenant=tenant)
                content_type = mimetypes.guess_type(obj.file.file.name)[0]
            except Exception as error:
                internal_error = 12037
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_form_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            storage_utils.replace_file(obj, request.FILES['file'].read())
            obj = self.model.objects.get(id=pk, tenant=tenant)

            return HttpResponse(obj.file.read(), content_type=content_type)
        except Exception as error:
            internal_error = 12038
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], renderer_classes=[PDFRenderer])
    def get_pdf(self, request, pk=None, tenant=None):
        logger.info("requested to retrive File for id : {} for tenant: {}".format(pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant=tenant)
                content_type = mimetypes.guess_type(obj.file.file.name)[0]
            except Exception as error:
                internal_error = 12039
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_form_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            logger.info("File retrived successfully for id : {} for tenant: {}".format(pk,tenant))
            return HttpResponse(obj.file.read(), content_type=content_type)
        except Exception as error:
            internal_error = 12040
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, name='access_file_by_path', methods=["get"])
    def access_file_by_path(self, request, tenant=None):
        try:
            if "relative_path" not in request.query_params and not request.query_params["relative_path"]:
                internal_error = 12048
                context = {'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            if "bucket_name" not in request.query_params and not request.query_params["bucket_name"]:
                internal_error = 12049
                context = {'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            
            relative_path = request.query_params["relative_path"]
            bucket_name = request.query_params['bucket_name']
            file_url = get_presigned_url_by_path(relative_path, bucket_name)
            context = {'success': True, "message": _("File url retrieved successfully."), "data": {"url": file_url}}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 12050
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserFileViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationFile
    queryset = OrganisationFile.objects.all()
    serializer_class = OrganisationFileSerializer

    # def get_permissions(self):
    #     if self.action == 'list' or self.action == 'retrieve':
    #         permission_classes = [has_manage_process_permission_or_is_external_user]
    #         return [permission() for permission in permission_classes]
    #     return super().get_permissions()


    def list(self, request, tenant=None):
        logger.info("{} requested the list of Users Files for tenant: {}".format(get_email(request), tenant))
        try:
            response = OrderedDict()
            tag_queryset = Tag.objects.all()
            tag_list = [tag.name for tag in tag_queryset]
            for tag in tag_list:
                response[tag] = []
            is_external_user = ExternalUser.objects.filter(email = get_email(request), tenant=tenant).exists()
            if is_external_user:
                Query = process_engine.QueryApi
                query_historic_process = Query.query_historic_process_instance
                req_body = {}
                req_body["deleted"] = False
                req_body["involvedUser"] = get_email(request)
                # req_body["tenantId"] = get_tenant(request)
                action = call(module = Query, func= query_historic_process, data= req_body, tenant_id=tenant, request= request, type="post")[0]
                process_list = action["data"]
                for process in process_list:
                    query_set = self.model.objects.filter(process_instance_id=str(process["id"]), tenant=tenant)
                    if query_set.count() > 0:
                        for tag in tag_list:
                            tag_queryset = query_set.filter(tags__name=tag)
                            for tag_query in tag_queryset:
                                serializer = self.serializer_class(tag_query)
                                response[tag].append(serializer.data)
            else:
                process_instance_id = entity_id = None
                if 'processInstanceId' in request.query_params:
                    process_instance_id = request.query_params["processInstanceId"]
                elif 'entityId' in request.query_params:
                    entity_id = request.query_params['entityId']
                else:
                    internal_error = 12041
                    context = {'error' : "process Instance Id or entity Id not passed", 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                    logger.exception(getMessage(org_form_errors, internal_error), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
                if process_instance_id:
                    allowed_forms = []
                    allowed_labels = []

                    query_set = self.model.objects.filter(process_instance_id=process_instance_id, tenant__id=tenant)

                    if query_set.exists():
                        if query_set.count() > 0:
                            for tag in tag_list:
                                tag_queryset = query_set.filter(tags__name=tag)
                                for tag_query in tag_queryset:
                                    serializer = self.serializer_class(tag_query)
                                    response[tag].append(serializer.data)
                elif entity_id:
                    query_set = self.model.objects.filter(entity_id=entity_id, tenant__id=tenant)
                    if query_set.exists():
                        if query_set.count() > 0:
                            for tag in tag_list:
                                tag_queryset = query_set.filter(tags__name=tag)
                                for tag_query in tag_queryset:
                                    serializer = self.serializer_class(tag_query)
                                    response[tag].append(serializer.data)
                else:
                    raise Exception("Null value found in either processInstanceId or entityId")
            context = {
                "success": True, "message": _("Users Files returned successfully."), "data": response}
            logger.info("{}, Users Files returned successfully for tenant: {}.".format(get_email(request), tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 12042
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, tenant=None, pk=None):
        logger.info("{} requested to retrive the File for id: {} for tenant: {}".format(get_email(request), pk, tenant))
        try:
            try:
                obj = self.model.objects.get(tenant__id=tenant, id=pk)
                content_type = mimetypes.guess_type(obj.file.file.name)[0]
            except Exception as error:
                internal_error = 12043
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_form_errors, internal_error).format(get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            response = HttpResponse(obj.file.read(), content_type=content_type)
            response['Content-Disposition'] = 'inline; filename=' + obj.file.file.name
            return response
        except Exception as error:
            internal_error = 12044
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(get_email(request), pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AadhaarHashViewset(CreateAPIView):
    """ For one-way aadhar Hashing """

    model = None
    serializer_class = None
    permission_classes = [AllowAny]
    queryset = None
    serializer_class = EmptySerializer

    def post(self, request, *args, **kwargs):
        try:
            request_data = request.data.copy()
            aadhaar = request_data.get('aadhaar_number')
            if aadhaar and len(aadhaar) == 12:
                hashed_aadhaar = hashlib.sha256((aadhaar + SECRET_KEY).encode()).hexdigest()
                masked_aadhaar = "X"*8 + aadhaar[-4:]
                context = {"success": True, "data": {"aadhaar_hash": hashed_aadhaar, "aadhaar_masked": masked_aadhaar}}
                return Response(context, status=status.HTTP_200_OK)
            logger.warning('Aadhaar number is missing or not passed correctly')
            context = {"success": False, "message":"Failed to generate hash", "error": "aadhaar_number is missing or not passed correctly in request"}
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 12045
            logger.error(getLogMessage(org_form_errors, internal_error).format(str(error)), internal_error)
            context = {"success": False, "message":getMessage(org_form_errors, internal_error), "error": str(error), 'internal_error': internal_error}
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TransactionModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    model = Transaction
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer

    def retrieve(self, request, pk=None):
        logger.info("{} requested to retrive Transaction for id : {}".format(get_email(request), pk))
        try:
            try:
                obj = self.get_object()
            except Exception as error:
                internal_error = 12009
                context = {'error': str(
                    error), 'success': False, 'message': getMessage(org_form_errors, internal_error), 'internal_error': internal_error}
                logger.error(getLogMessage(org_form_errors, internal_error).format(get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {"success": True, "message": _("Transaction details retrieved successfully."), "data": serializer.data}
            logger.info("{}, Transaction details retrieved successfully for id : {}".format(get_email(request), pk))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 12010
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_form_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_form_errors, internal_error).format(get_email(request), pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def get_email(request):
    return request.user.email if hasattr(request.user, 'email') else "AnonymousUser"