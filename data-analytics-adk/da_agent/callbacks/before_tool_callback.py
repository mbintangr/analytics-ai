from typing import Optional
from google.adk.tools.tool_context import ToolContext
from google.adk.tools.base_tool import BaseTool
from typing import Dict, Any
import json
import hashlib

# Tools exempt from duplicate detection (no-arg helpers that may legitimately
# be polled multiple times within the same agent for refreshed state).
_EXEMPT_TOOLS = {"get_data_state_list", "list_output_files_tool"}

# Maximum number of times the exact same tool+args fingerprint is allowed
# before the callback short-circuits the call and warns the LLM.
_MAX_DUPLICATE_CALLS = 1


def _fingerprint(agent_name: str, tool_name: str, args: Dict[str, Any]) -> str:
    """Return a stable hash scoped to a specific agent + tool + args combination.

    Scoping by agent_name means the same SQL query is allowed to run in two
    different agents (e.g. data_assessing_agent vs data_cleaning_agent) but
    will be blocked if the exact same agent repeats the identical call.
    """
    payload = json.dumps({"agent": agent_name, "tool": tool_name, "args": args}, sort_keys=True, default=str)
    return hashlib.md5(payload.encode()).hexdigest()


def log_before_tool_execution(
    tool: BaseTool, args: Dict[str, Any], tool_context: ToolContext
) -> Optional[Dict]:
    """Logs the before tool execution and detects duplicate/looping tool calls."""
    agent_name = tool_context.agent_name
    tool_name = tool.name

    print(f"[Callback] Executing tool: {tool_name} in agent {agent_name}")
    print(f"[Callback] Tool Args: {args}")

    # Snapshot raw args before set_model_response validates them against output_schema.
    # This lets the retry loop in tasks.py recover the bad output and send the
    # validation error back to the agent as feedback.
    if tool_name == "set_model_response":
        try:
            state = getattr(tool_context, "state", {})
            state["eda_last_raw_output"] = json.dumps(args)
        except Exception:
            pass

    # ── Duplicate / loop detection ────────────────────────────────────────────
    if tool_name not in _EXEMPT_TOOLS:
        try:
            fp = _fingerprint(agent_name, tool_name, args)
            counts: Dict[str, int] = tool_context.state.get("_tool_call_counts", {})
            call_number = counts.get(fp, 0) + 1
            counts[fp] = call_number
            tool_context.state["_tool_call_counts"] = counts

            if call_number > _MAX_DUPLICATE_CALLS:
                warning = (
                    f"[DUPLICATE TOOL CALL DETECTED] You have already called "
                    f"'{tool_name}' with these exact arguments {call_number - 1} "
                    f"time(s) and received the same result. "
                    f"Calling it again will NOT produce a different outcome. "
                    f"STOP repeating this call. "
                    f"If the previous result was sufficient, proceed to the next step. "
                    f"If the previous result indicated a problem, choose a DIFFERENT "
                    f"approach or tool — do not retry the same query."
                )
                print(f"[Callback] WARNING: {warning}")
                # Returning a dict short-circuits the actual tool call in ADK;
                # the dict is handed back to the LLM as the tool result.
                return {"result": warning}
        except Exception as e:
            print(f"[Callback] Duplicate-detection error (non-fatal): {e}")
    # ─────────────────────────────────────────────────────────────────────────

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