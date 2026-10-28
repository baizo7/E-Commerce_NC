import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings module for 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'marketplace_core.settings')

app = Celery('marketplace_core')

# Read config from Django settings namespace 'CELERY'
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Periodic task schedules (Celery Beat)
app.conf.beat_schedule = {
    'release-expired-orders-every-5-minutes': {
        'task': 'apps.orders.tasks.release_expired_orders_async',
        'schedule': 300.0, # Run every 5 minutes (300 seconds)
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Celery Request: {self.request!r}')
