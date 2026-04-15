import json
import re
import os
import base64
from io import BytesIO
from datetime import datetime, timedelta, time
import tempfile
import shutil
import uuid

from weasyprint import HTML

import requests
from PIL import Image, ImageDraw, ImageFont
from fpdf import FPDF
import dateutil.parser as parser
from django.core.exceptions import ObjectDoesNotExist
from django import template
from django.db import transaction

from django.db.models.expressions import RawSQL
from django.template import Template, Context
from django.core.files import File
from django.core.mail import EmailMessage
from django.core.mail.backends.smtp import EmailBackend
from django.utils.decorators import method_decorator
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.translation import gettext as _
from rest_framework import generics, status, viewsets, filters, serializers
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import CreateAPIView
from rest_framework_api_key.permissions import HasAPIKey
from rest_framework.exceptions import NotFound

import process_engine
from ezedox.settings import AWS_STORAGE_BUCKET_NAME
#dont remove this import, it reads the function and run it
from apps.org_config.utils import trigger_deadletterjobs_report

from apps.org_apps.models import OrganisationWorkflow
from apps.org_apps.utils import get_system_filter_value, utc_date_conversion
from apps.org_form.models import OrganisationFile
from apps.org_users.models import OrganisationUser
from apps.org_config.models import CustomAttribute
from apps.org_users.utils import get_tenant
from apps.organisations.models import OrganisationLicense
from apps.url_shortner.utils import get_header_urls
from apps.license.decorators import permission_and_license_required, license_required
from apps.org_form.models import Transaction
from apps.org_users.models import OrganisationUser
from apps.org_entity.models import OrganisationEntityMasterData
from apps.organisations.models import Organisation

from ezedox.celery import app
from ezedox.settings import AWS_SES_REGION_NAME, HIGH_PRIORITY_TASK, PLATFORM_BASE_URL, PLATFORM_INTERNAL_TOKEN, MEDIUM_PRIORITY_TASK
from utils import storage_utils
from utils.cipher import AESCipher
from utils.sms import send_sms, send_sms_v2
from utils.email import ezedox_send_mail
from utils.loggerwrapper import Logger, getMessage, getLogMessage
from utils.process_engine_proxy import call
from utils.serializers import EmptySerializer
from utils.prime_generic_methods import get_custom_field_errors
from utils.CustomSearch import CustomSearchFilter, get_filter_fields
from utils.dynamic_serializers import DynamicFieldsModelSerializer

from .models import SMTPSettings, ReportTemplate , DocumentTemplate, EmailIdentity, CustomAttribute, EmailDigest, DashboardView, JobConfigView, EventConfigView, ChartName
from .serializers import OrganisationSMTPSerializer, ReportTemplateSerializer, DocumentTemplateSerializer, EmailIdentitySerializer, CustomAttributeSerializer, EmailDigestSerializer, DashboardViewSerializer, JobConfigViewSerializer, EventConfigViewSerializer,ChartNameSerializer
from .utils import send_bulk_email_sms, get_all_emails, report_generation ,doc_generator, entity_report_creation, get_date_string
from .internal_errors import org_config_errors
from .filters import ReportTemplate_filter_fields, CustomAttribute_filter_fields, DashboardView_filter_fields, JobConfigView_filter_fields, EventConfigView_filter_fields


logger = Logger(__name__)

register = template.Library()
cipher_obj = AESCipher()

COMPARISION = {
    "EQUALS": "equals",
    "NOT_EQUALS": "notEquals",
    "NOT_EQUALS_IGNORE_CASE": "notEqualsIgnoreCase",
    "EQUALS_IGNORE_CASE": "equalsIgnoreCase",
    "GREATER_THAN": "greaterThan",
    "GREATER_THAN_OR_EQUALS": "greaterThanOrEquals",
    "LESS_THAN": "lessThan",
    "LESS_THAN_OR_EQUALS": "lessThanOrEquals",
    "LIKE": "like",
    "LIKE_IGNORE_CASE": "likeIgnoreCase"

}

SUPPORTED_FILES = {
    "esi" :  "doc_generation_templates/esi.json",
    "esi_v2" :  "doc_generation_templates/esi_v2.json",
    "epf" :  "doc_generation_templates/epf.json",
    "gratuity" :  "doc_generation_templates/gratuity.json",
    "pf-declaration" :  "doc_generation_templates/pf-declaration.json",
    "pf-nomination" :  "doc_generation_templates/pf-nomination.json",
    "form_11" : "doc_generation_templates/form_11.json",
    "bb_form_11" : "doc_generation_templates/Bb/form11.json",
    "bb_nomination":"doc_generation_templates/Bb/pf-nomination.json"
}

class OrganisationSMTPViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    model = SMTPSettings
    queryset = SMTPSettings.objects.all()
    serializer_class = OrganisationSMTPSerializer

    @method_decorator(permission_and_license_required(["org_config.view_smtpsettings", ]))
    def list(self, request):
        logger.info("{} request to list SMTP".format(get_email(request)))
        try:
            serializer = self.serializer_class(
                self.get_queryset().first())
            context = {
                "success": True, "message": _("Organisation SMTP settings returned successfully."), "data": serializer.data}
            logger.info("{}, Organisation SMTP settings returned successfully.".format(get_email(request)))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 8001
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}

            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @method_decorator(permission_and_license_required(["org_config.add_smtpsettings", ]))
    def create(self, request):
        logger.info("{} sent data to create SMTP".format(get_email(request)))
        try:

            if self.get_queryset().first():
                validated_data = request.data
                obj = self.get_queryset().first()
                serializer = self.serializer_class(obj, data=validated_data, partial = True)
                if serializer.is_valid():
                    if request.data['is_service_active']:
                        ses_obj = EmailIdentity.objects.first()
                        if ses_obj:
                            ses_obj.is_service_active = False
                            ses_obj.save()
                        obj = serializer.save()
                        context = {"success": True, "message": _(
                            "Organisation SMTP Settings has been added successfully."), "data": self.serializer_class(obj).data}
                        logger.info("{}, Organisation SMTP Settings has been added successfully.".format(get_email(request)))
                        return Response(context, status=status.HTTP_200_OK)
                internal_error = 8002
                context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), serializer.errors), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            else:
                validated_data = request.data
                # validated_data['email'] =  cipher_obj.encrypt(request.data['email'])
                # validated_data['password'] =  cipher_obj.encrypt(request.data['password'])
                serializer = self.serializer_class(data=validated_data)
                if serializer.is_valid():
                    if request.data['is_service_active']:
                        ses_obj = EmailIdentity.objects.first()
                        if ses_obj:
                            ses_obj.is_service_active = False
                            ses_obj.save()
                        obj = serializer.save()
                        context = {"success": True, "message": _(
                            "Organisation SMTP Settings has been added successfully."), "data": self.serializer_class(obj).data}
                        logger.info("{}, Organisation SMTP Settings has been added successfully.".format(get_email(request)))
                        return Response(context, status=status.HTTP_200_OK)
                    internal_error = 8003
                    context = {'error': get_custom_field_errors(
                        serializer.errors), "success": False, "message": _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                    logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), serializer.errors), internal_error)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
                internal_error = 8004
                context = {'error': get_custom_field_errors(
                        serializer.errors), "success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), serializer.errors), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 8005
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}

            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



    @action(detail=False, methods=['post'], name='smtp-test')
    def test_smtp(self, request):

        logger.info("{} sent data to test Organisation SMTP settings".format(get_email(request)))
        try:
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                connection = EmailBackend(host=serializer._validated_data['host'], port=serializer._validated_data['port'],
                                          username=serializer._validated_data['email'],
                                          password=serializer._validated_data['password'],
                                          use_tls=True if serializer._validated_data[
                                              'encryption'] == 1 else False,
                                          use_ssl=True if serializer._validated_data[
                                              'encryption'] == 2 else False,
                                          fail_silently=False)
                recipient_list = [get_email(request), ]
                subject = 'Test mail from ezeDox'
                message = 'Your SMTP details are verified, you can go ahead and save your SMTP settings now.'
                mail = EmailMessage(subject=subject, body=message,
                                    from_email=serializer._validated_data['email'], to=recipient_list, connection=connection)
                if mail.send():
                    context = {
                        "success": True, "message": _("Organisation SMTP settings tested successfully."),  "data": dict(serializer.validated_data)}
                    logger.info("{}, Organisation SMTP settings tested successfully.".format(get_email(request)))
                    return Response(context, status=status.HTTP_200_OK)
            internal_error = 8006
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_config_errors, internal_error)), "data": request.data, "internal_error": internal_error}
            logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 8007
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_config_errors, internal_error)), "data": request.data}

            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, pk=None):
        context = {'error': '', 'success': False,
                   'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, pk=None):
        context = {'error': '', 'success': False,
                   'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def partial_update(self, request, pk=None):
        context = {'error': '', 'success': False,
                   'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def update(self, request, pk=None):
        context = {'error': '', 'success': False,
                   'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)


class TenantSMS(CreateAPIView):
    permission_classes = [AllowAny]
    model = SMTPSettings
    queryset = SMTPSettings.objects.all()
    serializer_class = OrganisationSMTPSerializer

    def create(self, request):
        logger.info("sent data to create Tenant Email")
        try:
            body = json.loads(request.body.decode('utf-8'))
            all_ezedox_ezeurls = get_header_urls(request)
            if 'phone' in body and 'phonebody' in body :
                logger.info("Sending SMS")
                PhoneNumber=body['phone']
                Message=body['phonebody']
                if 'sms_sender_id' in body:
                    sms_sender_id = body["sms_sender_id"]
                else:
                    sms_sender_id = None
                for ezeurl in all_ezedox_ezeurls:
                    Message = Message.replace(ezeurl, all_ezedox_ezeurls[ezeurl])
                if "dltid" in body:
                    DLT_ID = body['dltid']
                    response = send_sms(PhoneNumber, Message, request, DLT_TE_ID=DLT_ID, ezeurl=True, sms_sender_id=sms_sender_id)
                else:
                    response = send_sms(PhoneNumber, Message, request,None, ezeurl=True, sms_sender_id=sms_sender_id)
                return response
            else:
                logger.info("Bad Request : Missing details for sending SMS")
                context = {"success": False, "message": _("SMS sending Failed .")}
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 8008
            context = {'error': str(error), "success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TenantEmail(CreateAPIView):
    permission_classes = [AllowAny]
    model = SMTPSettings
    queryset = SMTPSettings.objects.all()
    serializer_class = OrganisationSMTPSerializer

    def create(self, request, tenant=None):
        logger.info("Data recieved to create Tenant Email")
        EMAIL = "EMAIL"
        SMS = "SMS"
        BOTH = "BOTH"
        try:
            logger.info(request.META)
            notification_mode = request.META['HTTP_NOTIFICATIONMODE'] if 'HTTP_NOTIFICATIONMODE' in request.META else BOTH
            logger.info("EMAIL , SMS flag : {}".format(notification_mode))
            all_ezedox_ezeurls = get_header_urls(request)
            if notification_mode == SMS or notification_mode == BOTH:
                if 'HTTP_PHONE' in request.META and 'HTTP_PHONEBODY' in request.META:
                    logger.info("Sending SMS")
                    PhoneNumber, Message=request.META['HTTP_PHONE'], request.META['HTTP_PHONEBODY']
                    for ezeurl in all_ezedox_ezeurls:
                        Message = Message.replace(ezeurl, all_ezedox_ezeurls[ezeurl])
                    ezeurl_sms = notification_mode == 'SMS'
                    try:
                        if 'HTTP_DLTID' in request.META:
                            response = send_sms_v2(PhoneNumber, Message, request.META['HTTP_DLTID'], sms_sender_id="BPLACE")
                        else:
                            response = send_sms_v2(PhoneNumber, Message, sms_sender_id="BPLACE")
                        if notification_mode == SMS:
                            if response['type'] != 'success':
                                context = {"success": False, "message": _('Unable to send message'), "error": response['message']}
                                status_var = status.HTTP_400_BAD_REQUEST
                            else:
                                context = {"success": True, "message": _("SMS sent successfully through MSG91 on {}".format(PhoneNumber))}
                                status_var = status.HTTP_200_OK
                            return Response(context, status=status_var)
                    except Exception as error:
                        internal_error = 8009
                        logger.exception(getLogMessage(org_config_errors, internal_error).format(error, Message), internal_error)
                        if notification_mode == SMS:
                            context = {"success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
                            return Response(context, status=status.HTTP_400_BAD_REQUEST)
                else:
                    internal_error = 8010
                    logger.error(getLogMessage(org_config_errors, internal_error), internal_error)
                    if notification_mode == SMS :
                        context = {"success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
                        return Response(context, status=status.HTTP_400_BAD_REQUEST)
            if notification_mode == EMAIL or notification_mode == BOTH:
                message = request.body.decode('utf-8')
                emails=[]
                emails = get_all_emails(request)
                email_list = []
                for check_email in emails:
                    if bool(re.match("^['+'][0-9]{12}@ezedox.com$", check_email)):
                        logger.info("Email cannot be sent for System generated Email : {}.".format(check_email))
                    else:
                        email_list.append(check_email)
                if len(email_list) == 0:
                    context = {"success": False, "message": _("Email cannot be sent for System generated Email.")}
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
                else:
                    cc_emails = []
                    if 'HTTP_CC' in request.META:
                        cc_emails = request.META['HTTP_CC'].split(",")
                    bcc_emails = []
                    if 'HTTP_BCC' in request.META:
                        bcc_emails = request.META['HTTP_BCC'].split(",")
                    subject = request.META['HTTP_SUBJECT']
                    recipient_list = email_list
                    recipient_list = list(dict.fromkeys(recipient_list))
                    cc_recipient_list = cc_emails
                    bcc_recipient_list = bcc_emails
                    logger.info("Sending EMAIL")
                    text_content=""
                    html_content=""
                    email_type="normal"
                    for ezeurl in all_ezedox_ezeurls:
                        message = message.replace(ezeurl, all_ezedox_ezeurls[ezeurl])
                    if 'HTTP_ATTACHMENTURL' in request.META:
                        attachmentUrl = request.META['HTTP_ATTACHMENTURL'].split(",")
                    else:
                        attachmentUrl=None
                    try:
                        ezedox_send_mail.apply_async(args=[
                            subject,
                            message,
                            recipient_list,
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
                    except Exception as error:
                        internal_error = 8011
                        context = {"success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
                        logger.exception(getLogMessage(org_config_errors, internal_error).format(error, message), internal_error)
                        return Response(context, status=status.HTTP_400_BAD_REQUEST)
            else:
                internal_error = 8012
                context = {"success": False, "message": _(getMessage(org_config_errors, internal_error).format(notification_mode)), "internal_error": internal_error}
                logger.error(getMessage(org_config_errors, internal_error).format(notification_mode), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 8013
            context = {'error': str(error), "success": False, "message": _(
                getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReportDownloadViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = ReportTemplate
    queryset = ReportTemplate.objects.all()
    serializer_class = ReportTemplateSerializer

    def retrieve(self, request, pk=None, tenant=None):
        context = {'error': '', 'success': False,
                   'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def create(self, request, pk=None, tenant=None):
        context = {'error': '', 'success': False,
                   'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=True, methods=['post'], name='report_download')
    # @method_decorator(permission_and_license_required(["org_config.download_reporttemplate"]))
    def report_download(self, request, pk=None, tenant=None):
        logger.info("{}, Sent data to generate report for id: {} for tenant: {}".format(get_email(request), pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 8014
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}

                logger.error(getLogMessage(org_config_errors, internal_error).format(pk, get_email(request), error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            # TODO exception handling for Process Engine CallsS
            transaction_id = uuid.uuid4()
            error_message = 'Failed to generate reports'
            report_type = request.data["report_type"]
            query = request.data['query']
            date_com_list = ["startedAfter","startedBefore","finishedAfter","finishedBefore"]
            for q_data in query["query"]:
                if q_data["attribute"] in date_com_list:
                    if q_data["value"]:
                        q_data["value"] = get_date_string(q_data["attribute"], q_data["value"])
            selected_fields = request.data['selected_fields']
            engine_url = OrganisationLicense.objects.get(organisation=tenant).processengine
            org_user = OrganisationUser.default_manager.get(email=get_email(request))

            if report_type < 4:
                started_after = ""
                finished_before = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
                #daily
                if report_type == 1:
                    now = datetime.now()
                    start_of_day = datetime(now.year,now.month,now.day)
                    started_after = start_of_day.strftime("%Y-%m-%dT%H:%M:%SZ")
                #weekly
                elif report_type == 2:
                    today = datetime.now().date()
                    start = today - timedelta(days=today.weekday())
                    started_after = start.strftime("%Y-%m-%dT%H:%M:%SZ")
                #monthly
                elif report_type == 3:
                    today = datetime.now()
                    first = today.replace(day=1)
                    started_after =  first.strftime("%Y-%m-%dT%H:%M:%SZ")
                if obj.process_type == "ONGOING":
                    start_query_obj ={}
                    start_query_obj["type"] = "common"
                    start_query_obj["comparision"] = "EQUALS"
                    start_query_obj["attribute"] = "startedAfter"
                    start_query_obj["value"] = started_after
                    query['query'].append(start_query_obj)
                elif obj.process_type == "COMPLETED" or obj.process_type == "WITHDRAWN":
                    finished_query_obj = {}
                    finished_query_obj["type"] = "common"
                    finished_query_obj["comparision"] = "EQUALS"
                    finished_query_obj["attribute"] = "finishedAfter"
                    finished_query_obj["value"] = started_after
                    query['query'].append(finished_query_obj)
                    finished_query_obj = {}
                    finished_query_obj["type"] = "common"
                    finished_query_obj["comparision"] = "EQUALS"
                    finished_query_obj["attribute"] = "finishedBefore"
                    finished_query_obj["value"] = finished_before
                    query['query'].append(finished_query_obj)
                else:
                    start_query_obj ={}
                    start_query_obj["type"] = "common"
                    start_query_obj["comparision"] = "EQUALS"
                    start_query_obj["attribute"] = "startedAfter"
                    start_query_obj["value"] = started_after
                    query['query'].append(start_query_obj)
                    finished_query_obj = {}
                    finished_query_obj["type"] = "common"
                    finished_query_obj["comparision"] = "EQUALS"
                    finished_query_obj["attribute"] = "finishedAfter"
                    finished_query_obj["value"] = started_after
                    query['query'].append(finished_query_obj)
                    finished_query_obj = {}
                    finished_query_obj["type"] = "common"
                    finished_query_obj["comparision"] = "EQUALS"
                    finished_query_obj["attribute"] = "finishedBefore"
                    finished_query_obj["value"] = finished_before
                    query['query'].append(finished_query_obj)

            if obj.is_involved:
                involved_user_query_obj = {}
                involved_user_query_obj["type"] = "common"
                involved_user_query_obj["comparision"] = "EQUALS"
                involved_user_query_obj["attribute"] = "involvedUser"
                involved_user_query_obj["value"] = get_email(request)
                query['query'].append(involved_user_query_obj)
            if obj.process_type == "ONGOING":
                ongoing_query_obj = {}
                ongoing_query_obj["type"] = "common"
                ongoing_query_obj["comparision"] = "EQUALS"
                ongoing_query_obj["attribute"] = "finished"
                ongoing_query_obj["value"] = False
                query['query'].append(ongoing_query_obj)
            elif obj.process_type == "COMPLETED":
                completed_query_obj = {}
                completed_query_obj["type"] = "common"
                completed_query_obj["comparision"] = "EQUALS"
                completed_query_obj["attribute"] = "finished"
                completed_query_obj["value"] = True
                query['query'].append(completed_query_obj)
                completed_query_obj = {}
                completed_query_obj["type"] = "common"
                completed_query_obj["comparision"] = "EQUALS"
                completed_query_obj["attribute"] = "deleted"
                completed_query_obj["value"] = False
                query['query'].append(completed_query_obj)
            elif obj.process_type == "WITHDRAWN":
                withdrawn_query_obj = {}
                withdrawn_query_obj["type"] = "common"
                withdrawn_query_obj["comparision"] = "EQUALS"
                withdrawn_query_obj["attribute"] = "deleted"
                withdrawn_query_obj["value"] = True
                query['query'].append(withdrawn_query_obj)
                withdrawn_query_obj = {}
                withdrawn_query_obj["type"] = "common"
                withdrawn_query_obj["comparision"] = "EQUALS"
                withdrawn_query_obj["attribute"] = "finished"
                withdrawn_query_obj["value"] = True
                query['query'].append(withdrawn_query_obj)
            else:
                pass
            or_query = []
            if obj.user_filter and len(obj.user_filter) > 0:
                for filters in obj.user_filter:
                    if filters == 'entity_location' :
                        if org_user.location:
                            user_filter_query_obj = {}
                            user_filter_query_obj["type"] = "processSpecific"
                            user_filter_query_obj["comparision"] = "EQUALS"
                            user_filter_query_obj["attribute"] = "entity_location"
                            user_filter_query_obj["value"] = org_user.location.name
                            query['query'].append(user_filter_query_obj)
                        else:
                            error_message = "Location is not set for your account. Please contact the system administrator."
                            raise Exception('Location not set for {}'.format(get_email(request)))
                    elif filters == 'entity_department':
                        if org_user.department:
                            user_filter_query_obj = {}
                            user_filter_query_obj["type"] = "processSpecific"
                            user_filter_query_obj["comparision"] = "EQUALS"
                            user_filter_query_obj["attribute"] = "entity_department"
                            user_filter_query_obj["value"] = org_user.department.name
                            query['query'].append(user_filter_query_obj)
                        else:
                            error_message = "Department is not set for your account. Please contact the system administrator."
                            raise Exception('Department not set for {}'.format(get_email(request)))
                    else:
                        if CustomAttribute.objects.filter(type="users").exists():
                            if filters in org_user.extra_fields.keys() and org_user.extra_fields[filters]:
                                if isinstance(org_user.extra_fields[filters],(str,int)):
                                    user_filter_query_obj = {}
                                    user_filter_query_obj["type"] = "processSpecific"
                                    user_filter_query_obj["comparision"] = "EQUALS"
                                    user_filter_query_obj["attribute"] = filters
                                    user_filter_query_obj["value"] = org_user.extra_fields[filters]
                                    query['query'].append(user_filter_query_obj)
                                elif isinstance(org_user.extra_fields[filters],dict):
                                    user_filter_query_obj = {}
                                    user_filter_query_obj["type"] = "processSpecific"
                                    user_filter_query_obj["comparision"] = "EQUALS"
                                    user_filter_query_obj["attribute"] = filters
                                    user_filter_query_obj["value"] = org_user.extra_fields[filters]
                                    user_filter_query_obj["filter"] =  org_user.extra_fields[filters]
                                    or_query.append(user_filter_query_obj)
                                elif isinstance(org_user.extra_fields[filters],(list)):
                                    for filter_s in org_user.extra_fields[filters]:
                                        user_filter_query_obj = {}
                                        user_filter_query_obj["type"] = "processSpecific"
                                        user_filter_query_obj["comparision"] = "EQUALS"
                                        user_filter_query_obj["attribute"] = filters
                                        user_filter_query_obj["value"] = filter_s["value"]
                                        user_filter_query_obj["filter"] = filter_s["value"]
                                        or_query.append(user_filter_query_obj)
                            else:
                                error_message = "Your account is not configured correctly. Please contact the system administrator."
                                raise Exception('Keys or value of custom attribute not set for {}'.format(get_email(request)))
                        else:
                            user_filter_query_obj = {}
                            user_filter_query_obj["type"] = "processSpecific"
                            user_filter_query_obj["comparision"] = "EQUALS"
                            user_filter_query_obj["attribute"] = filters
                            user_filter_query_obj["value"] = ""
                            query['query'].append(user_filter_query_obj)
            if obj.send_via_email:
                report_generation.apply_async(args=[engine_url, tenant, obj.apps.process_key, COMPARISION, selected_fields, query, or_query, [get_email(request)], obj.name, True,request.scheme,request.get_host(),str(obj.id),get_email(request), transaction_id], queue= "report_queue", priority=HIGH_PRIORITY_TASK)
                context = {"success": True, "message": _(
                    "The Report will be emailed to you shortly.")}
                logger.info("{}, Report Generation successfully sent to celery for Report for id: {}".format(get_email(request), pk))
                return Response(context, status=status.HTTP_200_OK)
            else:
                report_generation.apply_async(args=[engine_url, tenant, obj.apps.process_key, COMPARISION, selected_fields, query, or_query, [get_email(request)], obj.name, False,request.scheme,request.get_host(),str(obj.id),get_email(request), transaction_id], queue= "report_queue", priority=HIGH_PRIORITY_TASK)
                context = {"success": True, "message": _(
                    "The Report is getting generated please wait."),"transaction_id": transaction_id}
                logger.info("{}, Reports Generation successfully sent to celery for Report for id: {}".format(get_email(request), pk))
                return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 8015
            context = {'error': str(error), 'success': False, 'message': _(error_message), 'internal_error': internal_error}
            logger.exception(getMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], name='entity_report_download')
    # @method_decorator(permission_and_license_required(["org_config.download_reporttemplate"]))
    def entity_report_download(self, request, pk=None, tenant=None):
        logger.info("{}, Sent data to generate report for id: {} for tenant: {}".format(get_email(request), pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 8016
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            transaction_id = uuid.uuid4()
            master_model_id = str(obj.entity_master_model.id)
            error_message = 'Failed to generate entity reports'
            org_user = OrganisationUser.default_manager.filter(email=get_email(request))
            if obj.user_filter and len(obj.user_filter) > 0:
                user_filters = obj.user_filter[0]
                user_filter_value = get_system_filter_value(user_filters, org_user)
                if len(user_filter_value) == 0:
                    error_message = "Your account is not configured correctly. Please contact the system administrator."
                    raise Exception('Keys or value of custom attribute not set for {}'.format(get_email(request)))
            entity_report_creation.apply_async(args=[master_model_id, request.tenant.id, obj.name, obj.user_filter, obj.send_via_email, request.data,request.scheme,request.get_host(),str(obj.id),get_email(request), transaction_id],serializer="json" ,priority=HIGH_PRIORITY_TASK)
            if obj.send_via_email:
                context = {"success": True, "message": _(
                    "The Report will be emailed to you shortly.")}
                logger.info("{}, Reports Generation successfully sent to celery for entity report for id: {} for tenant: {}".format(get_email(request), pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            else:
                context = {"success": True, "message": _(
                    "The Report is getting generated please wait."), "transaction_id": transaction_id}
                logger.info("{}, Reports Generation successfully sent to celery for entity report for id: {} for tenant: {}".format(get_email(request), pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 8018
            context = {'error': str(error), 'success': False, 'message': _(error_message), 'internal_error': internal_error}
            logger.exception(getMessage(org_config_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def list(self, request, pk=None, tenant=None):
        context = {'error': '', 'success': False,
                   'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, pk=None, tenant=None):
        context = {'error': '', 'success': False,
                   'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def update(self, request, pk=None, tenant=None):
        context = {'error': '', 'success': False,
                   'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def partial_update(self, request, pk=None, tenant=None):
        context = {'error': '', 'success': False,
                   'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)

def date_to_obj(d_str):
    # Assuming Date coming as dd MMM yyyy
    import dateutil.parser
    date_obj = dateutil.parser.parse(d_str)
    dy = date_obj.strftime('%-d')
    mn = date_obj.strftime('%-m')
    yr = date_obj.strftime('%-Y')
    dy = str(dy) if int(dy) > 9 else "0" + str(dy)
    mn = str(mn) if int(mn) > 9 else "0" + str(mn)
    return {"day": dy, "month": mn, "year": yr}


class DocGenerator(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = OrganisationWorkflow
    queryset = OrganisationWorkflow.objects.all()
    serializer_class = OrganisationSMTPSerializer

    # def get_permissions(self):
    #     permission_classes = [has_open_access_or_has_api_key_access_or_individual_permission]
    #     return [permission([]) for permission in permission_classes]

    def create(self, request, tenant=None):
        logger.info("sent data to create Document for tenant: {}".format(tenant))
        try:
            try:
                processInstanceId = request.META['HTTP_PROCESSINSTANCEID']
                logger.info("Document is getting generated for process : {} for tenant: {}".format(str(processInstanceId), tenant))
            except Exception as error:
                internal_error = 8019
                context = {'error' : str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                logger.exception(getLogMessage(org_config_errors, internal_error).format(str(processInstanceId), error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            dirpath = tempfile.mkdtemp()
            temp_file_directory_address = dirpath + "/"
            data = json.loads(request.body.decode("utf-8"), strict=False)

            supported_json = []
            try :
                if 'supported_files' in data:
                    supported_json = data["supported_files"]
            except Exception as error:
                supported_json = []

            logger.info(supported_json)
            supported_doc = []
            for filename in supported_json:
                supported_doc.append(SUPPORTED_FILES.get(filename))

            logger.info(supported_json)

            # create font object with the font file and specify
            # desired size

            # font_path = "Roboto-Black.ttf"
            font = ImageFont.truetype('Arial.ttf', size=20, encoding="unic")
            font_18 = ImageFont.truetype('Arial.ttf', size=18, encoding="unic")
            font_bold = ImageFont.truetype(
                'Arial Bold.ttf', size=20, encoding="unic")

            # starting position of the message
            color = 'rgb(0, 0, 0)'  # black color

            response = []
            request_data = data.copy()

            #TODO Revisit the logic of getting base64 from signature
            if 'signature' in request_data and request_data['signature'] != "":
                request_data['signature'] = re.sub('^data:image/.+;base64,',
                                   '', request_data['signature'])
            if 'person_photo' in data and data['person_photo'] != "[]":
                person_photo = data['person_photo'][0]['data']['url']

            for jsn in supported_doc:
                with open(jsn) as f:
                    data = json.load(f)
                    page_no = 0
                    image_list = []
                    for page in data["pages"]:
                        page_no = page_no + 1
                        image = Image.open(page["template_file_name"])
                        draw = ImageDraw.Draw(image)
                        for property in page["prop_coordinates"]:
                            try:
                                font_to_use = font
                                if "prop_size"in property and property["prop_size"] == "font_size":
                                    font_to_use = font_18

                                if "prop_type" in property and property["prop_type"] == "image":
                                    image.paste(Image.open(requests.get((request_data[property["prop_name"]]), stream=True).raw).resize(
                                        (230, 215)), (property["x"], property["y"], property["x2"], property["y2"]))
                                elif "prop_type" in property and property["prop_type"] == "signature":
                                    image.paste(Image.open(BytesIO(base64.b64decode((request_data[property["prop_name"]])))).resize(
                                        (300, 100)), (property["x"], property["y"], property["x2"], property["y2"]), Image.open(BytesIO(base64.b64decode((request_data[property["prop_name"]])))).resize((300, 100)))
                                elif "prop_type" in property and property["prop_type"] == "sm-signature":
                                    image.paste(Image.open(BytesIO(base64.b64decode((request_data[property["prop_name"]])))).resize(
                                        (250, 50)), (property["x"], property["y"], property["x2"], property["y2"]), Image.open(BytesIO(base64.b64decode((request_data[property["prop_name"]])))).resize((250, 50)))
                                elif "check" in property:
                                    if not bool(re.match("^[0-9]{12}@ezedox.com$", request_data[property["prop_name"]])):
                                        draw.text((property["x"], property["y"]), request_data[property["prop_name"]], fill=color, font=font_to_use if property["font_weight"] == 'regular' else font_bold)
                                elif "prop_reside" in property:
                                    if request_data[property["prop_name"]] == "Yes" and property["prop_reside"] == "Yes":
                                        draw.text((property["x"], property["y"]),  (request_data[property["prop_name"]]), fill=color, font=font_to_use if property["font_weight"] == 'regular' else font_bold)
                                    elif request_data[property["prop_name"]] == "No" and property["prop_reside"] == "No" :
                                        draw.text((property["x"], property["y"]),  (request_data[property["prop_name"]]), fill=color, font=font_to_use if property["font_weight"] == 'regular' else font_bold)
                                elif "prop_type" in property and property["prop_type"] == "evaluate":
                                    draw.text((property["x"], property["y"]), (eval(property["prop_name"])), fill=color, font=font_to_use if property["font_weight"] == 'regular' else font_bold)
                                elif  "prop_type" in property and property["prop_type"] == "string":
                                    draw.text((property["x"], property["y"]), property["prop_name"], fill=color, font=font_to_use if property["font_weight"] == 'regular' else font_bold)

                                else:
                                    draw.text((property["x"], property["y"]), (request_data[property["prop_name"]]), fill=color, font=font_to_use if property["font_weight"] == 'regular' else font_bold)
                            except Exception:
                                draw.text((property["x"], property["y"]), '', fill=color, font=font_to_use if property["font_weight"] == 'regular' else font_bold)

                        # save the edited image
                        image_name = temp_file_directory_address + data["template_name"] + \
                            str(page_no) + 'Filled.jpg'
                        image_list.append(image_name)
                        image.save(temp_file_directory_address + data["template_name"] +
                                   str(page_no) + 'Filled.jpg')
                        logger.info("Image created for {}".format(temp_file_directory_address + data["template_name"] +
                                   str(page_no) + 'Filled.jpg'))

                    pdf = FPDF('P', 'mm', 'A4')
                    for image in image_list:
                        cover = Image.open(image)
                        width, height = cover.size
                        pdf.add_page()
                        pdf.image(image, 0, 0, float(
                            width * 0.17), float(height * 0.17))
                    pdf.output(temp_file_directory_address + data["template_name"] + ".pdf", "F")
                    logger.info("PDF created for {}".format(temp_file_directory_address + data["template_name"] + ".pdf"))
                    # user = User.objects.get(email = request_data["email"])
                    transaction_obj =  Transaction.objects.filter(process_instance_id = processInstanceId).first()
                    file_upload = OrganisationFile.objects.create(
                        name=data["template_name"] + ".pdf",
                        content_type="application/pdf",
                        file=File(
                            open(temp_file_directory_address + data["template_name"] + ".pdf", 'rb'), name=data["template_name"] + ".pdf"),
                        process_instance_id=processInstanceId,
                        doc_type=OrganisationFile.TYPE_CHOICES[2][0],
                        # user = user,
                        transaction_id = transaction_obj
                    )
                    file_upload.tags.add('Generated')
                    new_file_key = file_upload.file.name
                    logger.info("/files/" + new_file_key)
                    try:
                        storage_utils.load_file(file_upload)
                    except Exception as error:
                        if error.response['Error']['Code'] == "404":
                            logger.error("Unable to check the file in S3")
                            context = {'error': str(error), 'success': False,
                                'message': _('Unable to check the file in S3.')}
                            return Response(context, status=status.HTTP_400_BAD_REQUEST)
                        else:
                            logger.exception("Unexpected Error occured {}".format(error))
                            context = {'error': str(error), 'success': False,
                                'message': _('Unable to check the file in S3.')}
                            return Response(context, status=status.HTTP_400_BAD_REQUEST)
                    logger.info("Generated Document Id : {}".format(str(file_upload.id)))
                    #TODO : Refactor the 2 ways of generating documents

                    var_response = {}
                    var_response["originalName"] = file_upload.name
                    var_response["type"] = file_upload.content_type
                    var_response["name"] = file_upload.name
                    var_response["size"] = file_upload.file.size
                    var_response["storage"] = "url"
                    var_response["url"] = "{0}://{1}{2}".format(request.scheme, request.get_host(), "/api/forms/files/" + str(file_upload.id))
                    var_response["data"] = {}
                    var_response["data"]["name"] = file_upload.name
                    var_response["data"]["form"] = ""
                    var_response["data"]["baseUrl"] = ""
                    var_response["data"]["size"] = file_upload.file.size
                    var_response["data"]["url"] = "{0}://{1}{2}".format(request.scheme, request.get_host(), "/api/forms/files/" + str(file_upload.id))
                    var_response["data"]["project"] = ""
                    response.append(var_response)
            shutil.rmtree(dirpath)
            # context = {"success": True, "message": _(
            #     "Document generated Successfully"), "data" : file_upload.id}
            logger.info(" Documents generated successfully")
            return Response(response, status=status.HTTP_200_OK)

        except Exception as error:
            shutil.rmtree(dirpath)
            internal_error = 8020
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], name='esi_generation')
    def esi_v2(self, request, tenant=None):
        try:
            try:
                processInstanceId = request.META['HTTP_PROCESSINSTANCEID']
                action = call(module = process_engine.ProcessInstanceVariablesApi, func = process_engine.ProcessInstanceVariablesApi.list_process_instance_variables, data={"process_instance_id": processInstanceId}, request= request, type="get")[0]
                process_instance_variables = action
                request_data = {}
                for variables in process_instance_variables:
                    if 'type' in variables and variables['type'] == 'date':
                        request_data[variables['name']] = '-'
                    else:
                        request_data[variables['name']] = variables['value']
                logger.info("ESI Document is getting generated for process : {} for tenant: {}".format(str(processInstanceId), tenant))
            except Exception as error:
                internal_error = 8021
                context = {'error' : str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                logger.exception(getLogMessage(org_config_errors, internal_error).format(str(processInstanceId), error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            response = []
            dirpath = tempfile.mkdtemp()
            temp_file_directory_address = dirpath + "/"
            font = ImageFont.truetype('Arial.ttf', size=20, encoding="unic")
            font_18 = ImageFont.truetype('Arial.ttf', size=18, encoding="unic")
            font_bold = ImageFont.truetype('Arial Bold.ttf', size=20, encoding="unic")
            color = 'rgb(0, 0, 0)'  # black color
            with open(SUPPORTED_FILES["esi_v2"]) as f:
                data = json.load(f)
                page_no = 0
                image_list = []
                for page in data["pages"]:
                    page_no = page_no + 1
                    image = Image.open(page["template_file_name"])
                    draw = ImageDraw.Draw(image)
                    for property in page["prop_coordinates"]:
                        try:
                            font_to_use = font
                            if "prop_size"in property and property["prop_size"] == "font_size":
                                font_to_use = font_18

                            if "prop_type" in property and property["prop_type"] == "image":
                                image.paste(Image.open(requests.get((request_data[property["prop_name"]][0]['url']), stream=True).raw).resize(
                                    (230, 215)), (property["x"], property["y"], property["x2"], property["y2"]))
                            elif "prop_type" in property and property["prop_type"] == "signature":
                                image.paste(Image.open(BytesIO(base64.b64decode((re.sub('^data:image/.+;base64,','', request_data[property["prop_name"]]))))).resize(
                                    (300, 100)), (property["x"], property["y"], property["x2"], property["y2"]), Image.open(BytesIO(base64.b64decode((request_data[property["prop_name"]])))).resize((300, 100)))
                            elif "prop_type" in property and property["prop_type"] == "sm-signature":
                                image.paste(Image.open(BytesIO(base64.b64decode((request_data[property["prop_name"]])))).resize(
                                    (250, 50)), (property["x"], property["y"], property["x2"], property["y2"]), Image.open(BytesIO(base64.b64decode((request_data[property["prop_name"]])))).resize((250, 50)))
                            elif "check" in property:
                                if not bool(re.match("^[0-9]{12}@ezedox.com$", request_data[property["prop_name"]])):
                                    draw.text((property["x"], property["y"]), request_data[property["prop_name"]], fill=color, font=font_to_use if property["font_weight"] == 'regular' else font_bold)
                            elif "prop_reside" in property:
                                if request_data[property["prop_name"]] == "Yes" and property["prop_reside"] == "Yes":
                                    draw.text((property["x"], property["y"]),  (request_data[property["prop_name"]]), fill=color, font=font_to_use if property["font_weight"] == 'regular' else font_bold)
                                elif request_data[property["prop_name"]] == "No" and property["prop_reside"] == "No" :
                                    draw.text((property["x"], property["y"]),  (request_data[property["prop_name"]]), fill=color, font=font_to_use if property["font_weight"] == 'regular' else font_bold)
                            elif "prop_type" in property and property["prop_type"] == "evaluate":
                                draw.text((property["x"], property["y"]), (eval(property["prop_name"])), fill=color, font=font_to_use if property["font_weight"] == 'regular' else font_bold)
                            elif  "prop_type" in property and property["prop_type"] == "string":
                                draw.text((property["x"], property["y"]), property["prop_name"], fill=color, font=font_to_use if property["font_weight"] == 'regular' else font_bold)

                            else:
                                draw.text((property["x"], property["y"]), (request_data[property["prop_name"]]), fill=color, font=font_to_use if property["font_weight"] == 'regular' else font_bold)
                        except Exception:
                            draw.text((property["x"], property["y"]), '', fill=color, font=font_to_use if property["font_weight"] == 'regular' else font_bold)

                    # save the edited image
                    image_name = temp_file_directory_address + data["template_name"] + \
                        str(page_no) + 'Filled.jpg'
                    image_list.append(image_name)
                    image.save(temp_file_directory_address + data["template_name"] +
                                str(page_no) + 'Filled.jpg')
                    logger.info("Image created for {}".format(temp_file_directory_address + data["template_name"] +
                                str(page_no) + 'Filled.jpg'))

                pdf = FPDF('P', 'mm', 'A4')
                for image in image_list:
                    cover = Image.open(image)
                    width, height = cover.size
                    pdf.add_page()
                    pdf.image(image, 0, 0, float(
                        width * 0.17), float(height * 0.17))
                pdf.output(temp_file_directory_address + data["template_name"] + ".pdf", "F")
                logger.info("PDF created for {} for tenant: {}".format(temp_file_directory_address + data["template_name"] + ".pdf", tenant))
                transaction_obj =  Transaction.objects.filter(process_instance_id = processInstanceId).first()
                file_upload = OrganisationFile.objects.create(
                    name=data["template_name"] + ".pdf",
                    content_type="application/pdf",
                    file=File(
                        open(temp_file_directory_address + data["template_name"] + ".pdf", 'rb'), name=data["template_name"] + ".pdf"),
                    process_instance_id=processInstanceId,
                    doc_type=OrganisationFile.TYPE_CHOICES[2][0],
                    transaction_id = transaction_obj
                )
                os.remove(temp_file_directory_address + data["template_name"] + ".pdf")
                file_upload.tags.add('Generated')
                new_file_key = file_upload.file.name
                logger.info("/files/" + new_file_key)
                try:
                    storage_utils.load_file(file_upload)
                except Exception as error:
                    if error.response['Error']['Code'] == "404":
                        logger.error("Unable to check the file in S3")
                        context = {'error': str(error), 'success': False,
                            'message': _('Unable to check the file in S3.')}
                        return Response(context, status=status.HTTP_400_BAD_REQUEST)
                    else:
                        logger.exception("Unexpected Error occured {}".format(error))
                        context = {'error': str(error), 'success': False,
                                'message': _('Unable to check the file in S3.')}
                        return Response(context, status=status.HTTP_400_BAD_REQUEST)
                logger.info("Generated Document Id : {} for tenant: {}".format(str(file_upload.id), tenant))
                var_response = {}
                var_response["originalName"] = file_upload.name
                var_response["type"] = file_upload.content_type
                var_response["name"] = file_upload.name
                var_response["size"] = file_upload.file.size
                var_response["storage"] = "url"
                var_response["url"] = "{0}://{1}{2}".format(request.scheme, request.get_host(), "/api/forms/files/" + str(file_upload.id))
                var_response["data"] = {}
                var_response["data"]["name"] = file_upload.name
                var_response["data"]["form"] = ""
                var_response["data"]["baseUrl"] = ""
                var_response["data"]["size"] = file_upload.file.size
                var_response["data"]["url"] = "{0}://{1}{2}".format(request.scheme, request.get_host(), "/api/forms/files/" + str(file_upload.id))
                var_response["data"]["project"] = ""
                response.append(var_response)
                shutil.rmtree(dirpath)
                logger.info(" Documents generated successfully for tenant: {}".format(tenant))
                return Response(response, status=status.HTTP_200_OK)
        except Exception as error:
            shutil.rmtree(dirpath)
            internal_error = 8022
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReportTemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = ReportTemplate
    queryset = ReportTemplate.objects.all()
    serializer_class = ReportTemplateSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = ReportTemplate_filter_fields
    filter_fields = get_filter_fields(ReportTemplate_filter_fields)
    ordering_fields = ReportTemplate_filter_fields

    def list(self, request, tenant=None):
        logger.info("{} requested to get the list of Report Templates for tenant: {}".format(get_email(request), tenant))
        filtered_queryset = None
        pagination_data = None
        try:
            filtered_queryset = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant))
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True)
            context = {
                "success": True, "message": _("Report templates returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{}, Report templates returned successfully for tenant: {}.".format(get_email(request), tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, 'count') else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,
                       'message': _('Report templates returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 8023
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_config.add_reporttemplate"]))
    def create(self, request, tenant=None, **args):
        logger.info("{} sent data to create Report Template for tenant: {}".format(get_email(request), tenant))
        try:
            modified_data = request.data
            modified_data['tenant'] = tenant
            serializer = self.serializer_class(data=modified_data)
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _(
                    "Types has been added successfully."), "data": self.serializer_class(obj).data}
                logger.info("{} Types has been added successfully for tenant: {}.".format(get_email(request), tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 8024
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 8025
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_config.change_reporttemplate"]))
    def update(self, request, pk=None, tenant=None):
        logger.info("{} sent data to partially update Report Template for id: {} for tenant: {}".format(get_email(request), pk, tenant))
        try:
            try:
                obj = self.get_object()
            except Exception as error:
                internal_error = 8026
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(
                obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {
                    "success": True, "message": _("Organisation Report templates updated successfully."), "data": self.serializer_class(obj).data}
                logger.info("{} Organisation Report templates updated successfully for id: {} for tenant: {}.".format(get_email(request), pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 8027
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_config_errors, internal_error).format(pk, get_email(request), serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 8028
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}

            logger.exception(getLogMessage(org_config_errors, internal_error).format(pk, get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_config.view_reporttemplate"]))
    def retrieve(self, request, pk=None, tenant=None):
        logger.info("{} requested to retrieve data for id:{} from Report Templates for tenant: {}".format(get_email(request), pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk)
            except Exception as error:
                internal_error = 8029
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {"success": True, "message": _(
                "Parts details retrieved successfully"), "data": serializer.data}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 8030
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(pk, get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_config.delete_reporttemplate"]))
    def destroy(self, request, pk=None, tenant=None):
        logger.info("{} requested to delete the report template for id {} for tenant: {}".format(get_email(request), pk, tenant))
        try:
            try:
                obj = self.get_object()
            except Exception as error:
                internal_error = 8031
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            self.perform_destroy(obj)
            context = {
                "success": True, "message": _("Report template deleted successfully.")}
            logger.info("{}, deleted report template successfully for id :{} for tenant: {}".format(get_email(request), pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 8032
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(pk, get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@app.task(bind=True, name='download-platform-doc')
def download_platform_doc(self, data, tenant=None, documentType=None):
    try:
        download = False
        while download == False:
            logger.info("checking for doc : " + documentType + " for entity : " + data["id"])
            #check if doc generated
            header = {
                "content-type": "application/json",
                "Authorization" : "Bearer " + PLATFORM_INTERNAL_TOKEN
            }
            reqUrl = PLATFORM_BASE_URL + "/api/employee-mgmt/org/" + str(tenant) + "/employee/" + OrganisationEntityMasterData.objects.get(id=data["id"]).bpss_id
            response = requests.request("GET", reqUrl,  headers=header)
            for item in response.json()["company_documents"]:
                if "downloadURL" in item and item["documentType"] == documentType:
                    file_obj = OrganisationFile.objects.create(
                        name= item["downloadURL"].split('/')[-1],
                        process_instance_id=None,
                        entity_id=data["id"],
                        content_type="application/pdf",
                        file=item["downloadURL"].replace('file/download/', ''),
                        doc_type=OrganisationFile.TYPE_CHOICES[2][0],
                        transaction_id = None,
                        tenant=Organisation.objects.get(id=tenant)
                    )
                    logger.info("File downloaded -  " + str(file_obj.id) + "for doc type" + documentType)
                    download = True
                    break
        logger.info("check done for doc : " + documentType + " for entity : " + data["id"])
    except Exception as error:
        internal_error = 8035
        logger.exception(error, internal_error)

class OrganisationEntityFirstDataSerializer2(DynamicFieldsModelSerializer):
    full_permanent_address = serializers.SerializerMethodField()
    full_current_address = serializers.SerializerMethodField()
    dob = serializers.SerializerMethodField()
    joiningDate = serializers.SerializerMethodField()

    def get_dob(self,obj):
        try:
            return obj.dob.strftime("%Y-%m-%d") 
        except:
            return obj.dob
    
    def get_joiningDate(self,obj):
        try:
            return obj.joiningDate.strftime("%Y-%m-%d") 
        except:
            return obj.joiningDate

    def get_full_permanent_address(self, obj):
        full_address = ''
        if obj.permanent_address_line:
            full_address = full_address + obj.permanent_address_line
        if obj.permanent_address_locality:
            full_address = full_address +","+obj.permanent_address_locality
        if obj.permanent_address_landmark:
            full_address = full_address +","+obj.permanent_address_landmark
        if obj.permanent_address_city:
            full_address = full_address +","+obj.permanent_address_city
        if obj.permanent_address_district:
            full_address = full_address +","+obj.permanent_address_district
        if obj.permanent_address_state:
            full_address = full_address +","+obj.permanent_address_state
        if obj.permanent_address_pincode:
            full_address = full_address +","+obj.permanent_address_pincode
        return full_address
    def get_full_current_address(self, obj):
        full_address = ''
        if obj.present_address_line:
            full_address = full_address + obj.present_address_line
        if obj.present_address_locality:
            full_address = full_address +","+obj.present_address_locality
        if obj.present_address_landmark:
            full_address = full_address +","+obj.present_address_landmark
        if obj.present_address_city:
            full_address = full_address +","+obj.present_address_city
        if obj.present_address_district:
            full_address = full_address +","+obj.present_address_district
        if obj.present_address_state:
            full_address = full_address +","+obj.present_address_state
        if obj.present_address_pincode:
            full_address = full_address +","+obj.present_address_pincode
        return full_address

    class Meta:
        model = OrganisationEntityMasterData
        exclude = ('entity_data', 'entity_model')

class DocumentTemplates(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = DocumentTemplate
    queryset = DocumentTemplate.objects.all()
    serializer_class = DocumentTemplateSerializer

    # def get_permissions(self):
    #     permission_classes = [has_open_access_or_has_api_key_access_or_individual_permission]
    #     return [permission([]) for permission in permission_classes]

    
    @action(detail=False, methods=['post'], name='multi_template')
    def multi(self, request, tenant=None):
        try :
            req_data  = request.data
            tags = 'Generated'
            response = []
            try:
                processInstanceId = request._request.META['HTTP_PROCESSINSTANCEID']
                action = call(module = process_engine.ProcessInstanceVariablesApi, func = process_engine.ProcessInstanceVariablesApi.list_process_instance_variables, data={"process_instance_id": processInstanceId}, request= request, type="get", tenant_id=tenant)[0]
                process_instance_variables = action
                data = {}
                for variables in process_instance_variables:
                    if 'type' in variables and variables['type'] == 'date':
                        data[variables['name']] = '-'
                    else:
                        data[variables['name']] = variables['value']
            except Exception as error:
                context = {"success": False, "message": _("Process Id not found")}
                logger.error("Failed to generate Documents from Document templates due to: {}".format(error))
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            with transaction.atomic():
                for item in req_data:
                    if len(item.split("::")) == 2:
                        obj = self.model.objects.get(key=item.split("::")[0],version=item.split("::")[1])
                    else:
                        obj = self.model.objects.filter(key=item.split("::")[0]).order_by("version").first()
                    var_response = doc_generator(data,obj,processInstanceId, request, tags, tenant_id=tenant)
                    response.append({"name" : item.split("::")[0], "value" : var_response, "type" : "json"})
                if len(response) > 0:
                    action, action_status = call(module = process_engine.ProcessInstanceVariablesApi, func = process_engine.ProcessInstanceVariablesApi.create_process_instance_variable, tenant=None, id={"process_instance_id" : processInstanceId}, data=response, request=request, type="post", tenant_id=tenant)
                    if action_status > 300:
                        raise Exception(action)
            context = {'success': True, 'message': _('Multiple documents generated successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            context = {'error': str(error), 'success': False, 'message': _('Failed to generate Documents.')}
            logger.exception("Failed to generate Documents from Document templates due to: {}".format(error))
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get', 'post'], name='template2')
    def template2(self, request, pk=None, tenant=None):
        logger.info("send data to generate Document for id: {} for tenant: {}".format(pk, tenant))
        try :
            try:
                if "version" in request.query_params:
                    obj = self.model.objects.get(key=pk,version=request.query_params["version"], tenant=tenant)
                else:
                    obj = self.model.objects.filter(key=pk, tenant=tenant).order_by("version")
                    obj = obj[0]

            except Exception as error:
                internal_error = 8033
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            try:
                if 'tags' in request.data:
                    tags = request.data['tags']
                else:
                    tags = 'Generated'
                
                processInstanceId = request._request.META['HTTP_PROCESSINSTANCEID']
                action = call(module = process_engine.ProcessInstanceVariablesApi, func = process_engine.ProcessInstanceVariablesApi.list_process_instance_variables, data={"process_instance_id": processInstanceId}, request= request, type="get", tenant_id=tenant)[0]
                process_instance_variables = action
                data = {}
                for variables in process_instance_variables:
                    if 'type' in variables and variables['type'] == 'date':
                        data[variables['name']] = '-'
                    else:
                        data[variables['name']] = variables['value']

            except Exception as error:
                internal_error = 8034
                context = {"success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            response =[]
            var_response =doc_generator(data,obj,processInstanceId, request, tags, tenant_id=tenant)
            response.append(var_response)
            return Response(response, status=status.HTTP_200_OK)


        except Exception as error:
            internal_error = 8035
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['post'], name='template')
    def template(self, request, pk=None, tenant=None):
        logger.info("send data to generate Document of id: {} for tenant: {}".format(pk, tenant))
        try :
            try:
                import re
                UUID_PATTERN = re.compile(r'^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}$', re.IGNORECASE)
                if UUID_PATTERN.match(pk):
                    obj = self.model.objects.get(id=pk, tenant=tenant)
                else:
                    if "version" in request.query_params:
                        obj = self.model.objects.get(key=pk,version=request.query_params["version"], tenant=tenant)
                    else:
                        obj = self.model.objects.filter(key=pk, tenant=tenant).order_by("-version").first()
            except Exception as error:
                internal_error = 8036
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            try:
                doc_type = ''
                if "doc_type" in request.query_params:
                    doc_type = request.query_params['doc_type']
                data = json.loads(request.body.decode("utf-8"), strict=False)
                if 'HTTP_PROCESSINSTANCEID' in request._request.META:
                    processInstanceId = request._request.META['HTTP_PROCESSINSTANCEID']
                    logger.info("Document is getting generated for process : {} for tenant: {}".format(str(processInstanceId), tenant))
                else:
                    processInstanceId = None
                if 'tags' in data:
                    tags = data['tags']
                else:
                    tags = 'Generated'
            except Exception as error:
                internal_error = 8037
                context = {"success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(pk, error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            response =[]
            var_response =doc_generator(data,obj ,processInstanceId, request, tags, doc_type=doc_type, tenant_id=tenant)
            response.append(var_response)
            return Response(response, status=status.HTTP_200_OK)

        except Exception as error:
            internal_error = 8038
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=False, methods=["post"], name='platform-doc-generation')
    def platform(self, request, tenant=None):
        logger.info("sent data to generate platform Document for candidate for tenant: {}".format(tenant))
        try :
            #Get all process variables
            if 'tags' in request.data:
                tags = request.data['tags']
            else:
                tags = 'Generated'
            entity_id = request.data["entity_id"]
            instance = OrganisationEntityMasterData.objects.get(id=entity_id, entity_model__tenant__id=tenant)
            data = instance.entity_data
            first_class_data = OrganisationEntityFirstDataSerializer2(instance).data
            data.update(first_class_data)

            response =[]
            header = {
                "content-type": "application/json",
                "Authorization" : "Bearer " + PLATFORM_INTERNAL_TOKEN
            }
            #get all documents configured for doc generation
            reqUrl = PLATFORM_BASE_URL + "/api/customer-mgmt/onboard/config/" + str(tenant)
            response_get_doc = requests.request("GET", reqUrl,  headers=header)
            logger.info(response_get_doc.json())
            for item in response_get_doc.json()["documents"]:
                if "isApproved" in item and item["isApproved"] == True:
                    payload = {}
                    #save onbaord doc payload
                    reqUrl2 = PLATFORM_BASE_URL + "/api/employee-mgmt/org/" + str(tenant) + "/employee/" + instance.bpss_id + "/onboard-save-document?category=" + item["category"] + "&documentType=" + item["documentType"]
                    for item_ins in item["variables"]:
                        payload[item_ins] = data[item_ins] if item_ins in data else ""
                    payload["documentType"] = item["documentType"]
                    payload["isDetailsFilled"] = True
                    response_save_onboard_doc = requests.request("POST", reqUrl2, data=json.dumps(payload),  headers=header)
                    #generate doc
                    reqUrl3 = PLATFORM_BASE_URL + "/api/employee-mgmt/org/" + str(tenant) + "/employee/" + instance.bpss_id + "/document-generation?category=" + item["category"] + "&documentType=" + item["documentType"]
                    payload["isConfigDocGenerate"] = True
                    payload["category"] = item["category"]
                    response_generate_doc = requests.request("POST", reqUrl3, data=json.dumps(payload),  headers=header)
                    download_platform_doc.apply_async(args=[data, tenant, item["documentType"]], priority=MEDIUM_PRIORITY_TASK)
            return Response(response, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 8035
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ParseJinjaTemplate(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = EmptySerializer

    def post(self, request, tenant=None):
        try:
            # doc_type is one of
            # HTML [return html template] ,
            # PDF [return PDF generated using weasyprint],
            # VARIABLES [return extracted variables declared in template]

            doc_type = request.data.get('doc_type')

            # get html from request
            jinja_string = request.data.get('html')

            variables = request.data.get('variables')

            template = Template(jinja_string)

            data = {
                "data" : variables
            }

            context = Context(data)
            html_string = template.render(context)

            response = {}

            if doc_type == 'HTML':
                response = HttpResponse(html_string, content_type='text/html')

            else:
                pdf_file = HTML(string=html_string).write_pdf(presentational_hints=True)
                response = HttpResponse(pdf_file, content_type='application/pdf')

            return response
        except Exception as error:
            internal_error = 8039
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)

class EmailViewSet(CreateAPIView):
    permission_classes = [AllowAny]
    model = SMTPSettings
    queryset = SMTPSettings.objects.all()
    serializer_class = OrganisationSMTPSerializer

    # @method_decorator(license_required(['org_config.add_smtpsettings']))
    def create(self, request, tenant=None):
        logger.info("{} send data to create Email for tenant: {}".format(get_email(request), tenant))
        try:

            # notification_mode --> 0 --> Only Emails
            # notification_mode --> 1 --> Only SMSs
            sender_id = get_tenant(request)
            request_body = {}
            request_body["data"] = request.data
            request_body ["sender_id"] = sender_id
            request_body = json.dumps(request_body)
            send_bulk_email_sms.apply_async(args=[request_body], priority=HIGH_PRIORITY_TASK)
            context = {
                "success": True, "message": _("Bulk  email sent successfully.")}
            logger.info("{}, Bulk  email sent successfully for tenant: {}.".format(get_email(request), tenant))
            return Response(context, status=status.HTTP_200_OK)

        except Exception as error:
            internal_error = 8040
            context = {'error': str(error), "success": False, "message": _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EmailSettingsViewSet(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = EmptySerializer

    def list(self, request, tenant=None):
        logger.info("requested to list the Email settings for tenant: {}".format(tenant))
        try:
            serializer_smtp = OrganisationSMTPSerializer(SMTPSettings.objects.first())
            serializer_ses = EmailIdentitySerializer(EmailIdentity.objects.first())
            res_data = {}
            if serializer_ses and not serializer_smtp:
                res_data["ses"] = serializer_ses.data
            elif serializer_smtp and not serializer_ses:
                res_data["smtp"] = serializer_smtp.data
            elif serializer_smtp and serializer_ses:
                res_data["ses"] = serializer_ses.data
                res_data["smtp"] = serializer_smtp.data
            else:
                pass
            context = {
                "success": True, "message": _("Organisation email settings returned successfully."), "data": res_data}
            logger.info("Organisation email settings returned successfully for tenant: {}.".format(tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 8050
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}

            logger.exception(getLogMessage(org_config_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MultiEmailViewSet(CreateAPIView):
    permission_classes = [AllowAny]
    model = SMTPSettings
    queryset = SMTPSettings.objects.all()
    serializer_class = OrganisationSMTPSerializer

    def create(self, request, tenant=None):
        logger.info("sent data to create Tenant Email for tenant: {}".format(tenant))
        try:

            logger.info(request.META)
            # notification_mode --> 0 --> Only Emails
            # notification_mode --> 1 --> Only SMSs
            # notification_mode --> 2 --> Emails and SMSs both
            EMAIL = "EMAIL"
            SMS = "SMS"
            BOTH = "BOTH"
            if 'HTTP_NOTIFICATIONMODE' not in request.META:
                notification_mode = BOTH
            else:
                notification_mode = request.META['HTTP_NOTIFICATIONMODE']
            logger.info("EMAIL , SMS flag : {}".format(notification_mode))
            if notification_mode == SMS or notification_mode == BOTH:
                if 'HTTP_PHONE' in request.META and 'HTTP_PHONEBODY' in request.META :
                    logger.info("Sending SMS")
                    PhoneNumber=request.META['HTTP_PHONE']
                    Message=request.META['HTTP_PHONEBODY']
                    if 'HTTP_DLTID' in request.META:
                        response = send_sms(PhoneNumber, Message, request, request.META['HTTP_DLTID'])
                    else:
                        response = send_sms(PhoneNumber, Message, request)
                    if notification_mode == SMS:
                        return response
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
                        #TODO HAck
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
                context = {"success": False, "message": _(getMessage(org_config_errors, internal_error).format(notification_mode)), "internal_error": internal_error}
                logger.error(getMessage(org_config_errors, internal_error).format(notification_mode), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 8052
            context = {'error': str(error), "success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class OrganisationCustomAttributeViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = CustomAttribute
    queryset = CustomAttribute.objects.all()
    serializer_class = CustomAttributeSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = CustomAttribute_filter_fields
    filter_fields = get_filter_fields(CustomAttribute_filter_fields)
    ordering_fields = CustomAttribute_filter_fields

    # @method_decorator(permission_and_license_required(["org_config.add_customattribute", ]))
    def create(self, request, tenant=None, **args):
        logger.info("{} send the Custom Attribute data for tenant: {}".format(get_email(request), tenant))
        try:
            req_data = request.data.copy()
            req_data["tenant"] = tenant
            serializer = self.serializer_class(data=req_data)
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _(
                    "Custom Attribute has been added successfully."), "data": self.serializer_class(obj).data}
                logger.info("{} Custom Attribute has been added successfully.".format(get_email(request)))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 8053
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 8054
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_config.view_customattribute", ]))
    def list(self, request, tenant=None):
        logger.info("{} requested the list of Organisation Custom Attribute data for tenant: {}".format(get_email(request), tenant))
        try:
            filtered_queryset = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant))
            pagination_data = None
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True)
            context = {
                "success": True, "message": _("Organisation Custom Attribute data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{} Organisation Custom Attribute data returned successfully for tenant: {}".format(get_email(request), tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 8055
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_config.view_customattribute", ]))
    def retrieve(self, request, pk=None, tenant=None):
        logger.info("{} requested to retrieve Organisation Custom Attribute for id: {} for tenant: {}".format(get_email(request), pk, tenant))
        try:
            try:
                obj = self.model.objects.get(tenant__id=tenant, id=pk)
            except Exception as error:
                internal_error = 8056
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj)
            context = {
                "success": True, "message": _("Organisation Custom Attribute details retrieved successfully."), "data": serializer.data}
            logger.info("{} Organisation Custom Attribute details retrieved successfully for id: {} for tenant: {}.".format(get_email(request), pk, tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 8057
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(permission_and_license_required(["org_config.change_customattribute", ]))
    def update(self, request, pk=None, tenant=None):
        logger.info("{} requested to update Organisation Custom Attribute for id :{} for tenant: {}".format(get_email(request), pk, tenant))
        try:
            try:
                obj = self.model.objects.get(tenant__id=tenant, id=pk)
            except Exception as error:
                internal_error = 8058
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {
                    "success": True, "message": _("Organisation Custom Attribute details updated successfully."), "data": self.serializer_class(obj).data}
                logger.info("{} Organisation Custom Attribute details updated successfully for id :{} for tenant: {}".format(get_email(request), pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 8059
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 8060
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None, tenant=None):
        context = {'error': '', 'success': False,
                   'message': _('Method not allowed.')}
        return Response(context, status=status.HTTP_405_METHOD_NOT_ALLOWED)


    @action(detail=False, methods=['get'], name='get_attribute')
    def get_attribute(self, request, tenant=None):
        try:
            type = request.query_params["type"]
            try:
                custom_attribute = CustomAttribute.objects.filter(type = type, tenant__id=tenant)
                if not custom_attribute:
                    custom_attribute_data= {"components":[]}
                else:
                    custom_attribute_data =  custom_attribute[0].custom_attribute
                context = {
                "success": True, "message": _("Organisation Custom Attribute details retrieved successfully."), "data": custom_attribute_data}
                logger.info("{} Organisation Custom Attribute details retrieved successfully of type: {} for tenant: {}.".format(get_email(request), type, tenant))
                return Response(context, status=status.HTTP_200_OK)

            except Exception as error:
                internal_error = 8061
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), type, error), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 8062
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), str(error)), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class EmailDigestViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = EmailDigest
    queryset = EmailDigest.objects.all()
    serializer_class = EmailDigestSerializer

    def create(self, request, tenant=None):
        logger.info("create Email Digest Request Received for tenant: {}".format(tenant))
        try:
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _(
                    "Email Digest has been added successfully."), "data": self.serializer_class(obj).data}
                logger.info("Email Digest has been added successfully. for tenant: {}".format(tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 8063
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_config_errors, internal_error).format(serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 8064
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ConfigDashboardViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = DashboardView
    queryset = DashboardView.objects.all()
    serializer_class = DashboardViewSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = DashboardView_filter_fields
    filter_fields = get_filter_fields(DashboardView_filter_fields)
    ordering_fields = DashboardView_filter_fields

    # @method_decorator(license_required(['organisations.dynamicdashboard_organisationlicense']))
    def create(self, request, tenant=None):
        logger.info("{} Requested to create a dashboard for tenant: {}".format(get_email(request), tenant))
        try:
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _(
                    "New Dashboard has been added successfully."), "data": self.serializer_class(obj).data}
                logger.info("New Dashboard has been added successfully for tenant: {}.".format(tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 8065
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request),serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 8066
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(license_required(['organisations.dynamicdashboard_organisationlicense']))
    def list(self, request, tenant=None):
        logger.info("{} Requested to get the dashboard data for tenant: {}.".format(get_email(request), tenant))
        try:
            filtered_queryset = self.filter_queryset(self.get_queryset())
            pagination_data = None
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.serializer_class(
                    page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(
                    filtered_queryset, many=True)
            context = {
                "success": True, "message": _("Dashboard data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}

            logger.info("{}, Dashboard data returned successfully for tenant: {}.".format(get_email(request), tenant))

            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,
                       'message': _('Dashboard data returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 8067
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(license_required(['organisations.dynamicdashboard_organisationlicense']))
    def partial_update(self, request, pk=None, tenant=None):
        logger.info("{}, Partial update dashboard for id: {} for tenant: {}".format(get_email(request), pk, tenant))
        try:
            try:
                obj = self.get_object()
            except Exception as error:
                internal_error = 8068
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(
                obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {
                    "success": True, "message": _("Dashboard details updated successfully."), "data": self.serializer_class(obj).data}
                logger.info("{}, Dashboard data for id: {} partially updated successfully for tenant: {}.".format(get_email(request), pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 8069
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 8070
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(license_required(['organisations.dynamicdashboard_organisationlicense']))
    def destroy(self, request, pk=None, tenant=None):
        logger.info("{} requested to delete id: {} from dashboard for tenant: {}".format(get_email(request), pk, tenant))
        try:
            try:
                obj = self.get_object()
            except Exception as error:
                internal_error = 8071
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)

            self.perform_destroy(obj)

            context = {
                "success": True, "message": _("Dashboard deleted successfully."), "data": None}
            logger.info("{}, Id: {} deleted successfully from dashboard for tenant: {}.".format(get_email(request), pk , tenant))
            return Response(context, status=status.HTTP_200_OK)

        except Exception as error:
            internal_error = 8072
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(license_required(['organisations.dynamicdashboard_organisationlicense']))
    @action(detail=False, methods=['post'], name='')
    def widgets(self, request, tenant=None):
        try:
            history_process = process_engine.HistoryProcessApi
            query_historic_process = history_process.query_historic_process_instance
            queryList = request.data
            variables=[]
            req_body = {}
            for data in queryList:
                if data["type"] == "common":
                    req_body[data["attribute"]] = data["value"]
                else:
                    values = {}
                    values["name"] = data["attribute"]
                    values["operation"] = COMPARISION[data["comparision"]]
                    values["value"] = data["value"]
                    values["variableOperation"] = data["comparision"]
                    variables.append(values)
            req_body["variables"] = variables
            req_body["size"] = 1
            req_body["finished"] = False
            req_body["deleted"] = False
            ongoing_response = call(module = history_process, func = query_historic_process, data=req_body, request= request, type="post")[0]
            req_body["finished"] = True
            req_body["deleted"] = False
            completed_response = call(module = history_process, func = query_historic_process, data=req_body, request= request, type="post")[0]
            req_body["finished"] = True
            req_body["deleted"] = True
            withdrawn_response = call(module = history_process, func = query_historic_process, data=req_body, request= request, type="post")[0]

            response = [{"name":"ongoing", "value" : ongoing_response["total"]},
                        {"name":"completed", "value" : completed_response["total"]},
                        {"name":"withdrawn", "value" : withdrawn_response["total"]}]
            context = {"success": True, "message": _(
                    "Widget data return successfully."), "data": response}
            logger.info("Widget data return successfully for tenant: {}.".format(tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 8073
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class JobConfigViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = JobConfigView
    queryset = JobConfigView.objects.all()
    serializer_class = JobConfigViewSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = JobConfigView_filter_fields
    filter_fields = get_filter_fields(JobConfigView_filter_fields)
    ordering_fields = JobConfigView_filter_fields

    # @method_decorator(license_required(['organisations.dynamicdashboard_organisationlicense']))
    def create(self, request, tenant=None):
        logger.info("{} Requested to create a job view for tenant: {}".format(get_email(request), tenant))
        try:
            request.data["tenant"] = tenant
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _(
                    "New job view has been added successfully."), "data": self.serializer_class(obj).data}
                logger.info("New job view has been added successfully for tenant: {}.".format(tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 8165
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 8166
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(license_required(['organisations.dynamicdashboard_organisationlicense']))
    def list(self, request, tenant=None):
        logger.info("{} Requested to get the job view data for tenant: {}.".format(get_email(request), tenant))
        try:
            filtered_queryset = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant))
            pagination_data = None
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True)
            context = {
                "success": True, "message": _("job view data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}

            logger.info("{}, job view data returned successfully for tenant: {}.".format(get_email(request), tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,
                       'message': _('job view data returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 8167
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(license_required(['organisations.dynamicdashboard_organisationlicense']))
    def update(self, request, pk=None, tenant=None):
        logger.info("{}, Partial update job view for id: {} for tenant: {}".format(get_email(request), pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 8168
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {
                    "success": True, "message": _("job view details updated successfully."), "data": self.serializer_class(obj).data}
                logger.info("{}, job view data for id: {} partially updated successfully for tenant: {}.".format(get_email(request), pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 8169
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 8170
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(license_required(['organisations.dynamicdashboard_organisationlicense']))
    def destroy(self, request, pk=None, tenant=None):
        logger.info("{} requested to delete id: {} from job view for tenant: {}".format(get_email(request), pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 8171
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            self.perform_destroy(obj)
            context = {
                "success": True, "message": _("job view deleted successfully."), "data": None}
            logger.info("{}, Id: {} deleted successfully from job view for tenant: {}.".format(get_email(request), pk , tenant))
            return Response(context, status=status.HTTP_200_OK)

        except Exception as error:
            internal_error = 8172
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EventConfigViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = EventConfigView
    queryset = EventConfigView.objects.all()
    serializer_class = EventConfigViewSerializer
    filter_backends = (DjangoFilterBackend, CustomSearchFilter, filters.OrderingFilter,)
    search_fields = EventConfigView_filter_fields
    filter_fields = get_filter_fields(EventConfigView_filter_fields)
    ordering_fields = EventConfigView_filter_fields

    # @method_decorator(license_required(['organisations.dynamicdashboard_organisationlicense']))
    def create(self, request, tenant=None):
        logger.info("{} Requested to create a event view for tenant: {}".format(get_email(request), tenant))
        try:
            request.data["tenant"] = tenant
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                obj = serializer.save()
                context = {"success": True, "message": _(
                    "New event view has been added successfully."), "data": self.serializer_class(obj).data}
                logger.info("New event view has been added successfully for tenant: {}.".format(tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 8265
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request),serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 8266
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(license_required(['organisations.dynamicdashboard_organisationlicense']))
    def list(self, request, tenant=None):
        logger.info("{} Requested to get the event view data for tenant: {}".format(get_email(request), tenant))
        try:
            filtered_queryset = self.filter_queryset(self.get_queryset().filter(tenant__id=tenant))
            pagination_data = None
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True)
            context = {
                "success": True, "message": _("event view data returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{}, event view data returned successfully for tenant: {}.".format(get_email(request), tenant))
            return Response(context, status=status.HTTP_200_OK)
        except NotFound as error:
            total = filtered_queryset.count() if hasattr(filtered_queryset, "count") else None
            context = {'error': str(error), 'success': True, "data":[], 'total': total,
                       'message': _('event view data returned successfully.')}
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 8267
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(license_required(['organisations.dynamicdashboard_organisationlicense']))
    def update(self, request, pk=None, tenant=None):
        logger.info("{}, Partial update event view for id: {} for tenant: {}".format(get_email(request), pk, tenant))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 8268
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            serializer = self.serializer_class(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                context = {
                    "success": True, "message": _("event view details updated successfully."), "data": self.serializer_class(obj).data}
                logger.info("{}, event view data for id: {} partially updated successfully for tenant: {}.".format(get_email(request), pk, tenant))
                return Response(context, status=status.HTTP_200_OK)
            internal_error = 8269
            context = {'error': get_custom_field_errors(
                serializer.errors), "success": False, "message": _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
            logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, serializer.errors), internal_error)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:
            internal_error = 8270
            context = {'error': str(
                error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @method_decorator(license_required(['organisations.dynamicdashboard_organisationlicense']))
    def destroy(self, request, pk=None, tenant=None):
        logger.info("{} requested to delete id: {} from event view".format(get_email(request), pk))
        try:
            try:
                obj = self.model.objects.get(id=pk, tenant__id=tenant)
            except Exception as error:
                internal_error = 8271
                context = {'error': str(
                    error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
                return Response(context, status=status.HTTP_404_NOT_FOUND)
            self.perform_destroy(obj)
            context = {
                "success": True, "message": _("event view deleted successfully."), "data": None}
            logger.info("{}, Id: {} deleted successfully from job view for tenant: {}.".format(get_email(request), pk, tenant ))
            return Response(context, status=status.HTTP_200_OK)

        except Exception as error:
            internal_error = 8272
            context = {'error': str(error), 'success': False,
                       'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), pk, error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ChartNameViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = ChartName
    queryset = ChartName.objects.all()
    serializer_class = ChartNameSerializer

    def list(self, request, tenant=None):
        logger.info("{} Requested to get the chart name for tenant: {}.".format(get_email(request), tenant))
        try:
            filtered_queryset = self.filter_queryset(self.get_queryset()).filter(tenant__id=tenant)
            pagination_data = None
            page = self.paginate_queryset(filtered_queryset)
            if page is not None:
                serializer = self.serializer_class(page, many=True)
                pagination_data = self.get_paginated_response(serializer.data)
            else:
                serializer = self.serializer_class(filtered_queryset, many=True)
            context = {"success": True, "message": _("chart name returned successfully."), "data": serializer.data, "pagination_data": pagination_data}
            logger.info("{}, chart name returned successfully for tenant: {}.".format(get_email(request), tenant))
            return Response(context, status=status.HTTP_200_OK)
        except Exception as error:
            internal_error = 8085
            context = {'error': str(error), 'success': False, 'message': _(getMessage(org_config_errors, internal_error)), 'internal_error': internal_error}
            logger.exception(getLogMessage(org_config_errors, internal_error).format(get_email(request), error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_email(request):
    return request.user.email if hasattr(request.user, 'email') else "AnonymousUser"