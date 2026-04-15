import datetime, os
from django.utils.log import DEFAULT_LOGGING
from django.utils.translation import ugettext_lazy as _

from pathlib import Path

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
# BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_DIR = Path(__file__).resolve(strict=True).parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG') == 'True'

ALLOWED_HOSTS = ['*']

COMMON_APPS = [
    'apps.user',
]

INBUILT_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',
]

# Shared apps
SHARED_CUSTOM_APPS = [

    # Created Apps
    'apps.organisations',   # you must list the app where your tenant model resides in
    'apps.app_registry',
    'apps.license',
    'apps.signals',
]

SHARED_APPS = SHARED_CUSTOM_APPS + COMMON_APPS + INBUILT_APPS

# Tenant-specific apps
TENANT_CUSTOM_APPS = [
    'channels',
    'apps.notifications',
    'apps.org_users',
    'apps.org_group',
    'apps.org_location',
    'apps.org_form',
    'apps.org_config',
    'apps.org_portals',
    'apps.org_apps',
    'rest_framework_api_key',
    'apps.org_lists',
    'apps.org_third_party',
    'apps.org_import',
    'apps.url_shortner',
    'apps.org_sequences',
    'apps.org_entity',
    'apps.org_filter',
    'apps.org_jobs',
    'apps.org_department',
    #'indian_numbers',
    'apps.drishti',
    'taggit',
    'apps.org_internal',
    'apps.org_bff',
]

TENANT_APPS = TENANT_CUSTOM_APPS + COMMON_APPS + INBUILT_APPS

# Application definition
THIRD_PARTY_APPS = [
    'storages',
    'corsheaders',
    'rest_framework',
    'drf_yasg',
    'django_filters',
    'django_extensions',
    'phonenumber_field',
    'autotranslate',
    'rosetta',
    'import_export',
    'admin_adv_search_builder',
    'django_celery_beat',
]

INSTALLED_APPS = [
    # put 'tenant_schemas' before any django core applications in INSTALLED_APPS.
    # HINT: This is necessary to overwrite built-in django management commands
    # with their schema-aware implementations.

] + SHARED_CUSTOM_APPS + TENANT_CUSTOM_APPS + COMMON_APPS + INBUILT_APPS + THIRD_PARTY_APPS


# Created USER MODEL for authorisation
AUTH_USER_MODEL = 'user.User'

# Default File Storage
DEFAULT_FILE_STORAGE = 'ezedox.custom_storage.FileStorage'
# DEFAULT_FILE_STORAGE = 'tenant_schemas.storage.TenantFileSystemStorage'

AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
    # 'apps.app_registry.backend.MyCustomBackend',
)

ASGI_APPLICATION = "ezedox.routing.application"

CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND')
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'
CELERY_QUEUE_COUNT = int(os.getenv('CELERY_QUEUE_COUNT'))
CELERY_ENABLE_UTC = True
#celery priority tasks
HIGH_PRIORITY_TASK = 0
MEDIUM_PRIORITY_TASK = 3
LOW_PRIORITY_TASK = 6
VERY_LOW_PRIORITY_TASK = 9
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [os.getenv('CHANNEL_LAYER_URL')],
        },
    },
}

MIDDLEWARE = [
    # Created MiddleWares
    'corsheaders.middleware.CorsMiddleware',
    # Default Middlewares
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'utils.middleware.UserOrgMiddleWare'
]

ROOT_URLCONF = 'ezedox.urls'

API_KEY_CUSTOM_HEADER = "HTTP_X_API_KEY"

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
                BASE_DIR / 'templates'
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
LOGIN_URL = '/api/admin/login/'
# Added template processor
TEMPLATE_CONTEXT_PROCESSORS = (
    'django.core.context_processors.request',
)

WSGI_APPLICATION = 'ezedox.wsgi.application'

