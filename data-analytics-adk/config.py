import os
from dotenv import load_dotenv

load_dotenv()

# Default to localhost ports assuming local dev, override with env vars if docker
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/data-analytics")
# Use the redis service name if in docker, or localhost if local. 
# Celery broker URL
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0")
