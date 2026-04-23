import os
import shutil
import uuid
import datetime
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn
from tasks import process_dataset_task
from database import get_db_connection
from celery_app import celery_app

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.ERROR)
logging.getLogger().setLevel(logging.ERROR)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],
    allow_origins=["http://localhost:4006", "https://ai.mbintangr.com", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...), user_id: str = Form(...)):
    try:
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        
        # Setup upload directory
        upload_dir = os.path.join("datasets", "uploads")
        os.makedirs(upload_dir, exist_ok=True)

        # Save uploaded file
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        file_path = os.path.join(
            upload_dir, f"{timestamp}_{file.filename}_{session_id}"
        )
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Create DB record
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Insert session for the provided user_id
                cur.execute(
                    """
                    INSERT INTO "AnalysisSession" 
                    (id, "userId", title, "originalFileName", "datasetPath", status, "createdAt")
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                    """,
                    (
                        session_id, 
                        user_id, 
                        f"Analysis of {file.filename}", 
                        file.filename, 
                        file_path, 
                        "PROCESSING"
                    )
                )

        # Trigger Celery Task
        result = process_dataset_task.delay(file_path, session_id)

        # Store Celery task ID for cancellation
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('UPDATE "AnalysisSession" SET "celeryTaskId"=%s WHERE id=%s', (result.id, session_id))


        return {"session_id": session_id, "status": "processing"}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/report/{session_id}")
async def get_report(session_id: str):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    'SELECT "reportPath", status FROM "AnalysisSession" WHERE id = %s',
                    (session_id,)
                )
                result = cur.fetchone()
                
                if not result:
                    raise HTTPException(status_code=404, detail="Session not found")
                
                report_path, status = result
                
                if not report_path or not os.path.exists(report_path):
                    if status == "FAILED":
                         raise HTTPException(status_code=404, detail="Analysis failed")
                    return {"status": status, "report": None}
                
                with open(report_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                return {"status": status, "report": content}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/project/{session_id}")
async def delete_project(session_id: str):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Get dataset path
                cur.execute(
                    'SELECT "datasetPath", "originalFileName" FROM "AnalysisSession" WHERE id = %s',
                    (session_id,)
                )
                result = cur.fetchone()
                
                if not result:
                    raise HTTPException(status_code=404, detail="Session not found")

                dataset_path, original_filename = result

                # Delete dataset file
                if dataset_path and os.path.exists(dataset_path):
                    try:
                        os.remove(dataset_path)
                        print(f"Deleted dataset: {dataset_path}")
                    except OSError as e:
                        print(f"Error deleting dataset {dataset_path}: {e}")

                # Delete output directory                
                if dataset_path:
                    dataset_name = os.path.splitext(os.path.basename(dataset_path))[0]
                    output_dir = os.path.join("outputs", dataset_name)
                    
                    if os.path.exists(output_dir):
                        try:
                            shutil.rmtree(output_dir)
                            print(f"Deleted output dir: {output_dir}")
                        except OSError as e:
                            print(f"Error deleting output dir {output_dir}: {e}")

                return {"status": "deleted", "session_id": session_id}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/dataset/{session_id}")
async def get_dataset_preview(session_id: str, page: int = 1, pageSize: int = 50):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    'SELECT "datasetPath" FROM "AnalysisSession" WHERE id = %s',
                    (session_id,)
                )
                result = cur.fetchone()
                
                if not result:
                    raise HTTPException(status_code=404, detail="Session not found")
                
                dataset_path = result[0]
                if not dataset_path:
                    raise HTTPException(status_code=404, detail="Dataset not found")
                
                dataset_name = os.path.splitext(os.path.basename(dataset_path))[0]
                raw_data_path = os.path.join("outputs", dataset_name, "raw_data.parquet")

                target_path = raw_data_path if os.path.exists(raw_data_path) else dataset_path

                import duckdb
                safe_path = target_path.replace("\\", "/")
                
                # Count total rows directly via duckdb
                count_res = duckdb.execute(f"SELECT count(*) FROM '{safe_path}'").fetchone()
                total_rows = count_res[0] if count_res else 0
                
                # Fetch paginated data using DuckDBEngine to get sanitized JSON response
                from da_agent.duckdb_engine import DuckDBEngine
                engine = DuckDBEngine()
                engine.register_parquet("raw_data_preview", target_path)
                
                offset = (page - 1) * pageSize
                res = engine.execute_query(f'SELECT * FROM "raw_data_preview" LIMIT {pageSize} OFFSET {offset}', max_rows=pageSize)
                engine.close()

                return {
                    "columns": res["columns"],
                    "rows": res["rows"],
                    "totalCount": total_rows,
                    "page": page,
                    "pageSize": pageSize
                }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Chunked Upload Endpoints

@app.post("/upload/init")
async def init_upload(filename: str = Form(...), user_id: str = Form(...)):
    """Initialize a chunked upload."""
    try:
        upload_id = str(uuid.uuid4())
        temp_dir = os.path.join("datasets", "uploads", "temp", upload_id)
        os.makedirs(temp_dir, exist_ok=True)
        return {"upload_id": upload_id}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/chunk")