POSTGRES_DB = os.getenv('POSTGRES_DB')
POSTGRES_USER =  os.getenv('POSTGRES_USER')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD')
POSTGRES_HOST = os.getenv('POSTGRES_HOST')
POSTGRES_PORT = int(os.getenv('POSTGRES_PORT'))

FLOWABLE_POSTGRES_DB = os.getenv('FLOWABLE_POSTGRES_DB')
FLOWABLE_POSTGRES_USER =  os.getenv('FLOWABLE_POSTGRES_USER')
FLOWABLE_POSTGRES_PASSWORD = os.getenv('FLOWABLE_POSTGRES_PASSWORD')
FLOWABLE_POSTGRES_HOST = os.getenv('FLOWABLE_POSTGRES_HOST')
FLOWABLE_POSTGRES_PORT = int(os.getenv('FLOWABLE_POSTGRES_PORT'))

# Database (Postgresql) Settings for multi-tenant setting
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': POSTGRES_DB,
        'USER': POSTGRES_USER,
        'PASSWORD': POSTGRES_PASSWORD,
        'HOST': POSTGRES_HOST,
        'PORT': POSTGRES_PORT,
    },
    'flowable': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': FLOWABLE_POSTGRES_DB,
        'USER': FLOWABLE_POSTGRES_USER,
        'PASSWORD': FLOWABLE_POSTGRES_PASSWORD,
        'HOST': FLOWABLE_POSTGRES_HOST,
        'PORT': FLOWABLE_POSTGRES_PORT,
    }
}

# Created setting, To sync correct apps depending on what’s being synced
# (shared or tenant).
DATABASE_ROUTERS = []


#  Created setting, hosts that are allowed to do cross-site requests
CORS_ORIGIN_ALLOW_ALL = True
# CORS_ORIGIN_WHITELIST = (

# )

# Created setting, all the global settings for a REST framework API
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': (
         'rest_framework.renderers.JSONRenderer',
         'rest_framework.renderers.BrowsableAPIRenderer',
     ),
    'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.AcceptHeaderVersioning',
    'ALLOWED_VERSIONS': ['1.0', '2.0'],
    'DEFAULT_VERSION': '1.0',
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
    'DEFAULT_PAGINATION_CLASS': 'utils.pagination.CustomPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_jwt.authentication.JSONWebTokenAuthentication',
        # 'rest_framework.authentication.SessionAuthentication',
        # 'rest_framework.authentication.BasicAuthentication',
    ),
    'TEST_REQUEST_DEFAULT_FORMAT': 'json',
    # 'DEFAULT_FILTER_BACKENDS': (
    #     'django_filters.rest_framework.DjangoFilterBackend',
    # ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle'
    ],
}

if os.getenv('PROD') == 'True':
    REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = (
         'rest_framework.renderers.JSONRenderer',
     )

# To enable tenant aware caching, this will add adds the tenants
# schema_name as the first key prefix.
CACHES = {
    "default": {
        'BACKEND': 'django.core.cache.backends.filebased.FileBasedCache',
        'LOCATION': BASE_DIR / 'cache/django_cache',
        'TIMEOUT': 60*60*24*3,
        'OPTIONS': {
            'MAX_ENTRIES': 1000
        }
    },
    "rosetta": {
        'BACKEND': 'django.core.cache.backends.filebased.FileBasedCache',
        'LOCATION': BASE_DIR / 'cache/django_rosetta_cache',
        'TIMEOUT': 60,
        'OPTIONS': {
            'MAX_ENTRIES': 1000
        }
    },
    "redis": {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.getenv('REDIS_CACHE_URL'),
        # time to store data in redis cache in seconds
        'TIMEOUT': 60*60*24*3,
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
            "CLIENT_CLASS": "django_redis.client.DefaultClient"
        },
    }
}

#For Temporary Folders
TEMP_DIR = os.getenv('TEMP_DIR')

EZEDOX_INTERNAL_EMAIL = os.getenv('EZEDOX_INTERNAL_EMAIL')

