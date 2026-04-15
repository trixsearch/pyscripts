import json

from kafka import KafkaProducer
from ezedox.settings import KAFKA_BROKERS
from utils.loggerwrapper import Logger

logger = Logger(__name__)


# kAFKA Producer
try:
    producer = KafkaProducer(bootstrap_servers=KAFKA_BROKERS)
except Exception as ex:
    logger.error("Failed to connect with kafka")


def raise_kafka_event(topic,payload):
    try:
        logger.info("Rasing kafka event...")
        producer.send(topic, json.dumps(payload).encode('utf-8'))
    except Exception as error:
        logger.error("Failed to raise kafka event.. ")