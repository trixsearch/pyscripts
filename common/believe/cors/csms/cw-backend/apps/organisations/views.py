# Third-Party imports
import mimetypes, json

from django.db import transaction
from django.utils.decorators import method_decorator
from django.utils.translation import gettext as _
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.exceptions import NotAuthenticated, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action

# Application imports
from apps.license.decorators import permission_and_license_required
from utils.prime_generic_methods import get_custom_field_errors
from apps.url_shortner.utils import get_header_urls
from utils.loggerwrapper import Logger, getMessage, getLogMessage
from ezedox.settings import HIGH_PRIORITY_TASK, MEDIUM_PRIORITY_TASK
from .models import Organisation, OrganisationLicense, ScheduledReport, Domain, OrganisationSMS
from .serializers import (OrganisationLicenseSerializer,
                          OrganisationManifestSerializer,
                          OrganisationSerializer,
                          OrganisationLogoSerializer, ScheduledReportSerializer, ScheduledReportGetSerializer, OrganisationSMSSerializer)

from utils.sms import send_sms_v2
from utils.email import ezedox_send_mail
from apps.org_config.utils import get_all_emails
from .utils import create_org_and_owner
from .internal_errors import organisations_errors

logger = Logger(__name__)

class OrganisationViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = Organisation
    queryset = Organisation.objects.all()
    serializer_class = OrganisationSerializer
    serializer_logo_class = OrganisationLogoSerializer

#     # def get_permissions(self):
#     #     if self.action == 'list' or self.action == 'create':
#     #         permission_classes = [AllowAny]
#     #         return [permission() for permission in permission_classes]
#         # return super().get_permissions()

