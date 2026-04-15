from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab

# set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ezedox.settings')

app = Celery('ezedox')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))


app.conf.beat_schedule = {
    'process_instance_history_cleanup': {
        'task': 'process_instance_history_cleanup',
        'schedule': crontab(minute=0, hour=17),
        'options': {'queue': 'process_instance_history_cleanup'},
    },
    'cleanup_process_instance_cleanup_logs': {
        'task': 'cleanup_process_instance_cleanup_logs',
        'schedule': crontab(minute=0, hour=17, day_of_week=0),
        'options': {'queue': 'process_instance_history_cleanup'},
    },
}
