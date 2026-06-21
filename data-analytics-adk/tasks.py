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
from da_agent.agent import create_root_agent, edaAgentOutputSchema, MODEL_CONFIGS, DEFAULT_MODEL
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.events import Event, EventActions
from google.adk.artifacts import InMemoryArtifactService
from da_agent.dataTools import save_text_to_file
from da_agent.duckdb_engine import DuckDBEngine
from google.genai import types
from pydantic import ValidationError
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

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime.date, datetime.datetime)):
            return obj.isoformat()
        try:
            return super().default(obj)
        except TypeError:
            return str(obj)

def embed_images_in_markdown(markdown_text: str, output_dir: str) -> str:
    markdown_text = re.sub(r'`?\[Embed Image Here:\s*`?(.*?)`?\]`?', r'\1', markdown_text)
    
    markdown_text = re.sub(r'!\[(.*?)[\(\[]\s*`?(.*?\.(?:png|jpg|jpeg|gif|webp|svg))`?\s*[\)\]]`?\s*\]', r'![\1](\2)', markdown_text)

    lines = markdown_text.splitlines(keepends=True)
    for i, line in enumerate(lines):
        clean_line = line.strip(' \t\n\r`"\'')
        if re.search(r'\.(?:png|jpg|jpeg|gif|webp|svg)$', clean_line, re.IGNORECASE) and not clean_line.startswith("!["):
            img_path = os.path.join(output_dir, clean_line)
            if os.path.isfile(img_path):
                filename_no_ext = os.path.splitext(clean_line)[0]
                lines[i] = line.replace(line.strip(), f"![{filename_no_ext}]({clean_line})")

    markdown_text = "".join(lines)

    pattern = r"!\[(.*?)\]\((.*?)\)"

    def replace_match(match):
        alt_text = match.group(1)
        image_path = match.group(2).strip('`"\' ')
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

async def process_dataset_async(dataset_path: str, session_id: str, query: str = "Please analyze the dataset using tools provided and provide a summary.", business_questions: str = "", model_name: str = ""):
    start_time = time.time()
    APP_NAME = "agents"
    USER_ID = "user_1"

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('UPDATE "AnalysisSession" SET status=%s WHERE id=%s', ("PROCESSING", session_id))

    if not os.path.exists(dataset_path):
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('UPDATE "AnalysisSession" SET status=%s WHERE id=%s', ("FAILED", session_id))
        return

    dataset_name = os.path.splitext(os.path.basename(dataset_path))[0]
    output_dir = os.path.join("outputs", dataset_name)
    os.makedirs(output_dir, exist_ok=True)
    raw_data_path = os.path.join(output_dir, "raw_data.parquet")

    try:
        import pyarrow as pa
        import pyarrow.parquet as pq
        import gc
        
        chunksize = 50000
        writer = None
        
        with pd.read_csv(dataset_path, chunksize=chunksize) as reader:
            for i, chunk in enumerate(reader):
                table = pa.Table.from_pandas(chunk, preserve_index=False)
                
                if writer is None:
                    writer = pq.ParquetWriter(raw_data_path, table.schema)
                
                writer.write_table(table)
                
                del chunk
                del table
                gc.collect()
            
        if writer:
            writer.close()
            
    except Exception as e:
        print(f"Chunked conversion failed: {e}")
        raise e

    session_service = InMemorySessionService()

    engine = DuckDBEngine()
    engine.register_parquet("raw_data", raw_data_path)

    initial_state = {
        "output_dir": output_dir,
        "duckdb_engine": engine,
        "data_state": {
            "raw_data": {
                "description": "The initial data uploaded by the user.",
                "path": raw_data_path,
            }
        },
        "data_understanding": "",
        "data_assessment": "",
        "data_cleaning": "",
        "business_questions": business_questions,
        "data_preparation": "",
        "insights": "",
        "eda_report": "",
        "eda_schema_error": "",
        "eda_last_raw_output": "",
        "final_report": "",
        "session_id": session_id,
    }

    await session_service.create_session(
        app_name=APP_NAME,
        user_id=USER_ID,
        session_id=session_id,
        state=initial_state,
    )

    agent = create_root_agent(model_name or DEFAULT_MODEL)
    runner = Runner(
        app_name=APP_NAME,
        agent=agent,
        session_service=session_service,
    )

    EDA_SCHEMA_MAX_RETRIES = 3

    async def run_pipeline(content):
        token = 0
        final_response_text = ""
        last_author = None
        async for event in runner.run_async(
            new_message=content,
            user_id=USER_ID,
            session_id=session_id,
        ):
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

            usage_metadata = getattr(event, "usage_metadata", None)
            if usage_metadata:
                if isinstance(usage_metadata, dict):
                    token += usage_metadata.get("total_token_count", 0)
                else:
                    token += getattr(usage_metadata, "total_token_count", 0)

            if event.is_final_response():
                if event.content and event.content.parts:
                    final_response_text = event.content.parts[0].text

        return token, final_response_text

    try:
        content = types.Content(role="user", parts=[types.Part(text=query)])
        token = 0
        final_response_text = ""

        for attempt in range(EDA_SCHEMA_MAX_RETRIES):
            try:
                t, r = await run_pipeline(content)
                token += t
                final_response_text = r
                break
            except (ValidationError, json.JSONDecodeError) as ve:
                if attempt == EDA_SCHEMA_MAX_RETRIES - 1:
                    raise

                session_snapshot = await session_service.get_session(
                    app_name=APP_NAME, user_id=USER_ID, session_id=session_id
                )
                raw_output = session_snapshot.state.get("eda_last_raw_output", "(not captured)")
                error_msg = (
                    f"Your previous output failed Pydantic schema validation.\n"
                    f"ERROR:\n{str(ve)}\n\n"
                    f"YOUR RAW OUTPUT:\n{raw_output}\n\n"
                    f"Fix the output so it matches the required schema."
                )
                error_event = Event(
                    invocation_id=f"retry-{attempt}",
                    author="system",
                    actions=EventActions(
                        state_delta={"eda_schema_error": error_msg}
                    ),
                )
                await session_service.append_event(session_snapshot, error_event)
                content = types.Content(role="user", parts=[types.Part(text=query)])

    finally:
        engine.close()

    updated_session = await session_service.get_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=session_id
    )

    end_time = time.time()
    duration = end_time - start_time

    final_report = updated_session.state.get("final_report")
    report_path = None
    report_title = None

    if final_report:
        match = re.search(r'^#\s+(.*)', final_report, re.MULTILINE)
        if match:
            report_title = match.group(1).strip()

        final_report = embed_images_in_markdown(final_report, output_dir)
        report_path = os.path.join(output_dir, "analysis_report.md")
        save_text_to_file(final_report, report_path)

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
def process_dataset_task(dataset_path, session_id, business_questions="", model_name=""):
    print("process_dataset_task", business_questions, "model:", model_name)
    try:
        asyncio.run(process_dataset_async(dataset_path, session_id, business_questions=business_questions, model_name=model_name))
    except Exception as e:
        print(f"Task failed: {e}")
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('UPDATE "AnalysisSession" SET status=%s WHERE id=%s', ("FAILED", session_id))
        raise e

@task_failure.connect
def on_task_failure(sender=None, task_id=None, exception=None, args=None, kwargs=None, traceback=None, einfo=None, **other):
    print(f"Task failure signal received for task_id={task_id}, exception={exception}")
    
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
