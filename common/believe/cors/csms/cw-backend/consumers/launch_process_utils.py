from kafka_utils import get_logger, get_env_value
import json, requests, traceback


def call_launch_process_api(org_id, event_topic, backend_url, data):
    logger = get_logger()
    try:
        url = "{}/cw/{}/apps/launch_bulk_process".format(backend_url, org_id)
        body = {"kafka_topic": event_topic, "variables": data}
        payload = json.dumps(body)
        headers = {"Content-Type": "application/json"}
        response = requests.request('POST', url, data=payload, headers=headers, verify=get_env_value('SSL_VERIFICATION') == 'True')
        logger.info(f"Response {response} {response.json()}")
    except Exception as e:
        logger.error(traceback.format_exc())
        logger.error(
            "Unexpected error occurred while handling launch process event - {0}".format(e))


def get_topics_list():
    topics = get_env_value("LAUNCH_PROCESS_TOPICS")
    return topics.split(',')


def get_workflow_list(org_id, backend_url, topic):
    logger = get_logger()
    try:
        url = "{}/cw/{}/apps/{}/list_by_topic".format(backend_url, org_id,  topic)
        response = requests.get(url, verify=get_env_value('SSL_VERIFICATION') == 'True')
        logger.info(f"Response {response} {response.json()}")
        response_body = response.json()
        return response_body["data"]
    except Exception as e:
        logger.exception("Unexpected error occurred while handling launch process event - {0}".format(e))
        return []
