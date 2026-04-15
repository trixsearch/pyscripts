import http.client
import json
from django.utils.translation import gettext as _
from rest_framework.response import Response
from rest_framework import status
from celery.utils.log import get_task_logger
import phonenumbers

from ezedox.settings import  SMS_SENDER, SMS_PROVIDER, FAKE_SMS
from utils.cipher import AESCipher
from apps.url_shortner.utils import get_header_urls

logger = get_task_logger(__name__)
cipher_obj = AESCipher()

#conditional imports
if SMS_PROVIDER == 'MSG91':
    from ezedox.settings import MSG91_AUTH_KEY, MSG91_URL, MSG91_BASE_URL, MSG91_ROUTE, MSG91_BASE_URL_V1, MSG91_OTP_TEMPLATE_ID, MSG91_SEND_OTP_URL_V5
else:
    from ezedox.settings import AWS_SNS_CLIENT


# def get_encoded_message(message, request=None):
#     short_url = ''
#     if re.search("(?P<url>https?://[^\s]+)", str(message)):
#         full_url = re.search("(?P<url>https?://[^\s]+)", str(message)).group("url")
#         splited_url = urlsplit(full_url)
#         if len(splited_url.query) > 0:
#             queries = splited_url.query.split('&')
#             query_params = [query.split('=') for query in queries]
#             encoded_query_param = ''
#             for item in query_params:
#                 encoded_query_param+= item[0]+'='+ quote_plus(unquote(item[1]))
#                 if item != query_params[len(query_params)-1]:
#                     encoded_query_param += '&'

#             first_part = full_url.split('?')
#             encoded_link = first_part[0] + "?"+encoded_query_param
#             short_url = create_short_url(encoded_link, request)
#             new_message = message.replace(full_url, short_url)
#             return new_message, short_url
#     return message, short_url


def get_country_code(number):
    parsed_number = phonenumbers.parse(str(number), None)

    if parsed_number.country_code == 91:
        return '91'
    if parsed_number.country_code == 1:
        return '1'
    return '0'

def get_mobile_number(number):
    parsed_number = phonenumbers.parse(str(number), None)

    is_number_valid = phonenumbers.is_valid_number(parsed_number)
    if not is_number_valid:
        logger.error('Mobile number {} is not valid'.format(number))

    if parsed_number.country_code == 91:
        number = str(parsed_number.national_number)
    if number[0] == '+':
        number = number[1:]
    return number

def send_sms(number, message, request=None, DLT_TE_ID=None, ezeurl=True, sms_sender_id=None):
    try:
        if SMS_PROVIDER == 'MSG91':
            try:
                if ezeurl:
                    all_ezedox_ezeurls = get_header_urls(request)
                    for ezeurl in all_ezedox_ezeurls:
                        message = message.replace(ezeurl, all_ezedox_ezeurls[ezeurl])
                #msg91_country_code = get_country_code(number[0])
                logger.info('Message length: {}'.format(len(message)))
                msg91_country_code = get_country_code(number)
                # all_number = [get_mobile_number(number) for number in number ]
                mobile_number = get_mobile_number(number)
                conn = http.client.HTTPSConnection(MSG91_BASE_URL)
                json_payload = {
                    "sender": sms_sender_id if sms_sender_id else SMS_SENDER,
                    "route": MSG91_ROUTE,
                    "country": msg91_country_code,
                    "sms": [ { "message": message, "to": [mobile_number] } ] ,
                    "unicode" : 1,
                    "DLT_TE_ID" : DLT_TE_ID
                }
                payload = json.dumps(json_payload)
                headers = {
                    'authkey': MSG91_AUTH_KEY,
                    'content-type': "application/json"
                    }
                conn.request("POST", MSG91_URL+msg91_country_code, payload, headers)
                res = conn.getresponse()
                data = res.read()
                response = json.loads(data.decode("utf-8"))
                if response['type'] != 'success':
                    context = {"success": False, "message": _('Unable to send message'), "error": response['message']}
                    logger.error(context)
                    return Response(context, status=status.HTTP_400_BAD_REQUEST)
                context = {"success": True, "message": _("SMS sent successfully through MSG91 on {}".format(number))}
                logger.info(context)
                return Response(context, status=status.HTTP_200_OK)

            except Exception as error:
                context = {"success": False, "message": _("SMS cannot be sent."), "error":str(error)}
                logger.exception(context)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

        else:
            pass
            # message = get_encoded_message(message, request)
            # logger.info('Message length: {}'.format(len(message)))
            # response = AWS_SNS_CLIENT.publish(
            #     PhoneNumber=number,
            #     Message=message,
            #     MessageAttributes={
            #         'AWS.SNS.SMS.SenderID': {
            #             'DataType': 'String',
            #             'StringValue': SMS_SENDER
            #             }
            #         }
            # )
            # if response['ResponseMetadata']['HTTPStatusCode'] != 200:
            #     context = {"success": False, "message": _("Unable to send SMS"), "error": " AWS SNS is Unable to send SMS"}
            #     logger.info(context)
            #     return Response(context, status=status.HTTP_400_BAD_REQUEST)
            # context = { "success": True, "message": _("SMS sent successfully through sns on {}".format(number))}
            # logger.info(context)
            # return Response(context, status=status.HTTP_200_OK)
    except Exception as error:
        logger.exception(error)
        context = {'error': str(error), "success": False, "message": _(
            "SMS Sending Failed.")}
        return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



