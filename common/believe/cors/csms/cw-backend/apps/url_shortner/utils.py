import datetime
import requests
import json

from urllib.parse import urlsplit, quote_plus, unquote, quote
from django.utils.crypto import get_random_string
from django.db import IntegrityError
from celery.utils.log import get_task_logger
from ezedox.settings import BASE_ORG_DOMAIN_URL
from utils.loggerwrapper import Logger
from .serializers import UrlShortnerSerializer
from ezedox.settings import FCM_URL, FCM_DYNAMIC_LINK, FCM_API_KEY, DEFAULT_SCHEME
logger = get_task_logger(__name__)


def get_encoded_url(full_url='', request=None):
    splited_url = urlsplit(full_url)
    if len(splited_url.query) > 0:
        queries = splited_url.query.split('&')
        query_params = [query.split('=') for query in queries]
        encoded_query_param = ''
        for item in query_params:
            encoded_query_param+= item[0]+'='+ quote_plus(unquote(item[1]))
            if item != query_params[len(query_params)-1]:
                encoded_query_param += '&'

        first_part = full_url.split('?')
        encoded_full_url = first_part[0] + "?"+encoded_query_param
        return encoded_full_url
    return full_url


# WILL CREATE A EZEURL AND SAVE IT AND RETURN
def create_short_url(long_url, request):
    if request is not None:
        try:
            long_url = get_encoded_url(long_url)
            link_expiry = request.META.get('HTTP_LINKEXPIRY')
            data = {
                "long_url":long_url
            }
            serializer = UrlShortnerSerializer(data=data)
            if serializer.is_valid():
                short_url = get_random_string(length=6)
                expiration = None
                if link_expiry is not None:
                    link_expiry = int(link_expiry)
                    expiration = datetime.datetime.now() + datetime.timedelta(minutes=link_expiry)
                long_url = serializer.validated_data['long_url']
                obj = None
                try:
                    obj = serializer.save(short_url=short_url, expiration=expiration, long_url=long_url)
                except IntegrityError as error:
                    logger.exception("{},This generated short url already exist in database, due to: {}".format(short_url, error))
                    obj = serializer.save(short_url=get_random_string(length=6), expiration=expiration, long_url=long_url)
                logger.info("short URL generated successfully.Ezeurl: {} for {}".format(short_url, long_url))
                ezeurl ="{0}://{1}/api/cw/url/{2}/".format(DEFAULT_SCHEME, BASE_ORG_DOMAIN_URL, str(obj.short_url))
                return ezeurl
            else:
                return long_url
        except Exception as error:
            logger.exception("failed to generate short URL, due to:{}.".format(error))
            return long_url
    return long_url

def create_short_url_firebase(long_url, request):
    try:
        url = "{base_url}?key={api_key}".format(base_url=FCM_URL,api_key=FCM_API_KEY)
        headers = {'Content-Type': 'application/json'}
        dynamicUrl="{dynamic_work}/?link={long_url}".format(dynamic_work=FCM_DYNAMIC_LINK,long_url=quote(long_url))
        payload = json.dumps({"longDynamicLink":dynamicUrl})
        response = requests.request('POST', url, data=payload,headers=headers)
        if response.status_code == 200:
            response = response.json()
            if 'shortLink' in response:
                return response['shortLink']
            else:
                return long_url
        else:
            return long_url
    except Exception as error:
        logger.exception("failed to generate short URL, due to:{}.".format(error))
        return long_url


def get_header_urls(request):
    try:
        request_meta = request.META
        header_urls_name = [url for url in request_meta.keys() if 'EZEDOXEZEURL' in url]
        all_ezeurls = {}
        for name in header_urls_name:
            long_url = request_meta[name]
            ezeurl = create_short_url(long_url, request)
            name = name.split('_')[1].lower()
            all_ezeurls[name] = ezeurl
        return all_ezeurls
    except Exception as error:
        logger.exception("Failed to get headers and ezeurls. Reason -{}.".format(error))
        return {}
