import logging, os, environ


def get_logger(file_name="kafka.log"):
    logging.basicConfig(filename="./consumers/logs/" + str(file_name), format='[%(asctime)s] %(name)s: %(levelname)s: %(msg)s', filemode='w')
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    return logger

def get_env_value(key):
    env_value =  os.getenv(key)
    if env_value is None:
        env = environ.Env(DEBUG=(bool, False), )
        environ.Env.read_env('.env')
        env_value = env(key)
    return env_value

def get_phone_number(mobile):
    mobile_number = None
    if mobile == "#":
        return mobile_number
    if mobile is not None:
        if len(mobile) == 10:
            mobile_number = "+91" + mobile
        else:
            mobile_number = mobile
    return mobile_number

def get_env():
    return get_env_value('ENV')

def replace_newlines(data):
    try:
        if isinstance(data, dict):
            return {key: replace_newlines(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [replace_newlines(element) for element in data]
        elif isinstance(data, str):
            return data.replace('\r\n', ' ').replace('\n', ' ').replace('\xa0', ' ').replace('\t', '')
        else:
            return data
    except Exception:
        return data