def send_otp(number, message, request=None):
    try:
        if SMS_PROVIDER == 'MSG91':
            try:
                # message = get_encoded_message(message, request)
                logger.info('Message length: {}'.format(len(message)))
                msg91_country_code = get_country_code(number)
                number = get_mobile_number(number)
                if not FAKE_SMS:
                    conn = http.client.HTTPSConnection(MSG91_BASE_URL)
                    request_url = MSG91_BASE_URL_V1 + "mobiles={number}&authkey={authkey}&route={route}&sender={sender}&message={message}&country={country}".format(
                        authkey=MSG91_AUTH_KEY,
                        number=number,
                        route=MSG91_ROUTE,
                        sender=SMS_SENDER,
                        message=message,
                        country=msg91_country_code
                    )
                    conn.request("GET", request_url)
                    res = conn.getresponse()
                    data = res.read()
                context = { "success": True, "message": _("Sent successfully through MSG91 on {}".format(number))}
                logger.info(context)
                return Response(context, status=status.HTTP_200_OK)

            except Exception as error:
                context = {"success": False, "message": _("OTP cannot be sent."), "error": str(error)}
                logger.exception(context)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)

        else:
            # message = get_encoded_message(message, request)
            logger.info('Message length: {}'.format(len(message)))
            if FAKE_SMS:
                context = { "success": True, "message": _("OTP sent successfully through sms on {}".format(number))}
                logger.info(context)
                return Response(context, status=status.HTTP_200_OK)
            response = AWS_SNS_CLIENT.publish(
                PhoneNumber=number,
                Message=message,
                MessageAttributes={
                    'AWS.SNS.SMS.SenderID': {
                        'DataType': 'String',
                        'StringValue': SMS_SENDER
                        }
                    }
            )
            if response['ResponseMetadata']['HTTPStatusCode'] != 200:
                context = {"success": False, "message": _("Unable to send OTP"), "error": " AWS SNS is Unable to send OTP"}
                logger.info(context)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)
            context = { "success": True, "message": _("OTP sent successfully through sns on {}".format(number))}
            logger.info(context)
            return Response(context, status=status.HTTP_200_OK)

    except Exception as error:
        logger.exception(error)
        context = {'error': str(error), "success": False, "message": _(
            "OTP Sending Failed.")}
        return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




MSG91_SENDOTP_URL = '/api/sendotp.php?'
MSG91_VERIFYOTP_URL = '/api/verifyRequestOTP.php?'
MSG91_RESENDOTP_URL = '/api/retryotp.php?'

def only_send_otp(number):
    try:
        url = 'http://' + MSG91_BASE_URL + MSG91_SENDOTP_URL
        conn = http.client.HTTPSConnection(MSG91_BASE_URL)
        request_url = url + "authkey={authkey}&mobile={number}&sender={sender}".format(
            authkey=MSG91_AUTH_KEY,
            number=number,
            sender=SMS_SENDER,
        )
        conn.request("GET", request_url)
        res = conn.getresponse()
        data = res.read()
        response = json.loads(data.decode("utf-8"))
        if response['type'] != 'success':
            context = {"success": False, "message": _('Unable to send otp'), "error": response['message']}
            logger.error(context)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        context = {"success": True, "message": _("OTP sent successfully on {}".format(number))}
        logger.info(context)
        return Response(context, status=status.HTTP_200_OK)

    except Exception as error:
        context = {"success": False, "message": _("OTP cannot be sent."), "error": str(error)}
        logger.exception(context)
        return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



