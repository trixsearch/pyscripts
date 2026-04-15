import json
import time
import os
from os import path
import base64
import uuid
import requests


# from django.utils.decorators import method_decorator
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, viewsets
from django.utils.translation import gettext as _
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_api_key.permissions import HasAPIKey
from ezedox.settings import FRS_AUTH_URL, FRS_BASE_URI, FRS_KEY_ID, FRS_KEY_SECRET, FRS_MASK, FRS_BANK_VERIFY, FRS_BANK_STATUS, ZOOP_URL, ZOOP_URL_APP_ID, ZOOP_URL_APP_KEY
from utils.loggerwrapper import Logger, getMessage, getLogMessage
from utils.email import download_file, delete_folder
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.org_form.models import OrganisationFile
from apps.org_form.serializers import (OrganisationFileSerializer)
from utils.serializers import EmptySerializer
from .internal_errors import org_third_party_errors
from re import search

logger = Logger(__name__)


def get_headers():
    try:
        geturl=FRS_AUTH_URL
        params = {'key_id': FRS_KEY_ID,'key_secret': FRS_KEY_SECRET}
        r = requests.get(url = geturl, params = params)
        auth_header = r.json()['auth_header']
        current_time= int(time.time()*1000000)

        headers = {
            'Authorization': auth_header,
            'request_id': str(current_time),
            }
        return headers
    except Exception as error:
        logger.exception(error)

class OCRViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = None
    queryset = None
    serializer_class = EmptySerializer

    def create(self, request, tenant=None):
        logger.info("requested to create OCR for tenant: {}".format(tenant))
        try:
            url = ZOOP_URL
            fields = {}
            data = json.loads(request.body.decode("utf-8"), strict=False)
            fields["mode"] = "sync"
            fields["data"] = {}
            try:
                fields["data"]["card_front_image"] = data["card_front_image"]
                if data["card_type"] == "AADHAAR":
                    fields["data"]["card_back_image"] = data["card_back_image"]
            except Exception as error:
                internal_error = 22001
                context = {'error' : str(error), "success": False, "message": _(getMessage(org_third_party_errors, internal_error)), 'internal_error': internal_error}
                logger.error(getLogMessage(org_third_party_errors, internal_error).format(error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

            fields["data"]["card_type"] = data["card_type"]
            fields["data"]["consent"] = "Y"
            fields["data"]["consent_text"] = "I hear by declare my consent agreement for fetching my information via ZOOP API"
            fields["task_id"] = str(uuid.uuid4())

            headers = {
                "Content-Type" : "application/json",
                "app-id" : ZOOP_URL_APP_ID,
                "api-key" : ZOOP_URL_APP_KEY
            }

            response = requests.request("POST", url, data=json.dumps(fields), headers=headers)
            logger.info(response.json())
            if response.status_code == 200:
                logger.info("OCR data fetched successfully from FRS")
                context = {'success': True, "message": _("OCR Data Fetched Successfully"), "data": response.json()}
                status_code = status.HTTP_200_OK
            else:
                internal_error = 22002
                logger.error(getLogMessage(org_third_party_errors, internal_error).format(response.json()), internal_error)
                context = {'success': False, "message": _(getMessage(org_third_party_errors, internal_error)), "data": response.json(), "internal_error": internal_error}
                status_code = response.status_code
            return Response(context, status=status_code)
        except Exception as error:
            internal_error = 22003
            context = {'error': str(error), "success": False, "message": _(getMessage(org_third_party_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_third_party_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MaskAadhaarViewSet(viewsets.ModelViewSet):
    permission_classes = [HasAPIKey | IsAuthenticated]
    model = OrganisationFile
    queryset = None
    serializer_class = OrganisationFileSerializer

    def create(self, request):
        logger.info("request for aadhaar masking")
        try:
            url = FRS_BASE_URI + FRS_MASK
            fields = {}
            data = json.loads(request.body.decode("utf-8"), strict=False)
            try:
                fields["id_front_image_url"] = data["id_front_image_url"]
            except Exception as error:
                internal_error = 22004
                context = {'error' : str(error), "success": False, "message": _(getMessage(org_third_party_errors, internal_error)), "internal_error": internal_error}
                logger.error(getLogMessage(org_third_party_errors, internal_error).format(error), internal_error)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            files=[]
            folder=''
            r = requests.get(fields["id_front_image_url"])
            content_type = r.headers["Content-Type"]
            folder_name, filepath = download_file(fields["id_front_image_url"], folder)
            files.append(('aadhaar_document', (filepath, open(filepath, 'rb'), content_type)))
            headers = get_headers()
            if 'image' in content_type:
                response = requests.request("POST", url, files=files, headers=headers, params=request.query_params, data={})
            else:
                internal_error = 22005
                logger.error("Unsupported Filetype :" + content_type + " For: " + fields["id_front_image_url"], internal_error)
                context = {
                    "success": False, "message": _("Unsupported Filetype :" + content_type), "data": None, "internal_error": internal_error}
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            if response.status_code == 200:
                logger.info("Successful response from aadhaar masking FRS API, url:{}".format(fields['id_front_image_url']))
                context = {'success': True, "message": _("Successful response from aadhaar masking FRS API"), "data": response.json()}
                status_code = status.HTTP_200_OK
                imgstring = response.json()["data"]["masked_document"]
                # This response is for FRS v1.2
                # imgstring = response.json()["data"]["masked_documents"][0]
                filename = '/tmp/{}/masked_aadhaar.jpg'.format(folder_name)
                imgdata = base64.b64decode(imgstring)
                with open(filename, 'wb') as f:
                    f.write(imgdata)

                try:
                    imageId = fields["id_front_image_url"].split("files/", 1)
                    obj = OrganisationFile.objects.get(id = imageId[1])
                except Exception as error:
                    internal_error = 22006
                    context = {'error': str(
                        error), 'success': False, 'message': _(getMessage(org_third_party_errors, internal_error)), "internal_error": internal_error}
                    logger.error(getLogMessage(org_third_party_errors, internal_error).format(imageId[1], error), internal_error)
                    return Response(context, status=status.HTTP_404_NOT_FOUND)
                with open(filename, 'rb') as f:
                    doc = SimpleUploadedFile(str(uuid.uuid4()) + "." + content_type.split('/')[1], f.read(), content_type = content_type)
                serializer = self.serializer_class(obj, data={"file":doc}, partial=True)
                os.remove(filename)
                if serializer.is_valid():
                    serializer.save()
            else:
                logger.warning("Aadhaar masking FRS API Failed, url:{}, Response: {}".format(fields['id_front_image_url'],response.json()))
                context = {'success': False, "message": _("Aadhaar masking FRS API Failed"), "data": response.json()}
                status_code = response.status_code
            return Response(context, status=status_code)
        except Exception as error:
            internal_error = 22007
            context = {'error': str(error), "success": False, "message": _(getMessage(org_third_party_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_third_party_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if str(path.exists(folder_name)):
                logger.info("Downloaded masked aadhaar image deleted")
                delete_folder(folder_name)


class PennydropViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    model = None
    queryset = None
    serializer_class = None

    @action(detail=False, methods=['get'], name="verify bank account")
    def verify_bank_account(self, request):
        try:
            bank_account_number = request.GET.get('bank_account_number','')
            bank_ifsc = request.GET.get('bank_ifsc','')
            bank_detail_url = FRS_BASE_URI + FRS_BANK_VERIFY

            headers = get_headers()

            response = requests.request("POST", bank_detail_url, data='',headers=headers, params=request.query_params)
            context = None
            status_code = None
            if response.status_code == 200:
                logger.info("unique reference id Fetched Successfully for bank and sent.")
                context = {'success': True, "message": _("unique reference id Fetched Successfully"), "data": response.json()}
                status_code = status.HTTP_200_OK
            else:
                internal_error = 22008
                logger.error(getMessage(org_third_party_errors, internal_error), internal_error)
                context = {'success': False, "message": _(getMessage(org_third_party_errors, internal_error)), "data": response.json(), "internal_error": internal_error}
                status_code = response.status_code
            return Response(context, status=status_code)

        except Exception as error:
            internal_error = 22009
            context = {'error': str(error), "success": False, "message": _(getMessage(org_third_party_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_third_party_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=False, methods=['get'], name="verify status")
    def verify_bank_account_status(self, request):
        try:
            uniq_reference_id = request.GET.get('uniq_reference_id','')
            bank_verify_url = FRS_BASE_URI + FRS_BANK_STATUS

            headers = get_headers()

            response = requests.request("POST", bank_verify_url, data='',headers=headers, params=request.query_params)
            context = None
            status_code = None
            if response.status_code == 200:
                logger.info("Bank account verification details Fetched Successfully")
                context = {'success': True, "message": _("Bank account verification details Fetched Successfully"), "data": response.json()}
                status_code = status.HTTP_200_OK
            else:
                internal_error = 22010
                logger.error(getMessage(org_third_party_errors, internal_error), internal_error)
                context = {'success': False, "message": _(getMessage(org_third_party_errors, internal_error)), "data": response.json(), "internal_error": internal_error}
                status_code = response.status_code
            return Response(context, status=status_code)

        except Exception as error:
            internal_error = 22011
            context = {'error': str(error), "success": False, "message": _(getMessage(org_third_party_errors, internal_error)), "internal_error": internal_error}
            logger.exception(getLogMessage(org_third_party_errors, internal_error).format(error), internal_error)
            return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
