from typing import Optional
from google.adk.tools.tool_context import ToolContext
from google.adk.tools.base_tool import BaseTool
from typing import Dict, Any
import json

def log_before_tool_execution(
    tool: BaseTool, args: Dict[str, Any], tool_context: ToolContext
) -> Optional[Dict]:
    agent_name = tool_context.agent_name
    tool_name = tool.name

    print(f"[Callback] Executing tool: {tool_name} in agent {agent_name}")
    print(f"[Callback] Tool Args: {args}")

    if tool_name == "set_model_response":
        try:
            state = getattr(tool_context, "state", {})
            state["eda_last_raw_output"] = json.dumps(args)
        except Exception:
            pass

    try:
        state = getattr(tool_context, "state", {})
        if hasattr(state, "to_dict"):
             state = state.to_dict()
        
        session_id = state.get("session_id")
        
        if not session_id:
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

            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO "AnalysisProcess" 
                        (id, "analysisSessionId", type, name, event, timestamp, details)
                        VALUES (%s, %s, 'TOOL', %s, 'START', NOW(), %s)
                        """,
                        (str(uuid.uuid4()), session_id, tool_name, json.dumps({"args": sanitize_for_json(args)}, default=json_serial))
                    )
    except Exception as e:
        print(f"[Callback] Error logging to DB: {e}")