# Created setting, this will define minimum number of days a password
# reset link is valid for
PASSWORD_RESET_TIMEOUT_DAYS = 60
REPORT_BATCH_SIZE = int(os.getenv('REPORT_BATCH_SIZE'))

# Created setting,
JWT_AUTH = {
    'JWT_VERIFY_EXPIRATION': True,
    'JWT_EXPIRATION_DELTA': datetime.timedelta(days=5),
    'JWT_ALLOW_REFRESH': True,
    'JWT_REFRESH_EXPIRATION_DELTA': datetime.timedelta(days=5),
}

# External User OTP expiration time in seconds
OTP_EXPIRATION_TIME = 200

# Password validation
# https://docs.djangoproject.com/en/2.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/2.1/topics/i18n/

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

TAGGIT_CASE_INSENSITIVE = True

LANGUAGES = (
    ('de', _('German')),
    ('en', _('English')),
    ('fr', _('French')),
    ('es', _('Spanish')),
    ('pt', _('Portuguese')),
    ('te', _('Telugu')),
    ('ja', _('Japanese')),


)
LOCALE_PATHS = (
    BASE_DIR / 'locale',
)

# AUTOTRANSLATE_TRANSLATOR_SERVICE = 'autotranslate.services.GoogleAPITranslatorService'
# GOOGLE_TRANSLATE_KEY = ''

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.1/howto/static-files/

STATIC_URL = '/cw/bc_static/'
STATIC_ROOT = BASE_DIR / "bc_static"


# S3 Credentials
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
AWS_HIRE_STORAGE_BUCKET_NAME = os.getenv('AWS_HIRE_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME')
AWS_DEFAULT_ACL = os.getenv('AWS_DEFAULT_ACL')
AWS_S3_ENCRYPTION = os.getenv('AWS_S3_ENCRYPTION')
AWS_SES_REGION_NAME = os.getenv('AWS_SES_REGION_NAME')
AWS_SES_REGION_ENDPOINT = os.getenv('AWS_SES_REGION_ENDPOINT')
AWS_QUERYSTRING_EXPIRE = 7200

#SMS credentials
#SMS_PROVIDER Supported values: MSG91, SNS
SMS_PROVIDER = "MSG91"
SMS_SENDER = os.getenv('SMS_SENDER')

# Process Engine User Details
PROCESS_ENGINE_USER = os.getenv('PROCESS_ENGINE_USER')
PROCESS_ENGINE_PASSWORD = os.getenv('PROCESS_ENGINE_PASSWORD')
PROCESS_ENGINE_USERPASSWORD_SALT = os.getenv('SALT_FOR_PASSWORD')
# Process Engine Setup URLs
PROCESS_IDM_URL = os.getenv('PROCESS_IDM_URL')
PROCESS_MODELER_URL = os.getenv('PROCESS_MODELER_URL')
PROCESS_ENGINE_URL = os.getenv('PROCESS_ENGINE_URL')
PROCESS_ENGINE_READ_REPLICA_URL = os.getenv('PROCESS_ENGINE_READ_REPLICA_URL')

CHAT_SOFTWARE = "LOG_FILE"
LOG_LEVEL = os.getenv('LOG_LEVEL')


