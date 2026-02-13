import os
import time
import json
import datetime
import logging
import pandas as pd
import asyncio
import psutil
import sys
import base64
import re
import mimetypes
from celery_app import celery_app
from celery.signals import task_failure
from billiard.exceptions import WorkerLostError
from database import get_db_connection
from da_agent.agent import root_agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.artifacts import InMemoryArtifactService
from da_agent.dataTools import save_text_to_file
from google.genai import types
import litellm

litellm.suppress_debug_info = True
litellm.set_verbose = False
litellm.request_timeout = 1200
litellm.num_retries = 3
litellm.telemetry = False
litellm.turn_off_message_logging = True
litellm.success_callback = []
litellm.failure_callback = []
litellm.callbacks = []

for logger_name in ["litellm", "LiteLLM", "httpx", "httpcore", "openai", "google"]:
    logging.getLogger(logger_name).setLevel(logging.ERROR)
    logging.getLogger(logger_name).propagate = False

local_logger = logging.getLogger("litellm")
local_logger.handlers = []
local_logger.propagate = False


# Reuse DateTimeEncoder
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime.date, datetime.datetime)):
            return obj.isoformat()
        try:
            return super().default(obj)
        except TypeError:
            return str(obj)

# Helper functions
async def monitor_resources(output_path: str, interval: int = 1):
    try:
        process = psutil.Process()
        with open(output_path, "w", encoding="utf-8") as f:
            while True:
                timestamp = datetime.datetime.now().isoformat()
                cpu_percent = process.cpu_percent()
                cpu_freq = psutil.cpu_freq()
                if cpu_freq:
                    current_freq_ghz = cpu_freq.current / 1000.0
                else:
                    current_freq_ghz = 0.0

                cpu_ghz = (cpu_percent / 100.0) * current_freq_ghz

                memory_info = process.memory_info()
                memory_mb = memory_info.rss / (1024 * 1024)
                memory_percent = process.memory_percent()

                data = {
                    "timestamp": timestamp,
                    "cpu_ghz": cpu_ghz,
                    "cpu_percent": cpu_percent,
                    "memory_mb": memory_mb,
                    "memory_percent": memory_percent,
                }

                json.dump(data, f)
                f.write("\n")
                f.flush()

                await asyncio.sleep(interval)
    except asyncio.CancelledError:
        pass
    except Exception as e:
        print(f"Error in resource monitoring: {e}")

class Tee:
    def __init__(self, *files):
        self.files = files

    def write(self, obj):
        for f in self.files:
            f.write(obj)
            f.flush()

    def flush(self):
        for f in self.files:
            f.flush()