def verify_otp(number,otp):
    try:
        url = 'http://' + MSG91_BASE_URL + MSG91_VERIFYOTP_URL
        conn = http.client.HTTPSConnection(MSG91_BASE_URL)
        request_url = url + "authkey={authkey}&mobile={number}&otp={otp}".format(
            authkey=MSG91_AUTH_KEY,
            number=number,
            otp=otp,
        )
        conn.request("GET", request_url)
        res = conn.getresponse()
        data = res.read()
        response = json.loads(data.decode("utf-8"))
        context=None
        if response['type'] != 'success':
            if response['message'] == 'already_verified':
                context = {"success": False, "message": _('This number is already verified'), "error": response['message']}
            elif response['message'] == 'otp_not_verified':
                context = {"success": False, "message": _('You have entered wrong OTP'), "error": response['message']}
            else:
                context = {"success": False, "message": _('Unable to verify otp'), "error": response['message']}
            logger.error(context)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        context = {"success": True, "message": _("Mobile number {} verified successfully.".format(number))}
        logger.info(context)
        return Response(context, status=status.HTTP_200_OK)

    except Exception as error:
        context = {"success": False, "message": _("OTP cannot be verified"), "error": str(error)}
        logger.exception(context)
        return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



def resend_otp(number):
    try:
        url = 'http://' + MSG91_BASE_URL + MSG91_RESENDOTP_URL
        conn = http.client.HTTPSConnection(MSG91_BASE_URL)
        request_url = url + "authkey={authkey}&mobile={number}&retrytype={retrytype}".format(
            authkey=MSG91_AUTH_KEY,
            number=number,
            retrytype='text',
        )
        conn.request("GET", request_url)
        res = conn.getresponse()
        data = res.read()
        response = json.loads(data.decode("utf-8"))
        context=None
        if response['type'] != 'success':
            context = {"success": False, "message": _('OTP resend failed'), "error": response['message']}
            logger.error(context)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        context = {"success": True, "message": _("OTP resend on {} successfully.".format(number))}
        logger.info(context)
        return Response(context, status=status.HTTP_200_OK)

    except Exception as error:
        context = {"success": False, "message": _("OTP cannot be resend"), "error": str(error)}
        logger.exception(context)
        return Response(context, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def send_otp_v5(number, **extra_params):
    try:
        url = 'https://' + MSG91_BASE_URL + MSG91_SEND_OTP_URL_V5
        headers = {
            'content-type':"application/json"
        }
        conn = http.client.HTTPSConnection(MSG91_BASE_URL)
        request_url = url + "authkey={authkey}&template_id={template_id}&mobile={number}&extra_param={extra_params}".format(
            authkey=MSG91_AUTH_KEY,
            template_id=MSG91_OTP_TEMPLATE_ID,
            number=number,
            extra_params=json.dumps(extra_params)
        )
        request_url = request_url.replace(" ","")
        conn.request('GET', request_url, headers=headers)

        res = conn.getresponse()
        data = res.read()
        response = json.loads(data.decode('utf-8'))
        if response['type'] != 'success':
            context = {"success": False, "message": _('OTP resend failed'), "error": response['message']}
            logger.error(context)
            return Response(context, status=status.HTTP_400_BAD_REQUEST)
        context = {"success": True, "message": _("OTP resend on {} successfully.".format(number))}
        logger.info(context)
        return Response(context, status=status.HTTP_200_OK)

    except Exception as error:
                context = {"success": False, "message": _("OTP cannot be sent."), "error": str(error)}
                logger.exception(context)
                return Response(context, status=status.HTTP_400_BAD_REQUEST)


def send_sms_v2(number, message, DLT_TE_ID=None, sms_sender_id=None):
    #msg91_country_code = get_country_code(number[0])
    logger.info('Message length: {}'.format(len(message)))
    msg91_country_code = get_country_code(number)
    # all_number = [get_mobile_number(number) for number in number ]
    mobile_number = get_mobile_number(number)
    conn = http.client.HTTPSConnection(MSG91_BASE_URL)
    json_payload = {
        "sender": sms_sender_id if sms_sender_id else SMS_SENDER,
        "route": MSG91_ROUTE,
        "country": msg91_country_code,
        "sms": [ { "message": message, "to": [mobile_number] } ] ,
        "unicode" : 1,
        "DLT_TE_ID" : DLT_TE_ID
    }
    payload = json.dumps(json_payload)
    headers = {
        'authkey': MSG91_AUTH_KEY,
        'content-type': "application/json"
        }
    conn.request("POST", MSG91_URL+msg91_country_code, payload, headers)
    res = conn.getresponse()
    data = res.read()
    response = json.loads(data.decode("utf-8"))
    return response
    