# Logger config
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '[%(asctime)s] %(name)s: %(levelname)s: %(message)s'
        },
        'request_log': {
            '()': 'django.utils.log.ServerFormatter',
            'format': '[{server_time}] {message}',
            'style': '{',
        },
        'django.server': DEFAULT_LOGGING['formatters']['django.server'],
        'gunicorn_access': {
            'format': '[%(asctime)s] gunicorn.access %(message)s'
        }
    },
    'handlers': {
        # General app logs
        'file_handler': {
            'level': LOG_LEVEL,
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/app.log',
            'maxBytes': 10485760,  # 10 MB
            'backupCount': 5,
            'formatter': 'standard'
        },
        'console_handler': {
            'level': LOG_LEVEL,
            'class': 'logging.StreamHandler',
            'stream': 'ext://sys.stderr',
            'formatter': 'standard'
        },

        # Django server logs
        'django_server_console': {
            'class': 'logging.StreamHandler',
            'formatter': 'django.server',
            'level': LOG_LEVEL
        },
        'django_server_file': {
            'formatter': 'django.server',
            'level': LOG_LEVEL,
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/app.log',
            'maxBytes': 10485760,
            'backupCount': 5,
        },

        # Django request logs
        'django_request_console': {
            'class': 'logging.StreamHandler',
            'formatter': 'request_log',
            'level': LOG_LEVEL
        },
        'django_request_file': {
            'formatter': 'request_log',
            'level': LOG_LEVEL,
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/app.log',
            'maxBytes': 10485760,
            'backupCount': 5,
        },

        # Gunicorn access logs
        'gunicorn_access_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/gunicorn_access.log',
            'maxBytes': 10485760,
            'backupCount': 5,
            'formatter': 'gunicorn_access'
        },
        'gunicorn_access_console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'gunicorn_access',
            'stream': 'ext://sys.stdout',
        },

        # Gunicorn error logs (optional, you can route to main app logs)
        'gunicorn_error_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/gunicorn_error.log',
            'maxBytes': 10485760,
            'backupCount': 5,
            'formatter': 'standard'
        },
        'gunicorn_error_console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'standard',
            'stream': 'ext://sys.stderr',
        },
    },
    'root': {
        'handlers': ['file_handler', 'console_handler'],
        'level': LOG_LEVEL,
    },
    'loggers': {
        'django': {
            'handlers': ['file_handler', 'console_handler'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'django.request': {
            'handlers': ['django_request_console', 'django_request_file'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'django.server': {
            'handlers': ['django_server_console', 'django_server_file'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'django.channels.server': {
            'handlers': ['django_server_console', 'django_server_file'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'gunicorn.access': {
            'handlers': ['gunicorn_access_console', 'gunicorn_access_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'gunicorn.error': {
            'handlers': ['gunicorn_error_console', 'gunicorn_error_file'],
            'level': 'INFO',
            'propagate': False,
        },
    }
}
REST_PROXY = {
    'HOST': PROCESS_ENGINE_URL,
    'AUTH': {
        'user': PROCESS_ENGINE_USER,
        'password': PROCESS_ENGINE_PASSWORD,
        # Or alternatively:
        'token': '',
    },
    'TIMEOUT': None,
    'DEFAULT_HTTP_ACCEPT': 'application/json',
    'DEFAULT_HTTP_ACCEPT_LANGUAGE': 'en-US,en;q=0.8',
    'DEFAULT_CONTENT_TYPE': 'text/plain',

    # Return response as-is if enabled
    'RETURN_RAW': False,

    # Used to translate Accept HTTP field
    'ACCEPT_MAPS': {
        'text/html': 'application/json',
    },

    # Do not pass following parameters
    'DISALLOWED_PARAMS': ('format',),

    # Perform a SSL Cert Verification on URI requests are being proxied to
    'VERIFY_SSL': True
}


# Encryption settings
ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY')

FAKE_SMS = True

# internal ip to skip permission check
INTERNAL_IP = []
SWAGGER_VIEW = os.getenv('SWAGGER_VIEW') == 'True'

#Increasing Django Server upload limit to 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 20*1024*1024


#DEADLETTERJOBS EMAIL
try:
    DEADLETTERJOBS_EMAIL = os.getenv('DEADLETTERJOBS_EMAIL')
    DEADLETTERJOBS_EMAIL = DEADLETTERJOBS_EMAIL.split(',')
except:
    DEADLETTERJOBS_EMAIL = []

# Elastic Search
# ELASTICSEARCH_DSL={
#     'default': {
#         'hosts': os.getenv('ELASTIC_SEARCH_URL')
#     },
# }

CANDIDATE_DOMAIN_URL = os.getenv('CANDIDATE_DOMAIN_URL')
DJANGO_ADMIN_DOMAIN_URL = os.getenv('DJANGO_ADMIN_DOMAIN_URL')
BACKEND_DOMAIN_URL = os.getenv('BACKEND_DOMAIN_URL')
CW_BASE_URL = os.getenv('CW_BASE_URL')
PLATFORM_BASE_URL = os.getenv("PLATFORM_BASE_URL")
PLATFORM_INTERNAL_TOKEN = os.getenv("PLATFORM_INTERNAL_TOKEN")
BASE_ORG_DOMAIN_URL = os.getenv('BASE_ORG_DOMAIN_URL')
FILE_DOMAIN_URL = os.getenv('FILE_DOMAIN_URL')

#KAFKA
KAFKA_BROKERS = os.getenv('KAFKA_BROKERS')
SENDER_EMAIL_ID = os.getenv('SENDER_EMAIL_ID')
COMMUNICATION_SERVICE_TOPIC = os.getenv('COMMUNICATION_SERVICE_TOPIC')

DEFAULT_SCHEME = os.getenv('DEFAULT_SCHEME')

FILE_BUCKET = os.getenv('FILE_BUCKET') if os.getenv('FILE_BUCKET') else "S3"
if FILE_BUCKET == "S3":
    STATICFILES_STORAGE = 'ezedox.custom_storage.S3staticFileStorage'

#AZURE BLOB STORAGE
AZURE_ACCOUNT_NAME = os.getenv('AZURE_ACCOUNT_NAME')
AZURE_ACCOUNT_KEY = os.getenv('AZURE_ACCOUNT_KEY')
AZURE_CONTAINER = os.getenv('AZURE_CONTAINER')
AZURE_BLOB_MAX_MEMORY_SIZE = '20MB'
AZURE_URL_EXPIRATION_SECS = 7200

SSL_VERIFICATION = os.getenv('SSL_VERIFICATION') == 'True'

KALEYRA_OTP_TEMPLATE_ID = os.getenv('KALEYRA_OTP_TEMPLATE_ID')
DEFAULT_HEADERS = {
    'PLATFORM': os.getenv('PLATFORM_INTERNAL_TOKEN'),
    'INTEGRATION': os.getenv('INTEGRATION_INTERNAL_TOKEN')
}

try:
    ALLOWED_HOST_FOR_CW_HEADERS = os.getenv('ALLOWED_HOST_FOR_CW_HEADERS').split(',')
except:
    ALLOWED_HOST_FOR_CW_HEADERS = []

#FCM
FCM_URL=""
FCM_DYNAMIC_LINK=""
FCM_API_KEY=""

#ZOOP OCR Integration
ZOOP_URL = ""
ZOOP_URL_APP_ID = ""
ZOOP_URL_APP_KEY = ""

#FRS
FRS_AUTH_URL=""
FRS_BASE_URI=""
FRS_KEY_ID=""
FRS_KEY_SECRET=""
FRS_OCR=""
FRS_MASK=""
FRS_BANK_VERIFY=""
FRS_BANK_STATUS=""

#Slack settings
SLACK_API_TOKEN = ""
SLACK_URL = ""

#Google Chat settings
GOOGLE_CHAT_URL = ""

ONGRID_PROXY_URL = ""

#0 for international, 91 for India, 1 for USA in case of MSG91
# msg91_route: trannsactional=4 promotional=1
MSG91_AUTH_KEY = ""
MSG91_URL = ""
MSG91_BASE_URL = ""
MSG91_ROUTE = ""
MSG91_BASE_URL_V1 = ""
MSG91_OTP_TEMPLATE_ID = ""
MSG91_SEND_OTP_URL_V5 = ""

# Created email settings
EMAIL_BACKEND = ''
EMAIL_HOST = ""
EMAIL_HOST_USER = ""
EMAIL_HOST_PASSWORD = ""
EMAIL_PORT = ""
EMAIL_USE_TLS = ""