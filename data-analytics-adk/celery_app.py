from celery import Celery
from config import CELERY_BROKER_URL, CELERY_RESULT_BACKEND
import multiprocessing

multiprocessing.set_start_method('spawn', force=True)

celery_app = Celery(
    "data_analytics",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=["tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    worker_send_task_events=True,
    worker_pool='prefork',
)