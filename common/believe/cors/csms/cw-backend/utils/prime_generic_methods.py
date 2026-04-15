# coding=utf-8

import base64
import json

import requests
from django.http import HttpResponse
from django.utils import six
from django.utils.six import BytesIO as StringIO
from requests.auth import HTTPBasicAuth
from requests.exceptions import ConnectionError, SSLError, Timeout
from rest_framework.exceptions import UnsupportedMediaType
from rest_framework.response import Response
from rest_framework.utils.mediatypes import media_type_matches
from rest_framework.views import APIView
# from rest_framework_proxy.settings import api_proxy_settings
from apps.organisations.models import OrganisationLicense

from ezedox.settings import REST_PROXY as api_proxy_settings


def get_custom_field_errors(errors):

    if isinstance(errors, dict):
        for key, value in errors.items():
            if isinstance(value, dict):
                errors[key] = value
            else:
                errors[key] = value[0]
        return  errors

    if isinstance(errors, list):
        error_messages = dict()
        for error in errors:
            if isinstance(errors, dict):
                for key, value in error.items():
                    error_messages[key] = value[0]
            else:
                return errors
        return  error_messages
    return None



    # if isinstance(errors, dict):
    #     for key, value in errors.items():
    #         errors[key] = value[0]
    #     return  errors

    # if isinstance(errors, list):
    #     error_messages = dict()
    #     for error in errors:
    #         if isinstance(errors, dict):
    #             for key, value in error.items():
    #                 error_messages[key] = value[0]
    #         else:
    #             return errors
    #     return  error_messages
    # return None

class BaseProxyView(APIView):
    proxy_settings = api_proxy_settings
    proxy_host = None
    source = None
    return_raw = False
    verify_ssl = None
    success_msg = None


