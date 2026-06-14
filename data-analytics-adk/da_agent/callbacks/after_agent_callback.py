from google.adk.agents.callback_context import CallbackContext
from google.genai import types
from typing import Optional

def log_after_agent_execution(callback_context: CallbackContext) -> Optional[types.Content]:
    """
    Logs the after agent execution to the database.
    """
    agent_name = callback_context.agent_name
    current_state = callback_context.state.to_dict()

    print(f"[Callback] Exiting agent: {agent_name}")
    print(f"[Callback] Final State: {current_state}")

    try:
        session_id = current_state.get("session_id")
        if session_id:
            from database import get_db_connection
            import json
            import uuid
            import math
            
            def json_serial(obj):
                if isinstance(obj, (datetime.date, datetime.datetime)):
                    return obj.isoformat()
                if isinstance(obj, float) and math.isnan(obj):
                    return None
                return str(obj)

            def sanitize_for_json(obj):
                if isinstance(obj, float):
                    if math.isnan(obj) or math.isinf(obj):
                        return None
                    return obj
                elif isinstance(obj, dict):
                    return {k: sanitize_for_json(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [sanitize_for_json(v) for v in obj]
                return obj

            import datetime
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO "AnalysisProcess" 
                        (id, "analysisSessionId", type, name, event, timestamp, details)
                        VALUES (%s, %s, 'AGENT', %s, 'END', NOW(), %s)
                        """,
                        (str(uuid.uuid4()), session_id, agent_name, json.dumps({"state": sanitize_for_json(current_state)}, default=json_serial))
                    )
    except Exception as e:
        print(f"[Callback] Error logging to DB: {e}")