#     def list(self, request):
#         try:
#             if 'domain_url' in request.query_params and request.query_params['domain_url']:
#                 # organisation_with_given_domain = self.get_queryset().filter(domains__domain=request.query_params['domain_url']).order_by('name')
#                 domain_obj = Domain.objects.filter(domain=request.query_params['domain_url'])
#                 if domain_obj:
#                     organisation_with_given_domain = domain_obj[0].tenant
#                     serializer = self.serializer_logo_class(organisation_with_given_domain, fields=('id', 'name', 'logo', 'domains__domain',  'show_org_name', 'short_name',
#                                         'first_primary_color', 'second_primary_color', 'first_button_color', 'second_button_color', 'icon_color', 'button_text_color', 'assets_opacity', 'description', 'org_address', 'cin', 'pan', 'gstn'), context={"request":request})
#                     context = {"success": True, "message": _("Organisation data returned successfully."), "data": serializer.data}
#                     return Response(context, status=status.HTTP_200_OK)
#             internal_error = 24001
#             context = {'success': False, 'message': _(getMessage(organisations_errors, internal_error)), 'internal_error': internal_error}
#             logger.error(getMessage(organisations_errors, internal_error), internal_error)
#             return Response(context, status=status.HTTP_404_NOT_FOUND)
#         except Exception as error:
#             internal_error = 24002
#             context = {'error': str(error), 'success': False, 'message': _(getMessage(organisations_errors, internal_error)), 'internal_error': internal_error}
#             logger.exception(getLogMessage(organisations_errors, internal_error).format(error), internal_error)
#             return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     def create(self, request):
#         try:
#             request_data = request.data.copy()
#             serializer = self.serializer_class(data=request_data)
#             if serializer.is_valid():
#                 obj = serializer.save()
#                 user_creation = OrganisationUserRegistrationView.post(self, request=request, org=obj)
#                 context = {"success": True, "message": _('''Your request for organisation creation has been accepted successfully. You will receive an activation link on {} shortly.'''.format(request_data.get('email')))}
#                 return Response(context, status=status.HTTP_200_OK)
#             internal_error = 24003
#             context = {'error': get_custom_field_errors(
#                 serializer.errors), "success": False, "message": _(getMessage(organisations_errors, internal_error)), "internal_error": internal_error}
#             logger.error(getLogMessage(organisations_errors, internal_error).format(serializer.errors), internal_error)
#             return Response(context, status=status.HTTP_400_BAD_REQUEST)
#         except Exception as error:
#             internal_error = 24004
#             context = {'error': str(error), 'success': False, 'message': _(getMessage(organisations_errors, internal_error)), "internal_error": internal_error}
#             logger.exception(getLogMessage(organisations_errors, internal_error).format(error), internal_error)
#             return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["organisations.view_organisation", ]))
    def retrieve(self, request, pk=None):
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except PermissionDenied as error:
                context = {'error': str(error), 'success': False, 'message': _(error.detail)}
                return Response(context, status=status.HTTP_403_FORBIDDEN )
            except NotAuthenticated as error:
                context = {'error': str(error), 'success': False, 'message': _(error.detail)}
                return Response(context, status=status.HTTP_401_UNAUTHORIZED)
            except Exception as error:
                internal_error = 24005
                context = {'error': str(error), 'success': False, 'message': _(getMessage(organisations_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(organisations_errors, internal_error).format(error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_logo_class(obj, fields=('id', 'name', 'logo', 'show_org_name', 'created_at', 'short_name',
                            'first_primary_color', 'second_primary_color', 'first_button_color', 'second_button_color', 'icon_color', 'button_text_color', 'assets_opacity',
                            'icon_192_size', 'icon_512_size', 'description', 'org_address',  'cin', 'pan', 'gstn'), context={"request":request})
            context = {
                "success": True, "message": _("Organisation details retrieved successfully"), "data": serializer.data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 24006
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(organisations_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(organisations_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     def update(self, request, pk=None):
#         context = {'error': 'Method not allowed.', 'success': False, 'message': _('Method not allowed.')}
#         return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

#     @method_decorator(permission_and_license_required(["organisations.change_organisation", ]))
#     def partial_update(self, request, pk=None):
#         try:
#             try:
#                 obj = self.get_object()
#             except PermissionDenied as error:
#                 context = {'error': str(error), 'success': False, 'message': _(error.detail)}
#                 return Response(context, status=status.HTTP_403_FORBIDDEN )
#             except NotAuthenticated as error:
#                 context = {'error': str(error), 'success': False, 'message': _(error.detail)}
#                 return Response(context, status=status.HTTP_401_UNAUTHORIZED)
#             except Exception as error:
#                 internal_error = 24007
#                 context = {'error': str(error), 'success': False, 'message': _(getMessage(organisations_errors, internal_error)), 'internal_error': internal_error}
#                 logger.error(getLogMessage(organisations_errors, internal_error).format(error), internal_error)
#                 return Response(context, status=status.HTTP_404_NOT_FOUND)

#             serializer = self.serializer_class(obj, data=request.data, partial=True, fields=('name', 'logo', 'show_org_name',
#                             'first_primary_color', 'second_primary_color', 'first_button_color', 'second_button_color', 'icon_color', 'button_text_color', 'assets_opacity',
#                             'icon_192_size', 'icon_512_size', 'description', 'org_address',  'cin', 'pan', 'gstn'))

#             if serializer.is_valid():
#                 serializer.save()
#                 context = {"success": True, "message": _("Organisation details updated successfully."), "data": self.serializer_logo_class(obj, context={"request":request}).data}
#                 return Response(context, status=status.HTTP_200_OK)
#             internal_error = 24008
#             context = {'error': get_custom_field_errors(
#                 serializer.errors), "success": False, "message": _(getMessage(organisations_errors, internal_error)), "internal_error": internal_error}
#             logger.error(getLogMessage(organisations_errors, internal_error).format(serializer.errors), internal_error)
#             return Response(context, status=status.HTTP_400_BAD_REQUEST)
#         except Exception as error:
#             internal_error = 24009
#             context = {'error': str(error), 'success': False, 'message': _(getMessage(organisations_errors, internal_error)), "internal_error": internal_error}
#             logger.exception(getLogMessage(organisations_errors, internal_error).format(pk, error), internal_error)
#             return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     def destroy(self, request, pk=None):
#         context = {'error': 'Method not allowed.', 'success': False, 'message': _('Method not allowed.')}
#         return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)


    @action(detail=True, methods=['get'], name="org-logo")
    def logo(self, request, pk=None):
        try:
            try:
                obj = self.get_object()
                content_type = mimetypes.guess_type(obj.logo.file.name)[0]
            except Exception as error:
                internal_error = 24010
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(organisations_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(organisations_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            logger.info("logo retrived successfully of id : {}".format(pk))
            return HttpResponse(obj.logo.read(), content_type=content_type)
        except Exception as error:
            internal_error = 24011
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(organisations_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(organisations_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class OrganisationLicenseViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationLicense
    queryset = OrganisationLicense.objects.all()
    serializer_class = OrganisationLicenseSerializer

    @method_decorator(permission_and_license_required(["organisations.view_organisationlicense", ]))
    def list(self, request):
        try:
            organisation_license_with_given_domain = self.queryset.filter(organisation__domains__domain=request.tenant.domain_url)
            if organisation_license_with_given_domain:
                serializer = self.serializer_class(organisation_license_with_given_domain.first())
                context = {"success": True, "message": _("Organisation license data returned successfully."), "data": serializer.data}
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 24012
            context = {'success': False, 'message': _(getMessage(organisations_errors, internal_error)),'internal_error': internal_error}
            logger.error(getMessage(organisations_errors, internal_error), internal_error)
            return Response(context, status=status.HTTP_404_NOT_FOUND)
        except Exception as error:
            internal_error = 24013
            context = {'error': str(error), 'success': False, 'message': _(getMessage(organisations_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(organisations_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request):
        context = {'error': 'Method not allowed.', 'success': False, 'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def retrieve(self, request, pk=None):
        context = {'error': 'Method not allowed.', 'success': False, 'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def update(self, request, pk=None):
        context = {'error': 'Method not allowed.', 'success': False, 'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @method_decorator(permission_and_license_required(["organisations.change_organisationlicense", ]))
    def partial_update(self, request, pk=None):
        try:
            try:
                obj = self.get_object()
            except PermissionDenied as error:
                context = {'error': str(error), 'success': False, 'message': _(error.detail)}
                return Response(context, status=status.HTTP_403_FORBIDDEN )
            except NotAuthenticated as error:
                context = {'error': str(error), 'success': False, 'message': _(error.detail)}
                return Response(context, status=status.HTTP_401_UNAUTHORIZED)
            except Exception as error:
                internal_error = 24014
                context = {'error': str(error), 'success': False, 'message': _(getMessage(organisations_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(organisations_errors, internal_error).format(error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            serializer = self.serializer_class(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {"success": True, "message": _("Organisation License details updated successfully"), "data": serializer.data}
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 24015
            context = {"success": False, "message": _(getMessage(organisations_errors, internal_error)), "data": self.serializer_class(obj).data, "internal_error": internal_error}
            logger.error(getMessage(organisations_errors, internal_error), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 24016
            context = {'error': str(error), 'success': False, 'message': _(getMessage(organisations_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(organisations_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None):
        context = {'error': 'Method not allowed.', 'success': False, 'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)



class ManifestViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    model = Organisation
    queryset = Organisation.objects.all()
    serializer_class = OrganisationManifestSerializer

    def list(self, request):
        try:
            obj = self.model.objects.get(domains__domain=request.tenant.domain_url)
            if 'icon' in request.query_params:
                return Response(getattr(getattr(obj, request.query_params['icon'], None), 'url', None), status=status.HTTP_200_OK)

            serializer = self.serializer_class(obj)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 24017
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(organisations_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(organisations_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, pk=None):
        context = {'error': '', 'success': False,'message': 'Method not allowed.'}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)


class ScheduledReportViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    model = ScheduledReport
    serializer_class = ScheduledReportSerializer
    list_serializer_class = ScheduledReportGetSerializer
    queryset = ScheduledReport.objects.all()

    def retrieve(self, request, pk=None):
        context = {'error': '', 'success': False,
                    'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def list(self, request):
        try:
            report_template_id = self.request.query_params.get('report_id', None)
            try:
                report_schedulers = self.model.objects.filter(report_template_id=report_template_id)
            except Exception as error:
                internal_error = 24018
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(organisations_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(organisations_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.list_serializer_class(report_schedulers, many=True)
            context = {"success": True, "message": _("Scheduler retrived successfully."), "data":serializer.data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as err:
            internal_error = 24019
            context = {'error': str(err), "success": False, "message": _(getMessage(organisations_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(organisations_errors, internal_error).format(err), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None):
        logger.info("{} requested to delete scheduler .".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"))
        try:
            try:
                obj = self.get_object()
            except Exception as error:
                internal_error = 24020
                context = {'error': str(error), 'success': False, 'message': _(getMessage(organisations_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(organisations_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            self.perform_destroy(obj)

            context = {"success": True, "message": _("scheduler deleted successfully"), "data": None}
            logger.info("{} scheduler  deleted successfully".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"))
            return Response(context, status=status.HTTP_200_OK)

        except Exception as error:
            internal_error = 24021
            context = {'error': str(error), 'success': False, 'message': _(getMessage(organisations_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(organisations_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None):

        context = {'error': '', 'success': False,
                   'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def partial_update(self, request, pk=None):
        logger.info("{} requested to update Report Scheduler.".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"))
        try:
            try:
                obj = self.get_object()
            except Exception as error:
                internal_error = 24022
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(organisations_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(organisations_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(
                obj, data=request.data, partial=True)

            if serializer.is_valid():
                serializer.save()
                context = {
                    "success": True, "message": _("Scheduler updated successfully")}
                logger.info("{} Scheduler updated successfully".format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser"))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 24023
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(organisations_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(organisations_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)

        except Exception as error:
            internal_error = 24024
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(organisations_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(organisations_errors, internal_error).format(request.user.email if hasattr(request.user, 'email') else "AnonymousUser", error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request):
        try:
            request_data = request.data.copy()
            serializer = self.serializer_class(data=request_data, many=True)
            if serializer.is_valid():
                serializer.save()
                context = {"success": True, "message": _("Scheduler added successfully.")}
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 24025
            context = {"success": False, "message": _(getMessage(organisations_errors, internal_error)), "internal_error": internal_error}
            logger.error(getMessage(organisations_errors, internal_error), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as err:
            internal_error = 24026
            context = {'error': str(err), "success": False, "message": _(getMessage(organisations_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(organisations_errors, internal_error).format(err), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OrganisationSMSViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationSMS
    serializer_class = OrganisationSMSSerializer
    
    def create(self, request):
        try:
            EMAIL = "EMAIL"
            SMS = "SMS"
            BOTH = "BOTH"
            notification_mode = request.META['HTTP_NOTIFICATIONMODE'] if 'HTTP_NOTIFICATIONMODE' in request.META else BOTH
            if notification_mode == SMS or notification_mode == BOTH:
                if 'HTTP_PHONE' in request.META and 'HTTP_PHONEBODY' in request.META :
                    with transaction.atomic(): 
                        req_data = {}
                        all_ezedox_ezeurls = get_header_urls(request)
                        Message = request.META['HTTP_PHONEBODY']
                        for ezeurl in all_ezedox_ezeurls:
                                Message = Message.replace(ezeurl, all_ezedox_ezeurls[ezeurl])
                        req_data["sms_body"] = Message
                        req_data["mobile"] = request.META['HTTP_PHONE']
                        req_data["process_instance_id"] = request.META['HTTP_PROCESS_INSTANCE_ID']
                        if 'HTTP_ENTITY_ID' in request.META:
                            req_data["entity_id"] = request.META['HTTP_ENTITY_ID']
                        response = send_sms_v2(request.META['HTTP_PHONE'], Message, request, request.META['HTTP_DLTID'])
                        if response['success'] == False:
                            raise Exception('SMS Sending Failed')
                        req_data["partner_request_id"] = response['message']
                        serializer = self.serializer_class(data=req_data)
                        if serializer.is_valid():
                            obj = serializer.save()
                            context = {"success": True, "message": _(
                                "SMS Object Created successfully"), "data": serializer.data}
                            logger.info("New Dashboard has been added successfully.")
                            return Response(context, status=status.HTTP_200_OK)
                        else:
                            context = {"success": True, "message": _(
                                "Failed to create SMS Object"), "data": serializer.errors}
                            logger.error(serializer.errors)
                            return Response(context, status=status.HTTP_400_BAD_REQUEST)
                        if notification_mode == "SMS":
                            context = {"success": True, "message": _(
                                "SMS Object Created successfully"), "data": serializer.data}
                            logger.info("New Dashboard has been added successfully.")
                            return Response(context, status=status.HTTP_200_OK)
                else:
                    logger.info("Bad Request : Missing details for sending SMS")
                    if notification_mode == SMS :
                        context = {"success": True, "message": _("Email sending Failed .")}
                        return Response(context, status=status.HTTP_400_BAD_REQUEST)
            if notification_mode == EMAIL or notification_mode == BOTH:
                message = request.body.decode('utf-8')
                emails = []
                emails = get_all_emails(request)
                cc_emails = []
                if 'HTTP_CC' in request.META:
                    cc_emails = request.META['HTTP_CC'].split(",")
                bcc_emails = []
                if 'HTTP_BCC' in request.META:
                    bcc_emails = request.META['HTTP_BCC'].split(",")
                subject = request.META['HTTP_SUBJECT']
                if 'HTTP_ATTACHMENTURL' in request.META:
                    attachmentUrl = request.META['HTTP_ATTACHMENTURL'].split(",")
                else:
                    attachmentUrl=None

                for email in emails:
                    if bool(re.match("^['+'][0-9]{12}@ezedox.com$", email)):
                        logger.info("Email cannot be sent for System generated Email : {}.".format(email))
                        context = {"success": True, "message": _("Email cannot be sent for System generated Email.")}
                    else:
                        if email[-1] == ';':
                            email = email[:-1]
                        recipient = [email,]
                        cc_recipient_list = cc_emails
                        bcc_recipient_list = bcc_emails
                        logger.info("Sending EMAIL")
                        text_content=""
                        html_content=""
                        email_type="normal"
                        ezedox_send_mail.apply_async(args=[
                            subject,
                            message,
                            recipient,
                            email_type,
                            text_content,
                            html_content,
                            cc_recipient_list,
                            bcc_recipient_list,
                            None,
                            attachmentUrl,
                            None
                        ], priority=HIGH_PRIORITY_TASK)
                context = {"success": True, "message": _("Organisation Email send successfully.")}
                logger.info(context)
                return Response(context, status=status.HTTP_200_OK)
            else:
                internal_error = 8051
                context = {"success": False, "message": _(getMessage(organisations_errors, internal_error).format(notification_mode)), "internal_error": internal_error}
                logger.error(getMessage(organisations_errors, internal_error).format(notification_mode), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            context = {'error':str(error), 'success': False, 
                        'message':'Failed to send SMS','internal_error':''}
            logger.exception(error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    
    def retrieve(self, request, pk=None):
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                context = {'error': str(
                    error), 'success': False, 'message': _("Failed to get sms object for id {}".format(pk))}
                logger.error("Failed to get sms object for id {}".format(pk))
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {"success": True, "message": _(
                "SMS Object retrieved successfully"), "data": serializer.data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            context = {'error':str(error), 'success': False, 
                        'message':'Failed to retrive SMS','internal_error':''}
            logger.exception(error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], name='update_sms')
    def update_sms(self, request):
        try:
            
            request_data = json.loads(request.data["data"])
            request_id = request_data[0]["requestId"]
            del_status = request_data[0]["report"][0]["desc"]
            try:
                obj = self.model.objects.get(partner_request_id=request_id)
            except Exception as error:
                context = {'error': str(
                    error), 'success': False, 'message': _("Failed to get sms object")}
                logger.error("Failed to get sms object for id")
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            obj.delivery_status = del_status
            obj.save()
            context = {
                "success": True, "message": _("Organisation SMS updated successfully."), "data": self.serializer_class(obj).data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            context = {'error':str(error), 'success': False, 
                        'message':'Failed to update SMS','internal_error':''}
            logger.exception(error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['patch'], name='retry_sms')
    def retry_sms(self, request, pk=None):
        try:
            try:
                obj = self.get_object()
            except Exception as error:
                context = {'error': str(
                    error), 'success': False, 'message': _("Failed to get sms object for id {}".format(pk))}
                logger.error("Failed to get sms object for id {}".format(pk))
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            if(obj.delivery_status != 'STATUS_AWAITING'):
                response = send_sms_v2(obj.mobile, obj.sms_body, request, obj.dlt_id)
            else:
                context = {'error': "Failed to retry because of status is pending", 'success': False, 'message': _("Failed to retry because of status is pending")}
                logger.error("Failed to retry because of status is pending")
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            if response['success'] == False:
                raise Exception('SMS Sending Failed')
            else:
                obj.partner_request_id = response["message"]
            obj.save()
            context = {"success": True, "message": _(
                "SMS send successfully")}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            context = {'error':str(error), 'success': False, 
                        'message':'Failed to retry SMS','internal_error':''}
            logger.exception(error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)