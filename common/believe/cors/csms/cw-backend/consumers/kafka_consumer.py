from kafka import KafkaConsumer, OffsetAndMetadata, TopicPartition
from kafka.errors import KafkaConnectionError, KafkaError, KafkaTimeoutError
from kafka_utils import get_env_value, get_logger
from launch_process_utils import get_topics_list

logger = get_logger("launch_event_kafka_consumer.log")


class KafkaMessageConsumer:

    def __init__(self):
        self._consumer = self._create_consumer()

    @staticmethod
    def _create_consumer():
        consumer = None
        topics = get_topics_list()
        try:
            consumer = KafkaConsumer(
                bootstrap_servers=get_env_value('KAFKA_BROKERS'),
                group_id='launch_process_group',
                auto_offset_reset='latest',
                enable_auto_commit=False,
                fetch_max_wait_ms=500,
                heartbeat_interval_ms=15000,
                max_poll_records=20,
                session_timeout_ms=70000
            )
            consumer.subscribe(topics)
            if consumer.bootstrap_connected():
                logger.info("KafkaMessageConsumer:_create_consumer() Kafka consumer is connected to the broker.")
        except KafkaTimeoutError as err:
            raise Exception(f"KafkaMessageConsumer::_create_consumer(): Kafka timeout error occurred: {err=}")
        except KafkaConnectionError as err:
            raise Exception(f"KafkaMessageConsumer::_create_consumer(): Error connecting to Kafka: {err=}")
        except KafkaError as err:
            raise Exception(f"KafkaMessageConsumer::_create_consumer(): Kafka error occurred: {err=}")
        return consumer

    def consume_message(self):
        if not self._consumer:
            logger.error(f"KafkaMessageConsumer:consume_message(): Consumer is not initialized!!")
            return

        for message in self._consumer:
            yield message

    def commit_message(self, message):
        try:
            topic_partition = TopicPartition(topic=message.topic, partition=message.partition)
            offset_metadata = OffsetAndMetadata(
                message.offset + 1, message.timestamp
            )  # offset + 1 to tell the consumer to send the next one
            self._consumer.commit(offsets={topic_partition: offset_metadata})
            logger.info(
                f"KafkaMessageConsumer:commit_message(): Successfully committed key={message.key} "
                f"partition={message.partition} offset={message.offset} "
                f"timestamp={message.timestamp}"
            )
        except Exception as err:
            logger.error(f"KafkaMessageConsumer:commit_message(): "
                         f"Error while committing message {message.offset} {err=}")

    def close_consumer(self):
        self._consumer.close()
