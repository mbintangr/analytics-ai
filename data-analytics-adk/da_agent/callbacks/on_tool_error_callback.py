from typing import Optional, Dict, Any
from google.adk.tools.tool_context import ToolContext
from google.adk.tools.base_tool import BaseTool


def handle_tool_error(
    tool: BaseTool,
    args: Dict[str, Any],
    tool_context: ToolContext,
    error: Exception,
) -> Optional[Dict]:
    error_str = str(error)
    tool_name = getattr(tool, "name", "<unknown>")

    print(f"[Callback] Tool error in '{tool_name}': {error_str[:200]}")

    if "not found" in error_str and "Available tools" in error_str:
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

    return None
