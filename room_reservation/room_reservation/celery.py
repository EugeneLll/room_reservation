from __future__ import absolute_import, unicode_literals

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "room_reservation.settings")
app = Celery("room_reservation")

app.conf.update(
    broker_url=f"redis://{os.getenv('REDIS_HOST', 'redis')}:6379/0",
    result_backend=f"redis://{os.getenv('REDIS_HOST', 'redis')}:6379/1",
    broker_connection_retry_on_startup=True,
    broker_connection_retry=True,
    broker_connection_max_retries=3,
)
app.config_from_object("django.conf:settings", namespace="CELERY")

app.autodiscover_tasks()