async def upload_chunk(
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    file: UploadFile = File(...)
):
    """Upload a single chunk."""
    try:
        temp_dir = os.path.join("datasets", "uploads", "temp", upload_id)
        if not os.path.exists(temp_dir):
            raise HTTPException(status_code=404, detail="Upload session not found")
        
        chunk_path = os.path.join(temp_dir, f"part_{chunk_index}")
        with open(chunk_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {"status": "received", "chunk_index": chunk_index}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/complete")
async def complete_upload(
    upload_id: str = Form(...),
    filename: str = Form(...),
    user_id: str = Form(...),
    business_questions: str = Form(...),
    model_name: str = Form("")
):
    """Reassemble chunks and trigger analysis."""
    print("/complete endpoint", business_questions)
    try:
        temp_dir = os.path.join("datasets", "uploads", "temp", upload_id)
        if not os.path.exists(temp_dir):
            raise HTTPException(status_code=404, detail="Upload session not found")
        
        # Reassemble file
        chunks = sorted([f for f in os.listdir(temp_dir) if f.startswith("part_")], key=lambda x: int(x.split("_")[1]))
        
        if not chunks:
             raise HTTPException(status_code=400, detail="No chunks found")

        # Generate session ID and final path
        session_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        upload_dir = os.path.join("datasets", "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        
        final_file_path = os.path.join(
            upload_dir, f"{timestamp}_{filename}_{session_id}"
        )

        with open(final_file_path, "wb") as outfile:
            for chunk in chunks:
                chunk_path = os.path.join(temp_dir, chunk)
                with open(chunk_path, "rb") as infile:
                    shutil.copyfileobj(infile, outfile)

        # Cleanup temp dir
        shutil.rmtree(temp_dir)

        # Create DB record (Logic copied from /analyze)
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO "AnalysisSession" 
                    (id, "userId", title, "originalFileName", "datasetPath", status, "businessQuestions", "modelName", "createdAt")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    """,
                    (
                        session_id, 
                        user_id, 
                        f"Analysis of {filename}", 
                        filename, 
                        final_file_path, 
                        "PROCESSING",
                        business_questions or None,
                        model_name or None
                    )
                )

        # Trigger Celery Task
        result = process_dataset_task.delay(final_file_path, session_id, business_questions, model_name)

        # Store Celery task ID for cancellation
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('UPDATE "AnalysisSession" SET "celeryTaskId"=%s WHERE id=%s', (result.id, session_id))

        return {"session_id": session_id, "status": "processing"}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/regenerate/{session_id}")
async def regenerate_report(session_id: str):
    """Re-run analysis using the same dataset and business questions from an existing session."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    'SELECT "datasetPath", "originalFileName", "userId", "businessQuestions", "modelName" FROM "AnalysisSession" WHERE id = %s',
                    (session_id,)
                )
                result = cur.fetchone()

                if not result:
                    raise HTTPException(status_code=404, detail="Session not found")

                dataset_path, original_filename, user_id, business_questions, model_name = result

                if not dataset_path or not os.path.exists(dataset_path):
                    raise HTTPException(status_code=400, detail="Original dataset file no longer exists on disk")

                # Create new session
                new_session_id = str(uuid.uuid4())
                cur.execute(
                    """
                    INSERT INTO "AnalysisSession"
                    (id, "userId", title, "originalFileName", "datasetPath", status, "businessQuestions", "modelName", "createdAt")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    """,
                    (
                        new_session_id,
                        user_id,
                        f"Analysis of {original_filename}",
                        original_filename,
                        dataset_path,
                        "PROCESSING",
                        business_questions or None,
                        model_name or None
                    )
                )

        # Trigger Celery Task
        result = process_dataset_task.delay(dataset_path, new_session_id, business_questions or "", model_name or "")

        # Store Celery task ID for cancellation
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('UPDATE "AnalysisSession" SET "celeryTaskId"=%s WHERE id=%s', (result.id, new_session_id))

        return {"session_id": new_session_id, "status": "processing"}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cancel/{session_id}")
async def cancel_analysis(session_id: str):
    """Cancel a running analysis by revoking its Celery task."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    'SELECT "celeryTaskId", status FROM "AnalysisSession" WHERE id = %s',
                    (session_id,)
                )
                result = cur.fetchone()

                if not result:
                    raise HTTPException(status_code=404, detail="Session not found")

                celery_task_id, status = result

                if not status or not status.startswith("PROCESSING"):
                    raise HTTPException(status_code=400, detail="Analysis is not currently running")

                if celery_task_id:
                    celery_app.control.revoke(celery_task_id, terminate=True, signal='SIGTERM')

                cur.execute(
                    'UPDATE "AnalysisSession" SET status=%s WHERE id=%s',
                    ("CANCELLED", session_id)
                )

        return {"status": "cancelled", "session_id": session_id}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
