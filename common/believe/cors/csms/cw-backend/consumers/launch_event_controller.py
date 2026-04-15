import json

from kafka_consumer import KafkaMessageConsumer
from kafka_utils import get_logger, get_env_value, replace_newlines
from celery import Celery
from skipWorkFlowConditions import skip_work_flow_hook
logger = get_logger("launch_event_kafka_consumer.log")

celery = Celery('ezedox')
celery.conf.broker_url = get_env_value('CELERY_BROKER_URL')

class LaunchEventController:
    def __init__(self):
        self._kafka_consumer = KafkaMessageConsumer()

    @staticmethod
    def _process_message(msg):
        try:
            logger.info(
                f"LaunchEventController:process_requests(): Starting message process key={msg.key} "
                f"partition={msg.partition} offset={msg.offset} "
                f"timestamp={msg.timestamp}"
            )
            decoded_kafka_message = msg.value.decode("utf-8")
            value = json.loads(decoded_kafka_message)
            event_topic = msg.topic
            logger.info(event_topic)
            logger.info(value)
            # TODO org_id can be present at different path
            data = value.get("data", None)
            domain_name = value.get("domainName", None)
            action = value.get("action", None)
            if domain_name.lower() == "employee":
                skip_work_flow_hook(data)
            logger.info(f"After applying skip work flow hooks - {data}")
            if data:
                skip_work_flow = data.get("skipWorkFlow", False)
                if isinstance(skip_work_flow, str):
                    if skip_work_flow.lower() == 'true':
                        skip_work_flow = True
                    else:
                        skip_work_flow = False
                org_id = data.get("orgId", None)
                if org_id is None and "user" in data:
                    org_id = data["user"].get("orgId", None)
                if domain_name and domain_name.upper() in ["EMPLOYEE", "EMPVERIFY", "USER"]:
                    if org_id:
                        if domain_name:
                            data["domain_name"] = domain_name
                        if action:
                            data["action"] = action
                        data = replace_newlines(data)
                        body = {"kafka_topic": event_topic, "variables": data}
                        queue_name = "launch_process_bulk_queue_0"
                        if domain_name and domain_name.upper() in ["EMPVERIFY"]:
                            queue_name = "launch_process_emp_verify_bulk_queue"
                        if not skip_work_flow:
                            celery.send_task(
                                'launch_bulk_process_util',
                                args=[body],
                                kwargs={"tenant": org_id, "user_email": "AnonymousUser"},
                                queue=queue_name,
                                priority=0
                                )
                        else:
                            logger.info(
                                f"LaunchEventController:process_requests(): Skipped message key={msg.key} "
                                f"partition={msg.partition} offset={msg.offset} "
                                f"timestamp={msg.timestamp}"
                            )
                        # celery.send_task(
                        #     'platform_data_sync',
                        #     args=[body],
                        #     kwargs={"tenant": org_id},
                        #     queue="platform_data_sync",
                        #     priority=0
                        #     )
                        logger.info(
                            f"LaunchEventController:process_requests(): Processed message key={msg.key}"
                            f"partition={msg.partition} offset={msg.offset} "
                            f"timestamp={msg.timestamp} "
                            f"domainName={domain_name}"
                        )
                else:
                    logger.info(
                        f"LaunchEventController:process_requests(): Skipped message key={msg.key} "
                        f"partition={msg.partition} offset={msg.offset} "
                        f"timestamp={msg.timestamp} "
                        f"domainName={domain_name}"
                    )
        except Exception as error:
            logger.error('Error calling launch process api', error)

    def process(self):
        try:
            for kafka_message in self._kafka_consumer.consume_message():
                if kafka_message:
                    logger.info(">>>>> LaunchEventController::process_requests(): processing started")
                    try:
                        logger.info(
                            f"LaunchEventController::process_requests(): Processing message key={kafka_message.key} "
                            f"partition={kafka_message.partition} offset={kafka_message.offset} "
                            f"timestamp={kafka_message.timestamp}"
                        )
                        self._process_message(msg=kafka_message)
                        logger.info(
                            f"LaunchEventController:process_requests(): Committing key={kafka_message.key} "
                            f"partition={kafka_message.partition} offset={kafka_message.offset} "
                            f"timestamp={kafka_message.timestamp}"
                        )
                        self._kafka_consumer.commit_message(message=kafka_message)
                    except Exception as err:
                        logger.info(
                            f"LaunchEventController::process_requests(): Encountered an error while processing the "
                            f"data {err}"
                        )
                    logger.info("<<<<< LaunchEventController::process_requests(): "
                                "Processing ended")
        except Exception as error:
            logger.error(
                f"LaunchEventController::process_requests(): Encountered an error while initializing dependency {error}"
            )
        finally:
            # Ensure proper cleanup or resource release if needed
            self._kafka_consumer.close_consumer()
            logger.info("LaunchEventController::process_requests(): Successfully cleaned up resources")


def main():
    launch_event_controller = LaunchEventController()
    launch_event_controller.process()


if __name__ == "__main__":
    main()
