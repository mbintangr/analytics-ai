from typing import Optional
from google.adk.tools.tool_context import ToolContext
from google.adk.tools.base_tool import BaseTool
from typing import Dict, Any
from copy import deepcopy

# --- Define the Callback Function ---
def log_after_tool_execution(
    tool: BaseTool, args: Dict[str, Any], tool_context: ToolContext, tool_response: Dict
) -> Optional[Dict]:
    """Logs the after tool execution to the database."""
    agent_name = tool_context.agent_name
    tool_name = tool.name

    print(f"[Callback] Exiting tool: {tool_name} in agent {agent_name}")
    print(f"[Callback] Tool Response: {tool_response}")

    # Log to Database
    try:
        # tool_context might have state, check for it
        state = getattr(tool_context, "state", {})
        if hasattr(state, "to_dict"):
             state = state.to_dict()
        
        session_id = state.get("session_id")

        if not session_id:
             # Fallback: check if session_id is directly on tool_context (legacy check)
             session_id = getattr(tool_context, "session_id", None)

        if session_id:
            from database import get_db_connection
            import json
            import datetime
            import uuid
            import math
            
            def json_serial(obj):
                if isinstance(obj, (datetime.date, datetime.datetime)):
                    return obj.isoformat()
                if isinstance(obj, float) and math.isnan(obj):
                    return None
                return str(obj)

            # Pre-process dict to remove NaNs at top level if needed, 
            # but json.dumps with allow_nan=False (default is True in Python, invalid for JSON standard/Postgres) 
            # or custom encoder is better. 
            # Postgres rejects NaN. Python's json.dumps produces NaN by default.
            # We need to replace NaN with None in the data structure or use a custom encoder that handles it, 
            # BUT json.dump's default encoder doesn't call 'default' for floats.
            # So we must traverse and replace or use use simplejson with ignore_nan=True (which produces null) 
            # or just stringify if we can't easily recurse.
            # Simplest for now: simple recursive replacement.

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

            sanitized_response = sanitize_for_json(tool_response)

            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO "AnalysisProcess" 
                        (id, "analysisSessionId", type, name, event, timestamp, details)
                        VALUES (%s, %s, 'TOOL', %s, 'END', NOW(), %s)
                        """,
                        (str(uuid.uuid4()), session_id, tool_name, json.dumps({"result": sanitized_response}, default=json_serial))
                    )
    except Exception as e:
        print(f"[Callback] Error logging to DB: {e}")
