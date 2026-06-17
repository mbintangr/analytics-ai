import psycopg2
from contextlib import contextmanager
from config import DATABASE_URL
import logging

logger = logging.getLogger(__name__)

@contextmanager
def get_db_connection():
    conn = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        yield conn
        conn.commit()
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()