def embed_images_in_markdown(markdown_text: str, output_dir: str) -> str:
    pattern = r"!\[(.*?)\]\((.*?)\)"

    def replace_match(match):
        alt_text = match.group(1)
        image_path = match.group(2)
        full_path = os.path.join(output_dir, image_path)

        if not os.path.exists(full_path):
            return match.group(0)

        try:
            mime_type, _ = mimetypes.guess_type(full_path)
            if not mime_type:
                mime_type = "image/png"

            with open(full_path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode("utf-8")

            return f"![{alt_text}](data:{mime_type};base64,{encoded_string})"
        except Exception:
            return match.group(0)

    return re.sub(pattern, replace_match, markdown_text)

async def process_dataset_async(dataset_path: str, session_id: str, query: str = "Please analyze the dataset using tools provided and provide a summary."):
    start_time = time.time()
    APP_NAME = "agents"
    USER_ID = "user_1"

    # Update DB status to PROCESSING (just to be safe, though main.py should have set it)
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('UPDATE "AnalysisSession" SET status=%s WHERE id=%s', ("PROCESSING", session_id))

    if not os.path.exists(dataset_path):
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('UPDATE "AnalysisSession" SET status=%s WHERE id=%s', ("FAILED", session_id))
        return

    df = pd.read_csv(dataset_path)

    session_service = InMemorySessionService()
    artifact_service = InMemoryArtifactService()

    dataset_name = os.path.splitext(os.path.basename(dataset_path))[0]
    output_dir = os.path.join("outputs", dataset_name)
    os.makedirs(output_dir, exist_ok=True)

    raw_data_path = os.path.join(output_dir, "raw_data.parquet")
    df.to_parquet(raw_data_path)

    initial_state = {
        "output_dir": output_dir,
        "data_state": {
            "raw_data": {
                "description": "The initial data uploaded by the user.",
                "path": raw_data_path,
            }
        },
        "data_understanding": "",
        "data_assessment": "",
        "data_cleaning": "",
        "business_questions": "",
        "data_preparation": "",
        "insights": "",
        "eda_report": "",
        "final_report": "",
        "session_id": session_id,
    }

    await session_service.create_session(
        app_name=APP_NAME,
        user_id=USER_ID,
        session_id=session_id,
        state=initial_state,
    )

    agent = root_agent
    runner = Runner(
        app_name=APP_NAME,
        agent=agent,
        session_service=session_service,
        artifact_service=artifact_service,
    )

    resources_log_path = os.path.join(output_dir, "resources.jsonl")
    monitor_task = asyncio.create_task(monitor_resources(resources_log_path))

    log_file_path = os.path.join(output_dir, "run.log")
    log_file = open(log_file_path, "w", encoding="utf-8")
    
    # We can't easily hijack sys.stdout in Celery without side effects, 
    # but we can write to the log file manually alongside logging
    
    try:
        content = types.Content(role="user", parts=[types.Part(text=query)])
        
        events_log_path = os.path.join(output_dir, "events.jsonl")
        
        token = 0
        final_response_text = ""

        last_author = None
        with open(events_log_path, "w", encoding="utf-8") as events_file:
            async for event in runner.run_async(
                new_message=content,
                user_id=USER_ID,
                session_id=session_id,
            ):
                # Convert event to dict
                event_data = None
                try:
                    if hasattr(event, "model_dump"):
                        event_data = event.model_dump(mode="json")
                    elif hasattr(event, "to_dict"):
                        event_data = event.to_dict()
                    elif hasattr(event, "__dict__"):
                        event_data = event.__dict__
                    
                    if event_data is None:
                        event_data = {"str_repr": str(event)}
                except Exception:
                    event_data = {"str_repr": str(event)}

                try:
                    author = event_data.get("author")
                    if author and author.endswith("_agent") and author != last_author:
                        last_author = author
                        new_status = f"PROCESSING {author}"
                        with get_db_connection() as conn:
                             with conn.cursor() as cur:
                                 cur.execute('UPDATE "AnalysisSession" SET status=%s WHERE id=%s', (new_status, session_id))
                except Exception as e:
                    print(f"Error updating status: {e}")

                # Log to file
                json.dump(event_data, events_file, cls=DateTimeEncoder)
                events_file.write("\n")
                events_file.flush()

                # Track tokens
                usage_metadata = getattr(event, "usage_metadata", None)
                if usage_metadata:
                    if isinstance(usage_metadata, dict):
                        token += usage_metadata.get("total_token_count", 0)
                    else:
                        token += getattr(usage_metadata, "total_token_count", 0)

                if event.is_final_response():
                    if event.content and event.content.parts:
                        final_response_text = event.content.parts[0].text

    finally:
        monitor_task.cancel()
        try:
            await monitor_task
        except asyncio.CancelledError:
            pass
        log_file.close()

    updated_session = await session_service.get_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=session_id
    )

    end_time = time.time()
    duration = end_time - start_time

    # Save final report to DB
    final_report = updated_session.state.get("final_report")
    report_path = None
    report_title = None

    if final_report:
        # Extract title from the first line starting with #
        match = re.search(r'^#\s+(.*)', final_report, re.MULTILINE)
        if match:
            report_title = match.group(1).strip()

        final_report = embed_images_in_markdown(final_report, output_dir)
        report_path = os.path.join(output_dir, "analysis_report.md")
        save_text_to_file(final_report, report_path)

    # Save processing info
    state_path = os.path.join(output_dir, "state.json")
    with open(state_path, "w", encoding="utf-8") as f:
        json.dump(updated_session.state, f, cls=DateTimeEncoder, indent=4)

    # Update DB with success
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE "AnalysisSession" 
                SET status=%s, "finishedAt"=NOW(), "durationSeconds"=%s, "totalTokens"=%s, "reportPath"=%s, title=COALESCE(%s, title)
                WHERE id=%s
                """,
                ("COMPLETED", duration, token, report_path, report_title, session_id)
            )

@celery_app.task
def process_dataset_task(dataset_path, session_id):
    try:
        asyncio.run(process_dataset_async(dataset_path, session_id))
    except Exception as e:
        print(f"Task failed: {e}")
        # Update DB with failure
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('UPDATE "AnalysisSession" SET status=%s WHERE id=%s', ("FAILED", session_id))
        raise e

@task_failure.connect
def on_task_failure(sender=None, task_id=None, exception=None, args=None, kwargs=None, traceback=None, einfo=None, **other):
    """
    Signal handler for task failures, including WorkerLostError (SIGKILL/OOM).
    """
    print(f"Task failure signal received for task_id={task_id}, exception={exception}")
    
    # Check if this is our relevant task
    # Note: 'sender' here is the task object itself
    if sender and sender.name == 'tasks.process_dataset_task':
        session_id = None
        if kwargs and 'session_id' in kwargs:
            session_id = kwargs['session_id']
        elif args and len(args) >= 2:
            session_id = args[1]
            
        if session_id:
            print(f"Updating session {session_id} status to FAILED due to task failure.")
            try:
                with get_db_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute('UPDATE "AnalysisSession" SET status=%s WHERE id=%s', ("FAILED", session_id))
            except Exception as db_err:
                print(f"Failed to update status in on_task_failure: {db_err}")