class ProxyView(BaseProxyView):
    """
    Proxy view
    """
    def get_proxy_host(self):
        engine_url = OrganisationLicense.objects.get(organisation=self.request.tenant).processengine
        return engine_url

    def get_source_path(self):
        if self.source:
            return self.source % self.kwargs
        return None

    def get_request_url(self, request):
        host = self.get_proxy_host()
        path = self.get_source_path()
        if path:
            return ''.join([host, path])
        return host

    def get_request_params(self, request):
        if request.query_params:
            qp = request.query_params.copy()
            for param in self.proxy_settings.get('DISALLOWED_PARAMS'):
                if param in qp:
                    del qp[param]
            return six.iterlists(qp)
        return {}

    def get_request_data(self, request):
        if 'application/json' in request.content_type:
            return json.dumps(request.data)
        return request.data

    def get_request_files(self, request):
        files = {}
        if request.FILES:
            for field, content in request.FILES.items():
                files[field] = content
        return files

    def get_default_headers(self, request):
        return {
            'Accept': request.META.get('HTTP_ACCEPT', self.proxy_settings.get('DEFAULT_HTTP_ACCEPT')),
            'Accept-Language': request.META.get('HTTP_ACCEPT_LANGUAGE', self.proxy_settings.get('DEFAULT_HTTP_ACCEPT_LANGUAGE')),
            'Content-Type': request.META.get('CONTENT_TYPE', self.proxy_settings.get('DEFAULT_CONTENT_TYPE')),
        }

    def get_headers(self, request):
        #import re
        #regex = re.compile('^HTTP_')
        #request_headers = dict((regex.sub('', header), value) for (header, value) in request.META.items() if header.startswith('HTTP_'))
        headers = self.get_default_headers(request)

        # Translate Accept HTTP field
        accept_maps = self.proxy_settings.get('ACCEPT_MAPS')
        for old, new in accept_maps.items():
            headers['Accept'] = headers['Accept'].replace(old, new)

        username = self.proxy_settings['AUTH']['user']
        password = self.proxy_settings['AUTH']['password']
        if username and password:
            auth_token = '%s:%s' % (username, password)
            auth_token = base64.b64encode(auth_token.encode('utf-8')).decode()
            headers['Authorization'] = 'Basic %s' % auth_token
        else:
            auth_token = self.proxy_settings['AUTH']['token']
            if auth_token:
                headers['Authorization'] = auth_token
        return headers

    def get_verify_ssl(self, request):
        return self.verify_ssl or self.proxy_settings['VERIFY_SSL']

    def get_cookies(self, requests):
        return None

    def parse_proxy_response(self, response):
        """
        Modified version of rest_framework.request.Request._parse(self)
        """
        parsers = self.get_parsers()
        stream = StringIO(response._content)
        content_type = response.headers.get('content-type', None)

        if stream is None or content_type is None:
            return {}

        parser = None
        for item in parsers:
            if media_type_matches(item.media_type, content_type):
                parser = item

        if not parser:
            raise UnsupportedMediaType(content_type)

        parsed = parser.parse(stream, content_type)

        # Parser classes may return the raw data, or a
        # DataAndFiles object. Return only data.
        try:
            return parsed.data
        except AttributeError:
            return parsed

    def create_response(self, response):
        if self.return_raw or self.proxy_settings['RETURN_RAW']:
            return HttpResponse(response.text, status=response.status_code,
                    content_type=response.headers.get('content-type'))

        status = response.status_code
        if status >= 400:
            body = {}
            body['success'] = "false"
            body['message'] = response.json()['message']
            body['error'] = response.json()['exception']

        elif status == 204:
            body = {}
            body['success'] = 'true'
            body['body'] = 'Instance deleted'
        else:
            body = {}
            response_data = response.json()
            body['success'] = "true"
            body['message'] = self.success_msg
            # body['data'] = response_data.get('data') if not isinstance(response_data, list) else response_data
            body['data'] = response_data

            # data = self.parse_proxy_response(response)
        return Response(body, status)

    def create_error_response(self, body, status):
        return Response(body, status)

    def proxy(self, request, *args, **kwargs):
        url = self.get_request_url(request)
        params = self.get_request_params(request)
        data = self.get_request_data(request)
        files = self.get_request_files(request)
        headers = self.get_headers(request)
        verify_ssl = self.get_verify_ssl(request)
        cookies = self.get_cookies(request)

        try:
            if files:
                """
                By default requests library uses chunked upload for files
                but it is much more easier for servers to handle streamed
                uploads.

                This new implementation is also lightweight as files are not
                read entirely into memory.
                """
                # boundary = generate_boundary()
                # headers['Content-Type'] = 'multipart/form-data; boundary=%s' % boundary

                # body = StreamingMultipart(data, files, boundary)

                # session = sessions.Session()
                # session.mount('http://', StreamingHTTPAdapter())
                # session.mount('https://', StreamingHTTPAdapter())

                # response = session.request(request.method, url,
                #         params=params,
                #         data=body,
                #         headers=headers,
                #         timeout=self.proxy_settings.get('TIMEOUT'),
                #         verify=verify_ssl,
                #         cookies=cookies)
            else:
                response = requests.request(request.method, url,
                        auth=HTTPBasicAuth(self.proxy_settings['AUTH']['user'], self.proxy_settings['AUTH']['password']),
                        params=params,
                        data=data,
                        files=files,
                        headers=headers,
                        timeout=self.proxy_settings['TIMEOUT'],
                        verify=verify_ssl,
                        cookies=cookies)
        except (ConnectionError, SSLError):
            status = requests.status_codes.codes.bad_gateway
            return self.create_error_response({
                'code': status,
                'error': 'Bad gateway',
            }, status)
        except Timeout:
            status = requests.status_codes.codes.gateway_timeout
            return self.create_error_response({
                'code': status,
                'error': 'Gateway timed out',
            }, status)

        return self.create_response(response)

    def get(self, request, *args, **kwargs):
        from apps.org_apps.views import get_tenant
        self.request.GET._mutable = True
        self.request.GET['tenantId'] = get_tenant(request)
        self.request.GET._mutable = False
        return self.proxy(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        return self.proxy(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return self.proxy(request, *args, **kwargs)

    def patch(self, request, *args, **kwargs):
        return self.proxy(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        return self.proxy(request, *args, **kwargs)
