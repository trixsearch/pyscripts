import json
import logging
import traceback
import requests
from django.db import connection
from ezedox.settings import SLACK_API_TOKEN, SLACK_URL, GOOGLE_CHAT_URL, CHAT_SOFTWARE, VERY_LOW_PRIORITY_TASK

from ezedox.celery import app
from re import search

#list of int
blocked_log_id = [23014,23053]

#list of messages [["msg1","msg2"],["msg3","msg4"]]
blocked_msg_list = [
                    ["No catching boundary event found for error with errorCode","already exist in the system"],
                    ["No catching boundary event found for error with errorCode","already exists"]
                ]

@app.task(bind=True, name="celery_logger")
def logger_celery(self, url, data, headers, type=None):
    try:
        response = None
        if type == 'google_chat':
            msg_flag = check_message(data)
            if msg_flag:
                response = requests.post(url = url, data = data, headers = headers)
        else:
            response = requests.post(url = url, data = data, headers = headers)
        if response and response.status_code != 200:
            logging.critical("Sending log request to channel Failed. Status Code: {}".format(response.status_code))
    except Exception as error:
        logging.critical("Sending log to channel Failed due to {}".format(str(error)))

def check_message(data):
    msg_flag = True
    for msg in blocked_msg_list:
        first_msg = msg[0]
        second_msg = msg[1]
        if search(first_msg, data) and search(second_msg, data):
            msg_flag = False
            return msg_flag
    return msg_flag

def getMessage(error_dict, error_code):
	return error_dict.get(error_code)[0]

def getLogMessage(error_dict, error_code):
	return error_dict.get(error_code)[0] + error_dict.get(error_code)[1]

class Logger:

    def __init__(self, logger_name=None):

        # logger instance
        if logger_name:
            self.logger = logging.getLogger(logger_name)
        else:
            self.logger = logging.getLogger()

    # data to be sent to api
    def slack(self, msg):
        API_ENDPOINT = SLACK_URL+SLACK_API_TOKEN
        data = {"text":msg}
        data = json.dumps(data)
        headers={"content-type": "application/json"}
        type='slack'
        logger_celery.apply_async(args=[API_ENDPOINT, data, headers, type], priority=VERY_LOW_PRIORITY_TASK)


    def google_chat(self, msg):
        API_ENDPOINT = GOOGLE_CHAT_URL
        data = {"text":msg}
        data = json.dumps(data)
        headers = {'Content-Type': 'application/json; charset=UTF-8'}
        type='google_chat'
        logger_celery.apply_async(args=[API_ENDPOINT, data, headers, type], priority=VERY_LOW_PRIORITY_TASK)


    def info(self, msg):
        try:
            if isinstance(msg,str):
                message = msg
            else:
                message = json.dumps(msg)
            self.logger.info(message)
        except Exception as error:
            self.logger.error(error)

    def debug(self, msg):
        try:
            if isinstance(msg, str):
                message = msg
            else:
                message = json.dumps(msg)
            self.logger.debug(message)
        except Exception as error:
            self.logger.error(error)

    def warning(self, msg):
        try:
            if isinstance(msg, str):
                message = msg
            else:
                try:
                    message = json.dumps(msg)
                except Exception as error:
                    message = str(msg)
            self.logger.warning(message)
        except Exception as error:
            self.logger.error(error)

    def error(self, msg, id=None):
        try:
            if isinstance(msg, str):
                message = msg
            else:
                try:
                    message = json.dumps(msg)
                except Exception as error:
                    message = str(msg)
            message = "[Log id: " + str(id) + "] " + message
            self.logger.error(message)
            if id not in blocked_log_id:
                if CHAT_SOFTWARE == 'LOG_FILE':
                    pass
                elif CHAT_SOFTWARE == 'GOOGLE':
                    self.google_chat(str(message))
                else:
                    if SLACK_API_TOKEN:
                        self.slack(str(message))
                    else:
                        self.logger.info("SLACK API TOKEN IS NOT PROVIDED")
        except Exception as error:
            self.logger.error(error)

    def critical(self, msg, id=None):
        try:
            exception = traceback.format_exc()
            if isinstance(msg, str):
                message = msg
            else:
                try:
                    message = json.dumps(msg)
                except Exception as error:
                    message = str(msg)
            message = "[Log id: " + str(id) + "] " + message
            self.logger.critical(message)
            critical_message= str(message)+exception
            if id not in blocked_log_id:
                if CHAT_SOFTWARE == 'LOG_FILE':
                    pass
                elif CHAT_SOFTWARE == 'GOOGLE':
                    self.google_chat(critical_message)
                else:
                    if SLACK_API_TOKEN:
                        self.slack(critical_message)
                    else:
                        self.logger.info("SLACK API TOKEN IS NOT PROVIDED")
        except Exception as error:
            self.logger.error(error)

    def exception(self, msg, id=None):
        try:
            exception = traceback.format_exc()
            if isinstance(msg, str):
                message = msg
            else:
                try:
                    message = json.dumps(msg)
                except Exception as error:
                    message = str(msg)
            message = "[Log id: " + str(id) + "] " + message
            self.logger.exception(message)
            exception_message= str(message)+exception
            if id not in blocked_log_id:
                if CHAT_SOFTWARE == 'LOG_FILE':
                    pass
                elif CHAT_SOFTWARE == 'GOOGLE':
                    self.google_chat(exception_message)
                else:
                    if SLACK_API_TOKEN:
                        self.slack(exception_message)
                    else:
                        self.logger.info("SLACK API TOKEN IS NOT PROVIDED")
        except Exception as error:
            self.logger.error(error)
