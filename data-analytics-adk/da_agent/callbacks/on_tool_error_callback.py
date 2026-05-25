from typing import Optional, Dict, Any
from google.adk.tools.tool_context import ToolContext
from google.adk.tools.base_tool import BaseTool


def handle_tool_error(
    tool: BaseTool,
    args: Dict[str, Any],
    tool_context: ToolContext,
    error: Exception,
) -> Optional[Dict]:
    """
    Called by ADK when any tool call raises an exception — including the
    'Tool not found' ValueError thrown by _get_tool when the model emits a
    hallucinated or malformed function name (e.g. MiMo appending
    '<|channel|>commentary' to a valid tool name).

    Returning a non-None dict sends it back to the LLM as the tool result,
    letting the model self-correct instead of crashing the task.
    """
    error_str = str(error)
    tool_name = getattr(tool, "name", "<unknown>")

    print(f"[Callback] Tool error in '{tool_name}': {error_str[:200]}")

    # ── Case 1: Tool name not found (hallucinated / corrupted name) ───────────
    if "not found" in error_str and "Available tools" in error_str:
        # Extract the available tools list from the error message so the LLM
        # knows exactly what it can call.
        correction_msg = (
            f"[TOOL ERROR - SELF CORRECT REQUIRED]\n"
            f"You called a tool named '{tool_name}' which does not exist.\n"
            f"This is likely caused by a malformed function name "
            f"(e.g. extra tokens appended to a valid name).\n\n"
            f"{error_str}\n\n"
            f"ACTION REQUIRED: Retry the operation using the EXACT tool name "
            f"from the 'Available tools' list above. Do not append any extra "
            f"text, tokens, or suffixes to the tool name."
        )
        return {"result": correction_msg}

    # ── Case 2: Any other tool exception — surface it to the LLM ─────────────
    # Returning None here lets ADK re-raise the original exception as before,
    # which is the correct behavior for unexpected errors.
    return None
