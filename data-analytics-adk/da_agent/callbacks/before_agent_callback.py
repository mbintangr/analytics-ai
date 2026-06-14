from google.adk.agents.callback_context import CallbackContext
from google.genai import types
from typing import Optional

def log_before_agent_execution(callback_context: CallbackContext) -> Optional[types.Content]:
    """
    Logs the before agent execution to the database.
    """
    agent_name = callback_context.agent_name
    current_state = callback_context.state.to_dict()

    print(f"\n[Callback] Entering agent: {agent_name}")
    print(f"[Callback] Session ID: {current_state.get('session_id', 'Not Found')}")

    try:
        session_id = current_state.get("session_id")
        if session_id:
            from database import get_db_connection
            import uuid
            print(f"[Callback] Attempting to log to DB for session {session_id}")
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO "AnalysisProcess" 
                        (id, "analysisSessionId", type, name, event, timestamp, details)
                        VALUES (%s, %s, 'AGENT', %s, 'START', NOW(), %s)
                        RETURNING id;
                        """,
                        (str(uuid.uuid4()), session_id, agent_name, types.Part(text=str(current_state)).to_json() if hasattr(types.Part(text=str(current_state)), "to_json") else "{}")
                    )
                    inserted_id = cur.fetchone()[0]
                    print(f"[Callback] Successfully logged to DB. ID: {inserted_id}")
        else:
            print("[Callback] Skipping DB log: No session_id found in context.")
    except Exception as e:
        print(f"[Callback] Error logging to DB: {e}")
        import traceback
        traceback.print_exc()