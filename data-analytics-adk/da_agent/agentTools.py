'''
LEGACY PANDAS-BASED TOOLS (REPLACED BY DUCKDB SQL TOOLS)
The code below is preserved for reference only.
---------------------------------------------------------
import pandas as pd
import numpy as np
from .dataTools import (
    get_sample_data,
    get_head_data,
    get_tail_data,
    get_data_description,
    get_data_info,
    get_unique_values,
    get_unique_values_count,
    get_rows_by_condition,
    get_data_correlation,
    get_null_values_rows,
    profile_columns,
    compute_data_quality_score,
    merge_data,
    remove_null_values,
    fill_null_values,
    remove_duplicate_values,
    replace_column_value,
    replace_column_value_regex,
    change_data_type,
    create_column_from_expression,
    drop_columns,
    rename_columns,
    clean_text_column,
    convert_to_datetime,
    impute_missing_values,
    save_to_csv,
    group_and_aggregate,
    create_pivot_table,
    plot_bar,
    plot_line,
    plot_scatter,
    plot_histogram,
    plot_box,
    plot_heatmap,
    plot_count,
    remove_outliers,
    remove_rows_by_condition,
    clip_values,
    save_text_to_file,
    get_top_n_rows,
    get_group_stats,
    get_column_stats,
    get_aggregation_scalar,
    plot_pie,
    split_column,
    convert_column_type,
)
from google.adk.tools.tool_context import ToolContext
import json
import ast
import os
import gc


def _parse_argument(arg):
    if isinstance(arg, str):
        try:
            return json.loads(arg)
        except json.JSONDecodeError:
            try:
                return ast.literal_eval(arg)
            except (ValueError, SyntaxError):
                return arg
    return arg


def _truncate_output(data: str, max_chars: int = 5000) -> str:
    """Truncate the output string to a maximum number of characters."""
    if len(data) <= max_chars:
        return data
    return data[:max_chars] + f"\n... [Output truncated to {max_chars} chars] ..."


def _sanitize_data(data):
    """
    Recursively convert numpy types and other non-JSON-serializable types to native Python types.
    """
    if isinstance(data, dict):
        return {k: _sanitize_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [_sanitize_data(v) for v in data]
    elif isinstance(data, (np.integer, int)):
        return int(data)
    elif isinstance(data, (np.floating, float)):
        if np.isinf(data):
            return None
        return float(data)
    elif isinstance(data, (np.bool_, bool)):
        return bool(data)
    else:
        try:
            if pd.isna(data):
                return None
        except (ValueError, TypeError):
            pass
    return str(data)


def _get_dataframe(tool_context: ToolContext, key: str, columns: list[str] | None = None) -> pd.DataFrame:
    """Helper to load DataFrame from disk based on state key."""
    # Force garbage collection before loading new data
    gc.collect()

    if (
        "data_state" not in tool_context.state
        or key not in tool_context.state["data_state"]
    ):
        raise ValueError(f"Key '{key}' not found in data state.")

    state_item = tool_context.state["data_state"][key]
    if "path" not in state_item:
        if "data" in state_item and isinstance(state_item["data"], pd.DataFrame):
            # Fallback for legacy/tests if needed
            df = state_item["data"]
            if columns:
                 return df[columns]
            return df
        raise ValueError(f"Path not found for data state '{key}'.")

    path = state_item["path"]
    if not os.path.exists(path):
        raise FileNotFoundError(f"Data file not found at {path}")

    return pd.read_parquet(path, columns=columns)


def _save_dataframe(
    tool_context: ToolContext, df: pd.DataFrame, key: str, description: str
):
    """Helper to save DataFrame to disk and update state."""
    output_dir = tool_context.state.get("output_dir", "outputs")
    os.makedirs(output_dir, exist_ok=True)

    # Sanitize key for filename
    filename = f"{key}.parquet"
    path = os.path.join(output_dir, filename)

    df.to_parquet(path)
    
    # Force garbage collection after saving
    gc.collect()

    data_state = tool_context.state.get("data_state", {})
    data_state[key] = {"path": path, "description": description}
    tool_context.state["data_state"] = data_state
    return path


def exit_loop(tool_context: ToolContext):
    """
    Call this function ONLY when the upstream agent has explicitly signaled that the data cleaning process is complete.
    This action terminates the processing loop.
    """
    try:
        print(
            f"Tool 'exit_loop' called with parameters: tool_context.agent_name={tool_context.agent_name}"
        )
        tool_context.actions.escalate = True
        return {"exit_loop": "Data cleaning process is complete."}
    except Exception as e:
        return {"error": f"Error executing tool 'exit_loop': {str(e)}"}


def add_data_state(
    tool_context: ToolContext, df: pd.DataFrame, description: str, key: str = "raw_data"
):
    """
    Add a data state to the tool context.

    Args:
        tool_context (ToolContext): The tool context.
        df (pd.DataFrame): The data.
        description (str): The description of the data.
        key (str, optional): The key to use for the data state. Defaults to 'raw_data'.
    """
    try:
        print(
            f"Tool 'add_data_state' called with parameters: description={description}, key={key}"
        )
        _save_dataframe(tool_context, df, key, description)
        return f"Data state added to tool context: {key}"
    except Exception as e:
        return f"Error executing tool 'add_data_state': {str(e)}"


def change_data_state(
    tool_context: ToolContext, df: pd.DataFrame, description: str, key: str = "raw_data"
):
    """
    Change a data state in the tool context.

    Args:
        tool_context (ToolContext): The tool context.
        df (pd.DataFrame): The data.
        description (str): The description of the data.
        key (str, optional): The key to use for the data state. Defaults to 'raw_data'.
    """
    try:
        print(
            f"Tool 'change_data_state' called with parameters: description={description}, key={key}"
        )
        _save_dataframe(tool_context, df, key, description)
        return f"Data state changed in tool context: {key}"
    except Exception as e:
        return f"Error executing tool 'change_data_state': {str(e)}"


def copy_data_state_tool(
    tool_context: ToolContext,
    source_key: str = "raw_data",
    target_key: str = "cleaned_data",
) -> str:
    """
    Copy a data state to a new key.

    Args:
        tool_context (ToolContext): The tool context.
        source_key (str, optional): The key of the source data state. Defaults to 'raw_data'.
        target_key (str, optional): The key of the new data state. Defaults to 'cleaned_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'copy_data_state_tool' called with parameters: source_key={source_key}, target_key={target_key}"
        )
        df = _get_dataframe(tool_context, source_key)
        _save_dataframe(tool_context, df.copy(), target_key, f"Copy of {source_key}")
        return f"Data copied from {source_key} to {target_key}"
    except Exception as e:
        return f"Error executing tool 'copy_data_state_tool': {str(e)}"


def get_data_state_list(tool_context: ToolContext) -> list[dict[str, str]]:
    """
    Get a list of data states in the tool context.

    Args:
        tool_context (ToolContext): The tool context.

    Returns:
        list[dict[str, str]]: The list of data states.
    """
    try:
        print("Tool 'get_data_state_list' called with parameters: None")
        if "data_state" not in tool_context.state:
            return []
        state_list = []

        for item in tool_context.state["data_state"].items():
            state_list.append({"key": item[0], "description": item[1]["description"]})

        return state_list
    except Exception as e:
        return [{"error": f"Error executing tool 'get_data_state_list': {str(e)}"}]


def get_understanding_report(tool_context: ToolContext, key: str = "raw_data") -> dict:
    """
    Get an understanding report for the data state.

    Args:
        tool_context (ToolContext): The tool context.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: The understanding report.
    """
    try:
        print(f"Tool 'get_understanding_report' called with parameters: key={key}")
        df = _get_dataframe(tool_context, key)
        data_info = get_data_info(df)
        data_description = get_data_description(df)
        sample_data = get_sample_data(df, sample_size=3).T

        understanding_report = {
            "data_info": data_info,
            "data_description": data_description.to_dict(),
            "sample_data": sample_data.to_dict(),
        }

        return _sanitize_data(understanding_report)
    except Exception as e:
        return {"error": f"Error executing tool 'get_understanding_report': {str(e)}"}


def get_assessment_report(tool_context: ToolContext, key: str = "raw_data") -> str:
    """
    Get an assessment report for the data state.

    Args:
        tool_context (ToolContext): The tool context.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: The assessment report.
    """
    try:
        print(f"Tool 'get_assessment_report' called with parameters: key={key}")
        df = _get_dataframe(tool_context, key)

        column_profile_report = profile_columns(df)
        data_quality_score = compute_data_quality_score(df)

        assessment_report = {
            "column_profile_report": column_profile_report,
            "data_quality_score": data_quality_score,
        }

        return _sanitize_data(assessment_report)
    except Exception as e:
        return {"error": f"Error executing tool 'get_assessment_report': {str(e)}"}


def get_data_tool(
    tool_context: ToolContext,
    key: str = "raw_data",
    mode: str = "sample",
    sample_size: int = 3,
) -> dict:
    """
    Get the data.

    Args:
        tool_context (ToolContext): The tool context.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.
        mode (str, optional): The mode to use for accessing the data state. Defaults to 'sample'.
        sample_size (int, optional): The sample size to use for accessing the data state. Defaults to 3.

    Returns:
        dict: The data.
    """
    try:
        sample_size = int(sample_size)
        print(
            f"Tool 'get_data_tool' called with parameters: key={key}, mode={mode}, sample_size={sample_size}"
        )
        df = _get_dataframe(tool_context, key)

        if mode == "sample":
            result = get_sample_data(df, sample_size).T.to_dict()
        elif mode == "head":
            result = get_head_data(df, sample_size).T.to_dict()
        elif mode == "tail":
            result = get_tail_data(df, sample_size).T.to_dict()
        else:
            limit = 10
            if len(df) > limit:
                result = df.head(limit).T.to_dict()
                print(
                    f"Warning: Data truncated to {limit} rows in get_data_tool to prevent overflow."
                )
            else:
                result = df.T.to_dict()

        result_str = str(result)
        if len(result_str) > 10000:
            result = df.head(1).T.to_dict()
            result_str = str(result)
            if len(result_str) > 10000:
                return {
                    "error": "Data is too large to display even for 1 row. Please select specific columns."
                }
            print("Warning: Data further truncated to 1 row due to character limit.")

        sanitized_result = _sanitize_data(result)
        return {str(k): v for k, v in sanitized_result.items()}
    except Exception as e:
        return {"error": f"Error executing tool 'get_data_tool': {str(e)}"}


def get_data_correlation_tool(
    tool_context: ToolContext, key: str = "raw_data", columns: list[str] | None = None
) -> dict:
    """
    Get the correlation of the data.

    Args:
        tool_context (ToolContext): The tool context.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.
        columns (list[str] | None, optional): The columns to get the correlation from. Defaults to None.

    Returns:
        dict: The correlation of the data.
    """
    try:
        print(
            f"Tool 'get_data_correlation_tool' called with parameters: key={key}, columns={columns}"
        )
        df = _get_dataframe(tool_context, key)

        correlation = get_data_correlation(df, columns)

        return _sanitize_data(correlation.to_dict())
    except Exception as e:
        return {"error": f"Error executing tool 'get_data_correlation_tool': {str(e)}"}


def get_unique_values_tool(
    tool_context: ToolContext,
    column: str,
    key: str = "raw_data",
    max_unique_values: int = 10,
) -> list:
    try:
        print(
            f"Tool 'get_unique_values_tool' called with parameters: column={column}, key={key}, max_unique_values={max_unique_values}"
        )
        df = _get_dataframe(tool_context, key, columns=[column])
        unique_values = get_unique_values(df, column, max_unique_values)

        return [
            {"key": str(v), "description": f"Unique value in column '{column}'"}
            for v in unique_values.tolist()
        ]
    except Exception as e:
        return [{"error": f"Error executing tool 'get_unique_values_tool': {str(e)}"}]


def get_unique_values_count_tool(
    tool_context: ToolContext,
    column: str,
    key: str = "raw_data",
    limit: int = 50,
) -> str:
    """
    Get the unique values count in a column.

    Args:
        tool_context (ToolContext): The tool context.
        column (str): The column to get the unique values count from.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.
        limit (int, optional): The maximum number of unique values to return. Defaults to 50.

    Returns:
        str: A summary string containing the total count of unique values and a preview of the most frequent values.
    """
    try:
        print(
            f"Tool 'get_unique_values_count_tool' called with parameters: column={column}, key={key}, limit={limit}"
        )
        df = _get_dataframe(tool_context, key, columns=[column])
        unique_values_count = get_unique_values_count(df, column)

        total_unique = len(unique_values_count)
        top_items = list(unique_values_count.items())[:limit]

        preview_list = [{"key": str(k), "count": int(v)} for k, v in top_items]

        return _truncate_output(
            f"Found {total_unique} unique values. Showing top {limit} most frequent:\n{preview_list}"
        )
    except Exception as e:
        return f"Error executing tool 'get_unique_values_count_tool': {str(e)}"


def get_rows_by_condition_tool(
    tool_context: ToolContext,
    column: str,
    value: any,
    key: str = "raw_data",
    method: str = "eq",
    limit: int = 10,
) -> str:
    """
    Get the rows by condition.

    Args:
        tool_context (ToolContext): The tool context.
        column (str): The column to get the rows by condition from.
        value (any): The value to get the rows by condition from. If method is 'between', value should be a tuple of two values.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.
        method (str): The method to use for the condition. Available methods are 'eq', 'ne', 'gt', 'lt', 'ge', 'le', 'between', 'in', 'not_in', 'contains', 'not_contains', 'startswith', 'endswith', 'regex', 'not_regex'.
        limit (int, optional): The maximum number of rows to return in the preview. Defaults to 10.

    Returns:
        str: A summary string containing the total count of matching rows and a preview of the data.
    """
    try:
        print(
            f"Tool 'get_rows_by_condition_tool' called with parameters: column={column}, value={value}, key={key}, method={method}, limit={limit}"
        )
        df = _get_dataframe(tool_context, key)
        rows = get_rows_by_condition(df, column, value, method)

        count = len(rows)
        preview_rows = rows.head(limit).to_dict(orient="records")

        return _truncate_output(
            f"Found {count} rows matching condition. Showing first {limit}:\n{preview_rows}"
        )
    except Exception as e:
        return f"Error executing tool 'get_rows_by_condition_tool': {str(e)}"


def get_null_values_rows_tool(
    tool_context: ToolContext,
    column: str,
    key: str = "raw_data",
    limit: int = 5,
) -> list[dict]:
    """
    Get the null values rows in the data.

    Args:
        tool_context (ToolContext): The tool context.
        column (str): The column to get the null values rows from.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.
        limit (int, optional): The number of rows to return. Defaults to 5.

    Returns:
        list[dict]: The null values rows in the data.
    """
    try:
        print(
            f"Tool 'get_null_values_rows_tool' called with parameters: column={column}, key={key}, limit={limit}"
        )
        # We need all columns to show the row, but if the intention is just to find rows where a specific column is null, 
        # we might need the full row. 
        # Wait, get_null_values_rows returns rows, so it needs all columns or at least the ones helpful to identify the row.
        # The tool definition says "Get the null values rows in the data".
        # If I change it to load only `column`, I can't return the full row content.
        # Let's check `get_null_values_rows` implementation in `dataTools.py`.
        # It does `df[df[column].isnull()].head(limit)`.
        # So if I only load `column`, I can only return that column's null values... which is useless.
        # BUT, if the goal is to just IDENTIFY them, maybe index is enough?
        # The standard usage usually implies seeing the data context.
        # I'LL SKIP THIS ONE if it requires full row data. 
        # Re-reading: "return ... rows.to_dict(orient='records')". Yes, it returns full rows.
        # So I CANNOT optimize this one easily without changing the tool's contract or only returning the specific column.
        # Plan said: "Optimize get_null_values_rows_tool". I'll skip it effectively or just load the column to check nulls, obtain index, then load specific rows? 
        # Parquet doesn't support random row access efficiently.
        # I will LEAVE THIS ONE alone for now to avoid breaking behavior.
        df = _get_dataframe(tool_context, key)
        rows = get_null_values_rows(df, column, limit)

        return _sanitize_data(rows.to_dict(orient="records"))
    except Exception as e:
        return [
            {"error": f"Error executing tool 'get_null_values_rows_tool': {str(e)}"}
        ]


def merge_data_tool(
    tool_context: ToolContext,
    right_key: str,
    left_key: str = "raw_data",
    how: str = "inner",
    on: str = None,
    left_on: str = None,
    right_on: str = None,
    new_key: str = "merged_data",
) -> str:
    """
    Merge two dataframes.

    Args:
        tool_context (ToolContext): The tool context.
        right_key (str): The key for the right dataframe.
        left_key (str, optional): The key for the left dataframe. Defaults to 'raw_data'.
        how (str, optional): The type of merge to perform. Defaults to 'inner'.
        on (str, optional): The column to merge on. Defaults to None.
        left_on (str, optional): The column to merge on for the left dataframe. Defaults to None.
        right_on (str, optional): The column to merge on for the right dataframe. Defaults to None.
        new_key (str, optional): The key for the merged dataframe. Defaults to 'merged_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'merge_data_tool' called with parameters: right_key={right_key}, left_key={left_key}, how={how}, on={on}, left_on={left_on}, right_on={right_on}, new_key={new_key}"
        )
        left_df = _get_dataframe(tool_context, left_key)
        right_df = _get_dataframe(tool_context, right_key)
        merged_df = merge_data(left_df, right_df, how, on, left_on, right_on)

        _save_dataframe(
            tool_context,
            merged_df,
            new_key,
            f"Merged data from {left_key} and {right_key}",
        )
        return f"Data merged and saved to state key: {new_key}"
    except Exception as e:
        return f"Error executing tool 'merge_data_tool': {str(e)}"


def remove_null_values_tool(
    tool_context: ToolContext,
    key: str = "raw_data",
) -> str:
    """
    Remove the null values from the data.

    Args:
        tool_context (ToolContext): The tool context.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(f"Tool 'remove_null_values_tool' called with parameters: key={key}")
        df = _get_dataframe(tool_context, key)
        cleaned_df = remove_null_values(df)
        _save_dataframe(
            tool_context, cleaned_df, key, f"Data with null values removed: {key}"
        )
        return f"Null values removed from data state: {key}"
    except Exception as e:
        return f"Error executing tool 'remove_null_values_tool': {str(e)}"


def fill_null_values_tool(
    tool_context: ToolContext,
    key: str = "raw_data",
    value: any = None,
    method: str = "ffill",
) -> str:
    """
    Fill the null values in the data.

    Args:
        tool_context (ToolContext): The tool context.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.
        value (any, optional): The value to fill the null values with. Defaults to None.
        method (str, optional): The method to use for the null values fill. Defaults to 'ffill'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'fill_null_values_tool' called with parameters: key={key}, value={value}, method={method}"
        )
        df = _get_dataframe(tool_context, key)
        filled_df = fill_null_values(df, value, method)
        _save_dataframe(
            tool_context, filled_df, key, f"Data with null values filled: {key}"
        )
        return f"Null values filled in data state: {key}"
    except Exception as e:
        return f"Error executing tool 'fill_null_values_tool': {str(e)}"


def remove_duplicate_values_tool(
    tool_context: ToolContext,
    key: str = "raw_data",
) -> str:
    """
    Remove the duplicate values from the data.

    Args:
        tool_context (ToolContext): The tool context.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(f"Tool 'remove_duplicate_values_tool' called with parameters: key={key}")
        df = _get_dataframe(tool_context, key)
        cleaned_df = remove_duplicate_values(df)
        _save_dataframe(
            tool_context, cleaned_df, key, f"Data with duplicate values removed: {key}"
        )
        return f"Duplicate values removed from data state: {key}"
    except Exception as e:
        return f"Error executing tool 'remove_duplicate_values_tool': {str(e)}"


def replace_column_value_tool(
    tool_context: ToolContext,
    column: str,
    value: any,
    new_value: any,
    key: str = "raw_data",
) -> str:
    """
    Replace the value in the column.

    Args:
        tool_context (ToolContext): The tool context.
        column (str): The column to replace the value from.
        value (any): The value to replace.
        new_value (any): The new value.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'replace_column_value_tool' called with parameters: column={column}, value={value}, new_value={new_value}, key={key}"
        )
        df = _get_dataframe(tool_context, key)
        updated_df = replace_column_value(df, column, value, new_value)
        _save_dataframe(
            tool_context,
            updated_df,
            key,
            f"Data with replaced values in {column}: {key}",
        )
        return f"Value {value} replaced with {new_value} in column {column} for data state: {key}"
    except Exception as e:
        return f"Error executing tool 'replace_column_value_tool': {str(e)}"


def replace_column_value_regex_tool(
    tool_context: ToolContext,
    column: str,
    pattern: str,
    new_value: any,
    key: str = "raw_data",
) -> str:
    """
    Replace the value in the column using regex.

    Args:
        tool_context (ToolContext): The tool context.
        column (str): The column to replace the value from.
        pattern (str): The regex pattern to replace.
        new_value (any): The new value.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'replace_column_value_regex_tool' called with parameters: column={column}, pattern={pattern}, new_value={new_value}, key={key}"
        )
        df = _get_dataframe(tool_context, key)
        updated_df = replace_column_value_regex(df, column, pattern, new_value)
        _save_dataframe(
            tool_context,
            updated_df,
            key,
            f"Data with replaced regex values in {column}: {key}",
        )
        return f"Pattern {pattern} replaced with {new_value} in column {column} for data state: {key}"
    except Exception as e:
        return f"Error executing tool 'replace_column_value_regex_tool': {str(e)}"


def change_data_type_tool(
    tool_context: ToolContext,
    columns: list[str],
    data_type: str,
    key: str = "raw_data",
) -> str:
    """
    Change the data type of the column.

    Args:
        tool_context (ToolContext): The tool context.
        columns (list[str]): The columns to change the data type from.
        data_type (str): The new data type.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'change_data_type_tool' called with parameters: columns={columns}, data_type={data_type}, key={key}"
        )
        df = _get_dataframe(tool_context, key)
        updated_df = change_data_type(df, columns, data_type)
        _save_dataframe(
            tool_context,
            updated_df,
            key,
            f"Data with changed type for {columns}: {key}",
        )
        return f"Data type changed to {data_type} for columns {columns} in data state: {key}"
    except Exception as e:
        return f"Error executing tool 'change_data_type_tool': {str(e)}"


def create_column_from_expression_tool(
    tool_context: ToolContext,
    new_column: str,
    expression: str,
    key: str = "raw_data",
) -> str:
    """
    Create a new column using a pandas eval expression.

    Args:
        tool_context (ToolContext): The tool context.
        new_column (str): Name of the new column.
        expression (str): Expression using column names. e.g. 'column1 + column2'
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: Message indicating success.
    """
    print(
        f"Tool 'create_column_from_expression_tool' called with parameters: new_column={new_column}, expression={expression}, key={key}"
    )
    try:
        if (
            "data_state" not in tool_context.state
            or key not in tool_context.state["data_state"]
        ):
            return f"Error: Key '{key}' not found in data state."

        df = _get_dataframe(tool_context, key)
        updated_df = create_column_from_expression(df, new_column, expression)
        _save_dataframe(
            tool_context, updated_df, key, f"Data with new column {new_column}: {key}"
        )
        return f"New column {new_column} created from expression {expression} in data state: {key}"
    except Exception as e:
        return f"Error creating column '{new_column}' with expression '{expression}': {str(e)}. Hint: For conditional logic, use 'np.where(condition, val_if_true, val_if_false)' instead of Python if/else."


def drop_columns_tool(
    tool_context: ToolContext,
    columns: list[str],
    key: str = "raw_data",
) -> str:
    """
    Drop specified columns from the dataframe.

    Args:
        tool_context (ToolContext): The tool context.
        columns (list[str]): List of column names to drop.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'drop_columns_tool' called with parameters: columns={columns}, key={key}"
        )
        df = _get_dataframe(tool_context, key)
        updated_df = drop_columns(df, columns)
        _save_dataframe(
            tool_context, updated_df, key, f"Data with dropped columns {columns}: {key}"
        )
        return f"Columns {columns} dropped from data state: {key}"
    except Exception as e:
        return f"Error executing tool 'drop_columns_tool': {str(e)}"


def remove_outliers_tool(
    tool_context: ToolContext,
    columns: list[str] | None = None,
    contamination: float = 0.05,
    method: str = "isolation_forest",
    threshold: float = 1.5,
    key: str = "raw_data",
) -> str:
    """
    Remove outliers from the data using Isolation Forest or IQR.

    Args:
        tool_context (ToolContext): The tool context.
        columns (list[str] | None, optional): Numeric columns to use. If None, all numeric columns are used.
        contamination (float, optional): Proportion of expected outliers (for Isolation Forest). Defaults to 0.05.
        method (str, optional): Method to use ('isolation_forest' or 'iqr'). Defaults to 'isolation_forest'.
        threshold (float, optional): IQR multiplier (for IQR method). Defaults to 1.5.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'remove_outliers_tool' called with parameters: columns={columns}, contamination={contamination}, method={method}, threshold={threshold}, key={key}"
        )
        df = _get_dataframe(tool_context, key)
        cleaned_df = remove_outliers(df, columns, method, contamination, threshold)

        removed_count = len(df) - len(cleaned_df)

        _save_dataframe(
            tool_context,
            cleaned_df,
            key,
            f"Data with outliers removed ({method}): {key}",
        )
        return f"Outliers removed from data state: {key}. Removed {removed_count} rows using {method}."
    except Exception as e:
        return f"Error executing tool 'remove_outliers_tool': {str(e)}"


def remove_rows_by_condition_tool(
    tool_context: ToolContext,
    column: str,
    value: any,
    key: str = "raw_data",
    method: str = "eq",
) -> str:
    """
    Remove rows from the dataframe based on a condition.

    Args:
        tool_context (ToolContext): The tool context.
        column (str): The column to check.
        value (any): The value to check against.
        key (str, optional): The data state key. Defaults to 'raw_data'.
        method (str, optional): The condition method ('eq', 'gt', 'lt', 'contains', etc.). Defaults to 'eq'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'remove_rows_by_condition_tool' called with parameters: column={column}, value={value}, key={key}, method={method}"
        )
        df = _get_dataframe(tool_context, key)
        updated_df = remove_rows_by_condition(df, column, value, method)

        removed_count = len(df) - len(updated_df)

        _save_dataframe(
            tool_context,
            updated_df,
            key,
            f"Data with rows removed (condition: {column} {method} {value}): {key}",
        )
        return f"Removed {removed_count} rows from data state '{key}' where {column} {method} '{value}'."
    except Exception as e:
        return f"Error executing tool 'remove_rows_by_condition_tool': {str(e)}"


def filter_rows_by_condition_tool(
    tool_context: ToolContext,
    column: str,
    value: any,
    key: str = "raw_data",
    method: str = "eq",
) -> str:
    """
    Keep rows in the dataframe that match a condition.

    Args:
        tool_context (ToolContext): The tool context.
        column (str): The column to check.
        value (any): The value to check against.
        key (str, optional): The data state key. Defaults to 'raw_data'.
        method (str, optional): The condition method. Defaults to 'eq'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'filter_rows_by_condition_tool' called with parameters: column={column}, value={value}, key={key}, method={method}"
        )
        df = _get_dataframe(tool_context, key)
        updated_df = get_rows_by_condition(df, column, value, method)

        removed_count = len(df) - len(updated_df)

        _save_dataframe(
            tool_context,
            updated_df,
            key,
            f"Filtered data (kept matching {column} {method} {value}): {key}",
        )
        return f"Filtered data in '{key}'. Kept {len(updated_df)} rows. (Removed {removed_count} rows)."
    except Exception as e:
        return f"Error executing tool 'filter_rows_by_condition_tool': {str(e)}"


def clip_values_tool(
    tool_context: ToolContext,
    columns: list[str],
    lower_percentile: float = 0.01,
    upper_percentile: float = 0.99,
    key: str = "raw_data",
) -> str:
    """
    Clip values in specified columns to the given percentiles.

    Args:
        tool_context (ToolContext): The tool context.
        columns (list[str]): List of columns to clip.
        lower_percentile (float, optional): Lower percentile (0-1). Defaults to 0.01.
        upper_percentile (float, optional): Upper percentile (0-1). Defaults to 0.99.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'clip_values_tool' called with parameters: columns={columns}, lower_percentile={lower_percentile}, upper_percentile={upper_percentile}, key={key}"
        )
        df = _get_dataframe(tool_context, key)
        cleaned_df = clip_values(df, columns, lower_percentile, upper_percentile)
        _save_dataframe(
            tool_context,
            cleaned_df,
            key,
            f"Data with clipped values in {columns}: {key}",
        )
        return f"Values clipped in columns {columns} for data state: {key}"
    except Exception as e:
        return f"Error executing tool 'clip_values_tool': {str(e)}"


def rename_columns_tool(
    tool_context: ToolContext,
    mapping: dict[str, str],
    key: str = "raw_data",
) -> str:
    """
    Rename columns in the dataframe.

    Args:
        tool_context (ToolContext): The tool context.
        mapping (dict[str, str]): Dictionary mapping old names to new names.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'rename_columns_tool' called with parameters: mapping={mapping}, key={key}"
        )
        df = _get_dataframe(tool_context, key)
        updated_df = rename_columns(df, mapping)
        _save_dataframe(
            tool_context, updated_df, key, f"Data with renamed columns: {key}"
        )
        return f"Columns renamed with mapping {mapping} in data state: {key}"
    except Exception as e:
        return f"Error executing tool 'rename_columns_tool': {str(e)}"


def clean_text_column_tool(
    tool_context: ToolContext,
    column: str,
    operations: list[str] = ["strip"],
    key: str = "raw_data",
) -> str:
    """
    Clean a text column with specified operations.

    Args:
        tool_context (ToolContext): The tool context.
        column (str): The column to clean.
        operations (list[str], optional): List of operations: 'strip', 'lower', 'upper', 'title'. Defaults to ['strip'].
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'clean_text_column_tool' called with parameters: column={column}, operations={operations}, key={key}"
        )
        df = _get_dataframe(tool_context, key)
        Updated_df = clean_text_column(df, column, operations)
        _save_dataframe(
            tool_context,
            Updated_df,
            key,
            f"Data with cleaned text column {column}: {key}",
        )
        return (
            f"Column {column} cleaned with operations {operations} in data state: {key}"
        )
    except Exception as e:
        return f"Error executing tool 'clean_text_column_tool': {str(e)}"


def convert_to_datetime_tool(
    tool_context: ToolContext,
    columns: list[str],
    format: str = None,
    key: str = "raw_data",
) -> str:
    """
    Convert columns to datetime objects.

    Args:
        tool_context (ToolContext): The tool context.
        columns (list[str]): List of columns to convert.
        format (str, optional): Optional datetime format string. Defaults to None.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'convert_to_datetime_tool' called with parameters: columns={columns}, format={format}, key={key}"
        )
        df = _get_dataframe(tool_context, key)
        updated_df = convert_to_datetime(df, columns, format)
        _save_dataframe(
            tool_context,
            updated_df,
            key,
            f"Data with datetime conversion for {columns}: {key}",
        )
        return f"Columns {columns} converted to datetime in data state: {key}"
    except Exception as e:
        return f"Error executing tool 'convert_to_datetime_tool': {str(e)}"


def impute_missing_values_tool(
    tool_context: ToolContext,
    columns: list[str],
    strategy: str = "mean",
    fill_value: any = None,
    key: str = "raw_data",
) -> str:
    """
    Impute missing values in specified columns.

    Args:
        tool_context (ToolContext): The tool context.
        columns (list[str]): List of columns to impute.
        strategy (str, optional): Imputation strategy: 'mean', 'median', 'mode', 'constant'. Defaults to 'mean'.
        fill_value (any, optional): Value to use when strategy is 'constant'. Defaults to None.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'impute_missing_values_tool' called with parameters: columns={columns}, strategy={strategy}, fill_value={fill_value}, key={key}"
        )
        df = _get_dataframe(tool_context, key)
        updated_df = impute_missing_values(df, columns, strategy, fill_value)
        _save_dataframe(
            tool_context,
            updated_df,
            key,
            f"Data with imputed missing values in {columns}: {key}",
        )
        return f"Missing values imputed in columns {columns} using strategy {strategy} in data state: {key}"
    except Exception as e:
        return f"Error executing tool 'impute_missing_values_tool': {str(e)}"


def save_data_state_tool(tool_context: ToolContext, key: str = "raw_data") -> str:
    """
    Save the data state to a CSV file.

    Args:
        tool_context (ToolContext): The tool context.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(f"Tool 'save_data_state_tool' called with parameters: key={key}")
        df = _get_dataframe(tool_context, key)

        filename = f"data_state_{key}.csv"
        if "output_dir" in tool_context.state:
            output_dir = tool_context.state["output_dir"]
            filename = os.path.join(output_dir, filename)
            os.makedirs(output_dir, exist_ok=True)

        path = save_to_csv(df, filename)
        return f"Data state saved to {path}"
    except Exception as e:
        return f"Error executing tool 'save_data_state_tool': {str(e)}"


def group_and_aggregate_tool(
    tool_context: ToolContext,
    group_by_columns: list[str],
    agg_columns: dict[str, str] | list[str],
    agg_func: str = "mean",
    key: str = "raw_data",
    new_key: str = "aggregated_data",
) -> str:
    """
    Group by columns and aggregate.

    Args:
        tool_context (ToolContext): The tool context.
        group_by_columns (list[str]): Columns to group by.
        agg_columns (dict[str, str] | list[str]): Columns to aggregate.
        agg_func (str, optional): Default aggregation function. Defaults to 'mean'.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.
        new_key (str, optional): The key to use for the new data state. Defaults to 'aggregated_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'group_and_aggregate_tool' called with parameters: group_by_columns={group_by_columns}, agg_columns={agg_columns}, agg_func={agg_func}, key={key}, new_key={new_key}"
        )

        agg_columns = _parse_argument(agg_columns)
        group_by_columns = _parse_argument(group_by_columns)

        df = _get_dataframe(tool_context, key)
        agg_df = group_and_aggregate(df, group_by_columns, agg_columns, agg_func)
        _save_dataframe(
            tool_context,
            agg_df,
            new_key,
            f"Aggregated data from {key}",
        )
        return f"Data aggregated and saved to state key: {new_key}"
    except Exception as e:
        print(f"Error executing tool 'group_and_aggregate_tool': {str(e)}")
        return f"Error executing tool 'group_and_aggregate_tool': {str(e)}"


def create_pivot_table_tool(
    tool_context: ToolContext,
    index: str | list[str],
    columns: str | list[str],
    values: str | list[str],
    aggfunc: str = "mean",
    key: str = "raw_data",
    new_key: str = "pivot_data",
) -> str:
    """
    Create a pivot table.

    Args:
        tool_context (ToolContext): The tool context.
        index (str | list[str]): Column(s) to group by on the index.
        columns (str | list[str]): Column(s) to group by on the columns.
        values (str | list[str]): Column(s) to aggregate.
        aggfunc (str, optional): Aggregation function. Defaults to 'mean'.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.
        new_key (str, optional): The key to use for the new data state. Defaults to 'pivot_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'create_pivot_table_tool' called with parameters: index={index}, columns={columns}, values={values}, aggfunc={aggfunc}, key={key}, new_key={new_key}"
        )

        index = _parse_argument(index)
        columns = _parse_argument(columns)
        values = _parse_argument(values)

        df = _get_dataframe(tool_context, key)
        pivot_df = create_pivot_table(df, index, columns, values, aggfunc)
        _save_dataframe(
            tool_context,
            pivot_df,
            new_key,
            f"Pivot table from {key}",
        )
        return f"Pivot table created and saved to state key: {new_key}"
    except Exception as e:
        print(f"Error executing tool 'create_pivot_table_tool': {str(e)}")
        return f"Error executing tool 'create_pivot_table_tool': {str(e)}"


def plot_bar_tool(
    tool_context: ToolContext,
    x: str,
    y: str,
    hue: str = None,
    title: str = None,
    xlabel: str = None,
    ylabel: str = None,
    color: str = None,
    palette: str = None,
    sort_by: str = None,
    ascending: bool = False,
    key: str = "raw_data",
    save_path: str = "plot_bar.png",
) -> str:
    """
    Create a bar plot.

    Args:
        tool_context (ToolContext): The tool context.
        x (str): Column for x-axis.
        y (str): Column for y-axis.
        hue (str, optional): Column for color encoding. Defaults to None.
        title (str, optional): Plot title. Defaults to None.
        xlabel (str, optional): X-axis label. Defaults to None.
        ylabel (str, optional): Y-axis label. Defaults to None.
        color (str, optional): Color for the plot. Defaults to None.
        palette (str, optional): Palette for the plot (name or JSON dict). Defaults to None.
        sort_by (str, optional): Column to sort by ('x' or 'y'). Defaults to None.
        ascending (bool, optional): Sort ascending? Defaults to False.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.
        save_path (str, optional): Path to save the plot. Defaults to 'plot_bar.png'.

    Returns:
        str: Message indicating success and the saved filename.
    """
    try:
        print(
            f"Tool 'plot_bar_tool' called with parameters: x={x}, y={y}, key={key}, save_path={save_path}, sort_by={sort_by}, ascending={ascending}"
        )
        palette = _parse_argument(palette)
        df = _get_dataframe(tool_context, key)

        if "output_dir" in tool_context.state:
            output_dir = tool_context.state["output_dir"]
            print(f"DEBUG: output_dir found in state: {output_dir}")
            save_path = os.path.join(output_dir, save_path)
            os.makedirs(output_dir, exist_ok=True)
        else:
            print("DEBUG: output_dir NOT found in state. Using CWD.")

        abs_path = os.path.abspath(save_path)
        print(f"DEBUG: Saving plot to absolute path: {abs_path}")

        warning = plot_bar(
            df,
            x,
            y,
            hue,
            title,
            xlabel,
            ylabel,
            color,
            palette,
            sort_by,
            ascending,
            save_path=save_path,
        )

        msg = f"Bar plot created and saved to {save_path}"
        if warning:
            msg += f"\nWARNING: {warning}"
        return msg
    except Exception as e:
        return f"Error executing tool 'plot_bar_tool': {str(e)}"


def plot_line_tool(
    tool_context: ToolContext,
    x: str,
    y: str,
    hue: str = None,
    title: str = None,
    xlabel: str = None,
    ylabel: str = None,
    color: str = None,
    palette: str = None,
    key: str = "raw_data",
    save_path: str = "plot_line.png",
) -> str:
    """
    Create a line plot.

    Args:
        tool_context (ToolContext): The tool context.
        x (str): Column for x-axis.
        y (str): Column for y-axis.
        hue (str, optional): Column for color encoding. Defaults to None.
        title (str, optional): Plot title. Defaults to None.
        xlabel (str, optional): X-axis label. Defaults to None.
        ylabel (str, optional): Y-axis label. Defaults to None.
        color (str, optional): Color for the plot. Defaults to None.
        palette (str, optional): Palette for the plot (name or JSON dict). Defaults to None.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.
        save_path (str, optional): Path to save the plot. Defaults to 'plot_line.png'.

    Returns:
        str: Message indicating success and the saved filename.
    """
    try:
        print(
            f"Tool 'plot_line_tool' called with parameters: x={x}, y={y}, key={key}, save_path={save_path}"
        )
        palette = _parse_argument(palette)
        df = _get_dataframe(tool_context, key)

        if "output_dir" in tool_context.state:
            output_dir = tool_context.state["output_dir"]
            save_path = os.path.join(output_dir, save_path)
            os.makedirs(output_dir, exist_ok=True)

        warning = plot_line(
            df, x, y, hue, title, xlabel, ylabel, color, palette, save_path=save_path
        )

        msg = f"Line plot created and saved to {save_path}"
        if warning:
            msg += f"\nWARNING: {warning}"
        return msg
    except Exception as e:
        return f"Error executing tool 'plot_line_tool': {str(e)}"


def plot_scatter_tool(
    tool_context: ToolContext,
    x: str,
    y: str,
    hue: str = None,
    title: str = None,
    xlabel: str = None,
    ylabel: str = None,
    color: str = None,
    palette: str = None,
    key: str = "raw_data",
    save_path: str = "plot_scatter.png",
) -> str:
    """
    Create a scatter plot.

    Args:
        tool_context (ToolContext): The tool context.
        x (str): Column for x-axis.
        y (str): Column for y-axis.
        hue (str, optional): Column for color encoding. Defaults to None.
        title (str, optional): Plot title. Defaults to None.
        xlabel (str, optional): X-axis label. Defaults to None.
        ylabel (str, optional): Y-axis label. Defaults to None.
        color (str, optional): Color for the plot. Defaults to None.
        palette (str, optional): Palette for the plot (name or JSON dict). Defaults to None.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.
        save_path (str, optional): Path to save the plot. Defaults to 'plot_scatter.png'.

    Returns:
        str: Message indicating success and the saved filename.
    """
    try:
        print(
            f"Tool 'plot_scatter_tool' called with parameters: x={x}, y={y}, key={key}, save_path={save_path}"
        )
        palette = _parse_argument(palette)
        df = _get_dataframe(tool_context, key)

        if "output_dir" in tool_context.state:
            output_dir = tool_context.state["output_dir"]
            save_path = os.path.join(output_dir, save_path)
            os.makedirs(output_dir, exist_ok=True)

        warning = plot_scatter(
            df, x, y, hue, title, xlabel, ylabel, color, palette, save_path=save_path
        )

        msg = f"Scatter plot created and saved to {save_path}"
        if warning:
            msg += f"\nWARNING: {warning}"
        return msg
    except Exception as e:
        return f"Error executing tool 'plot_scatter_tool': {str(e)}"


def plot_histogram_tool(
    tool_context: ToolContext,
    x: str,
    hue: str = None,
    kde: bool = True,
    title: str = None,
    xlabel: str = None,
    bins: int | str = "auto",
    color: str = None,
    palette: str = None,
    key: str = "raw_data",
    save_path: str = "plot_histogram.png",
) -> str:
    """
    Create a histogram.

    Args:
        tool_context (ToolContext): The tool context.
        x (str): Column for x-axis.
        hue (str, optional): Column for color encoding. Defaults to None.
        kde (bool, optional): Whether to plot a gaussian kernel density estimate. Defaults to True.
        title (str, optional): Plot title. Defaults to None.
        xlabel (str, optional): X-axis label. Defaults to None.
        bins (int | str, optional): Specification of hist bins. Defaults to 'auto'.
        color (str, optional): Color for the plot. Defaults to None.
        palette (str, optional): Palette for the plot (name or JSON dict). Defaults to None.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.
        save_path (str, optional): Path to save the plot. Defaults to 'plot_histogram.png'.

    Returns:
        str: Message indicating success and the saved filename.
    """
    try:
        print(
            f"Tool 'plot_histogram_tool' called with parameters: x={x}, key={key}, save_path={save_path}"
        )
        palette = _parse_argument(palette)
        df = _get_dataframe(tool_context, key)

        if "output_dir" in tool_context.state:
            output_dir = tool_context.state["output_dir"]
            save_path = os.path.join(output_dir, save_path)
            os.makedirs(output_dir, exist_ok=True)

        warning = plot_histogram(
            df, x, hue, kde, title, xlabel, bins, color, palette, save_path=save_path
        )

        msg = f"Histogram created and saved to {save_path}"
        if warning:
            msg += f"\nWARNING: {warning}"
        return msg
    except Exception as e:
        return f"Error executing tool 'plot_histogram_tool': {str(e)}"


def plot_box_tool(
    tool_context: ToolContext,
    x: str,
    y: str,
    hue: str = None,
    title: str = None,
    xlabel: str = None,
    ylabel: str = None,
    color: str = None,
    palette: str = None,
    key: str = "raw_data",
    save_path: str = "plot_box.png",
) -> str:
    """
    Create a box plot.

    Args:
        tool_context (ToolContext): The tool context.
        x (str): Column for x-axis.
        y (str): Column for y-axis.
        hue (str, optional): Column for color encoding. Defaults to None.
        title (str, optional): Plot title. Defaults to None.
        xlabel (str, optional): X-axis label. Defaults to None.
        ylabel (str, optional): Y-axis label. Defaults to None.
        color (str, optional): Color for the plot. Defaults to None.
        palette (str, optional): Palette for the plot (name or JSON dict). Defaults to None.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.
        save_path (str, optional): Path to save the plot. Defaults to 'plot_box.png'.

    Returns:
        str: Message indicating success and the saved filename.
    """
    try:
        print(
            f"Tool 'plot_box_tool' called with parameters: x={x}, y={y}, key={key}, save_path={save_path}"
        )
        palette = _parse_argument(palette)
        df = _get_dataframe(tool_context, key)

        if "output_dir" in tool_context.state:
            output_dir = tool_context.state["output_dir"]
            save_path = os.path.join(output_dir, save_path)
            os.makedirs(output_dir, exist_ok=True)

        warning = plot_box(
            df, x, y, hue, title, xlabel, ylabel, color, palette, save_path=save_path
        )

        msg = f"Box plot created and saved to {save_path}"
        if warning:
            msg += f"\nWARNING: {warning}"
        return msg
    except Exception as e:
        return f"Error executing tool 'plot_box_tool': {str(e)}"


def plot_heatmap_tool(
    tool_context: ToolContext,
    index: str = None,
    columns: str = None,
    values: str = None,
    aggfunc: str = "mean",
    title: str = None,
    annot: bool = True,
    cmap: str = "coolwarm",
    key: str = "raw_data",
    save_path: str = "plot_heatmap.png",
) -> str:
    """
    Create a heatmap. Can pivot data if index/columns/values provided, otherwise expects a matrix in 'key'.

    Args:
        tool_context (ToolContext): The tool context.
        index (str, optional): Column to group by on index.
        columns (str, optional): Column to group by on columns.
        values (str, optional): Column to aggregate.
        aggfunc (str, optional): Aggregation function. Defaults to 'mean'.
        title (str, optional): Plot title. Defaults to None.
        annot (bool, optional): Whether to annotate the cells with values. Defaults to True.
        cmap (str, optional): Colormap. Defaults to 'coolwarm'.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.
        save_path (str, optional): Path to save the plot. Defaults to 'plot_heatmap.png'.

    Returns:
        str: Message indicating success and the saved filename.
    """
    try:
        print(
            f"Tool 'plot_heatmap_tool' called with parameters: index={index}, columns={columns}, values={values}, key={key}, save_path={save_path}"
        )
        df = _get_dataframe(tool_context, key)

        if "output_dir" in tool_context.state:
            output_dir = tool_context.state["output_dir"]
            save_path = os.path.join(output_dir, save_path)
            os.makedirs(output_dir, exist_ok=True)

        plot_heatmap(
            df, index, columns, values, aggfunc, title, annot, cmap, save_path=save_path
        )

        return f"Heatmap created and saved to {save_path}"
    except Exception as e:
        return f"Error executing tool 'plot_heatmap_tool': {str(e)}"


def plot_count_tool(
    tool_context: ToolContext,
    x: str,
    hue: str = None,
    title: str = None,
    xlabel: str = None,
    ylabel: str = None,
    color: str = None,
    palette: str = None,
    key: str = "raw_data",
    save_path: str = "plot_count.png",
) -> str:
    """
    Create a count plot.

    Args:
        tool_context (ToolContext): The tool context.
        x (str): Column for x-axis (categorical).
        hue (str, optional): Column for color encoding. Defaults to None.
        title (str, optional): Plot title. Defaults to None.
        xlabel (str, optional): X-axis label. Defaults to None.
        ylabel (str, optional): Y-axis label. Defaults to None.
        color (str, optional): Color for the plot. Defaults to None.
        palette (str, optional): Palette for the plot (name or JSON dict). Defaults to None.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.
        save_path (str, optional): Path to save the plot. Defaults to 'plot_count.png'.

    Returns:
        str: Message indicating success and the saved filename.
    """
    try:
        print(
            f"Tool 'plot_count_tool' called with parameters: x={x}, key={key}, save_path={save_path}"
        )
        palette = _parse_argument(palette)
        df = _get_dataframe(tool_context, key)

        if "output_dir" in tool_context.state:
            output_dir = tool_context.state["output_dir"]
            save_path = os.path.join(output_dir, save_path)
            os.makedirs(output_dir, exist_ok=True)

        warning = plot_count(
            df, x, hue, title, xlabel, ylabel, color, palette, save_path=save_path
        )

        msg = f"Count plot created and saved to {save_path}"
        if warning:
            msg += f"\nWARNING: {warning}"
        return msg
    except Exception as e:
        return f"Error executing tool 'plot_count_tool': {str(e)}"


def plot_pie_tool(
    tool_context: ToolContext,
    labels: str,
    values: str = None,
    title: str = None,
    palette: str = None,
    key: str = "raw_data",
    save_path: str = "plot_pie.png",
) -> str:
    """
    Create a pie chart.

    Args:
        tool_context (ToolContext): The tool context.
        labels (str): Column for slice labels.
        values (str, optional): Column for slice sizes. If None, counts occurrences of 'labels'. Defaults to None.
        title (str, optional): Plot title. Defaults to None.
        palette (str, optional): Palette for the plot (name or JSON dict). Defaults to None.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.
        save_path (str, optional): Path to save the plot. Defaults to 'plot_pie.png'.

    Returns:
        str: Message indicating success and the saved filename.
    """
    try:
        print(
            f"Tool 'plot_pie_tool' called with parameters: labels={labels}, values={values}, key={key}, save_path={save_path}"
        )
        palette = _parse_argument(palette)
        df = _get_dataframe(tool_context, key)

        if "output_dir" in tool_context.state:
            output_dir = tool_context.state["output_dir"]
            save_path = os.path.join(output_dir, save_path)
            os.makedirs(output_dir, exist_ok=True)

        warning = plot_pie(df, labels, values, title, palette, save_path=save_path)

        msg = f"Pie chart created and saved to {save_path}"
        if warning:
            msg += f"\nWARNING: {warning}"
        return msg
    except Exception as e:
        return f"Error executing tool 'plot_pie_tool': {str(e)}"


def save_report_tool(
    tool_context: ToolContext,
    content: str,
    filename: str,
) -> str:
    """
    Save the analysis report to a markdown file.

    Args:
        tool_context (ToolContext): The tool context.
        content (str): The text content of the report.
        filename (str): The path to save the report to.

    Returns:
        str: Message indicating success.
    """
    try:
        print(f"Tool 'save_report_tool' called with parameters: filename={filename}")

        if "output_dir" in tool_context.state:
            output_dir = tool_context.state["output_dir"]
            filename = os.path.join(output_dir, filename)
            os.makedirs(output_dir, exist_ok=True)

        save_text_to_file(content, filename)
        return f"Report saved to {filename}"
    except Exception as e:
        return f"Error executing tool 'save_report_tool': {str(e)}"


def get_top_n_rows_tool(
    tool_context: ToolContext,
    column: str,
    n: int = 5,
    ascending: bool = False,
    key: str = "raw_data",
    new_key: str = None,
    visualize: bool = False,
    plot_type: str = "bar",
    x_column: str = None,
    save_path: str = None,
) -> str:
    """
    Get text summary of the top/bottom N rows sorted by a column.

    Args:
        tool_context (ToolContext): The tool context.
        column (str): The column to sort by.
        n (int, optional): The number of rows to return. Defaults to 5.
        ascending (bool, optional): Sort ascending? Defaults to False (descending/top).
        key (str, optional): The data key. Defaults to 'raw_data'.
        new_key (str, optional): If provided, save the filtered top-N result to this data state key for downstream use (e.g. plotting). Defaults to None.
        visualize (bool, optional): Whether to plot the data. Defaults to False.
        plot_type (str, optional): The type of plot. Defaults to 'bar'.
        x_column (str, optional): The column to use for x-axis labels. Required for visualization.
        save_path (str, optional): Path to save the plot.

    Returns:
        str: Summary of the rows.
    """
    try:
        if n > 50:
            n = 50

        print(
            f"Tool 'get_top_n_rows_tool' called with parameters: column={column}, n={n}, key={key}, visualize={visualize}"
        )
        df = _get_dataframe(tool_context, key)
        result_df = get_top_n_rows(df, column, n, ascending)

        # Save filtered result to data state if new_key is provided
        if new_key:
            _save_dataframe(
                tool_context,
                result_df,
                new_key,
                f"Top {n} rows from {key} sorted by {column}",
            )

        output = _truncate_output(
            f"Top {n} rows sorted by {column} ({'ascending' if ascending else 'descending'}):\n{result_df.to_string(index=False)}",
            max_chars=2000,
        )

        if new_key:
            output += f"\nFiltered data saved to state key: {new_key}"

        if visualize and x_column:
            if not save_path:
                safe_col = (
                    "".join(c for c in column if c.isalnum() or c in (" ", "_", "-"))
                    .strip()
                    .replace(" ", "_")
                )
                safe_x = (
                    "".join(c for c in x_column if c.isalnum() or c in (" ", "_", "-"))
                    .strip()
                    .replace(" ", "_")
                )
                save_path = f"top_{n}_{safe_col}_by_{safe_x}.png"

            # Ensure output directory exists if handled by system
            output_dir = tool_context.state.get("output_dir", "")
            if output_dir:
                import os

                save_path = os.path.join(output_dir, os.path.basename(save_path))

            warning = None
            if plot_type == "bar":
                warning = plot_bar(result_df, x=x_column, y=column, save_path=save_path)
            # Extend for other types if needed, but bar is primary for Top N

            output += (
                f"\n\n[PLOT GENERATED] Plot saved to: {os.path.basename(save_path)}"
            )
            if warning:
                output += f" (Warning: {warning})"

        return output

    except Exception as e:
        return f"Error executing tool 'get_top_n_rows_tool': {str(e)}"


def get_group_stats_tool(
    tool_context: ToolContext,
    group_by: str,
    target_col: str,
    agg: str = "mean",
    limit: int = 50,
    key: str = "raw_data",
    visualize: bool = True,
    plot_type: str = "bar",
    save_path: str = None,
) -> str:
    """
    Get aggregated statistics for a target column grouped by another column.

    Args:
        tool_context (ToolContext): The tool context.
        group_by (str): The column to group by.
        target_col (str): The column to aggregate.
        agg (str, optional): Aggregation function. Defaults to 'mean'.
        limit (int, optional): Max number of groups to return. Defaults to 50.
        key (str, optional): The data key. Defaults to 'raw_data'.
        visualize (bool, optional): Whether to generate a plot. Defaults to True.
        plot_type (str, optional): Type of plot ('bar', 'line', 'pie', 'scatter'). Defaults to 'bar'.
        save_path (str, optional): Path to save the plot. Defaults to None.

    Returns:
        str: Summary of the grouped stats.
    """
    try:
        print(
            f"Tool 'get_group_stats_tool' called with parameters: group_by={group_by}, target_col={target_col}, agg={agg}, limit={limit}, key={key}, visualize={visualize}, plot_type={plot_type}"
        )
        df = _get_dataframe(tool_context, key)
        stats = get_group_stats(df, group_by, target_col, agg)

        sorted_stats = dict(
            sorted(stats.items(), key=lambda item: item[1], reverse=True)
        )

        msg = ""

        # Visualization Logic
        if visualize:
            try:
                # Convert stats back to DataFrame for plotting
                plot_df = pd.DataFrame(
                    list(stats.items()), columns=[group_by, target_col]
                )

                if not save_path:
                    # Sanitize filename
                    safe_group = (
                        "".join(
                            c for c in group_by if c.isalnum() or c in (" ", "_", "-")
                        )
                        .strip()
                        .replace(" ", "_")
                    )
                    safe_target = (
                        "".join(
                            c for c in target_col if c.isalnum() or c in (" ", "_", "-")
                        )
                        .strip()
                        .replace(" ", "_")
                    )
                    save_path = f"dist_{safe_group}_{safe_target}_{plot_type}.png"

                if "output_dir" in tool_context.state:
                    output_dir = tool_context.state["output_dir"]
                    save_path = os.path.join(output_dir, save_path)
                    os.makedirs(output_dir, exist_ok=True)

                warning = None
                if plot_type == "bar":
                    warning = plot_bar(
                        plot_df,
                        x=group_by,
                        y=target_col,
                        title=f"{agg.title()} of {target_col} by {group_by}",
                        save_path=save_path,
                        sort_by="y",
                        ascending=False,
                    )
                elif plot_type == "line":
                    warning = plot_line(
                        plot_df,
                        x=group_by,
                        y=target_col,
                        title=f"{agg.title()} of {target_col} by {group_by}",
                        save_path=save_path,
                    )
                elif plot_type == "pie":
                    warning = plot_pie(
                        plot_df,
                        labels=group_by,
                        values=target_col,
                        title=f"{agg.title()} of {target_col} by {group_by}",
                        save_path=save_path,
                    )
                elif plot_type == "scatter":
                    warning = plot_scatter(
                        plot_df,
                        x=group_by,
                        y=target_col,
                        title=f"{agg.title()} of {target_col} by {group_by}",
                        save_path=save_path,
                    )
                else:
                    warning = plot_bar(
                        plot_df,
                        x=group_by,
                        y=target_col,
                        title=f"{agg.title()} of {target_col} by {group_by}",
                        save_path=save_path,
                        sort_by="y",
                        ascending=False,
                    )

                msg += (
                    f"\n[PLOT GENERATED] Plot saved to: {os.path.basename(save_path)}"
                )
                if warning:
                    msg += f" (Warning: {warning})"

            except Exception as plot_err:
                msg += f"\n[PLOT ERROR] Failed to generate plot: {str(plot_err)}"

        if len(sorted_stats) > limit:
            truncated_stats = dict(list(sorted_stats.items())[:limit])
            msg = (
                f"Grouped stats for {target_col} by {group_by} ({agg}). Showing top {limit} of {len(stats)} groups:\n{truncated_stats}"
                + msg
            )
        else:
            msg = (
                f"Grouped stats for {target_col} by {group_by} ({agg}):\n{sorted_stats}"
            ) + msg

        return _truncate_output(msg)
    except Exception as e:
        return f"Error executing tool 'get_group_stats_tool': {str(e)}"


def get_column_stats_tool(
    tool_context: ToolContext,
    column: str,
    key: str = "raw_data",
    visualize: bool = True,
    plot_type: str = "histogram",
    save_path: str = None,
) -> str:
    """
    Get detailed statistics for a specific column.

    Args:
        tool_context (ToolContext): The tool context.
        column (str): The column to analyze.
        key (str, optional): The data key. Defaults to 'raw_data'.
        visualize (bool, optional): Whether to generate a plot. Defaults to True.
        plot_type (str, optional): Type of plot ('histogram', 'box', 'pie'). Defaults to 'histogram'.
        save_path (str, optional): Path to save the plot. Defaults to None.

    Returns:
        str: Summary of the column stats.
    """
    try:
        print(
            f"Tool 'get_column_stats_tool' called with parameters: column={column}, key={key}, visualize={visualize}, plot_type={plot_type}"
        )
        df = _get_dataframe(tool_context, key, columns=[column])
        stats = get_column_stats(df, column)

        msg = f"Statistics for column '{column}':\n{stats}"

        # Visualization Logic
        if visualize:
            try:
                if not save_path:
                    safe_col = (
                        "".join(
                            c for c in column if c.isalnum() or c in (" ", "_", "-")
                        )
                        .strip()
                        .replace(" ", "_")
                    )
                    save_path = f"dist_{safe_col}_{plot_type}.png"

                if "output_dir" in tool_context.state:
                    output_dir = tool_context.state["output_dir"]
                    save_path = os.path.join(output_dir, save_path)
                    os.makedirs(output_dir, exist_ok=True)

                warning = None

                if plot_type == "box":
                    warning = plot_box(
                        df,
                        x=None,
                        y=column,
                        title=f"Box Plot of {column}",
                        save_path=save_path,
                    )
                elif plot_type == "pie":
                    # For pie, we assume column is categorical or we want counts
                    warning = plot_pie(
                        df,
                        labels=column,
                        title=f"Distribution of {column}",
                        save_path=save_path,
                    )
                elif plot_type == "histogram" or (
                    pd.api.types.is_numeric_dtype(df[column]) and plot_type != "pie"
                ):
                    warning = plot_histogram(
                        df,
                        x=column,
                        title=f"Distribution of {column}",
                        save_path=save_path,
                    )
                else:
                    # Fallback for non-numeric if histogram requested or other type
                    if not pd.api.types.is_numeric_dtype(df[column]):
                        warning = plot_pie(
                            df,
                            labels=column,
                            title=f"Distribution of {column}",
                            save_path=save_path,
                        )
                    else:
                        warning = plot_histogram(
                            df,
                            x=column,
                            title=f"Distribution of {column}",
                            save_path=save_path,
                        )

                msg += (
                    f"\n[PLOT GENERATED] Plot saved to: {os.path.basename(save_path)}"
                )
                if warning:
                    msg += f" (Warning: {warning})"

            except Exception as plot_err:
                msg += f"\n[PLOT ERROR] Failed to generate plot: {str(plot_err)}"

        return msg
    except Exception as e:
        return f"Error executing tool 'get_column_stats_tool': {str(e)}"


def get_aggregation_scalar_tool(
    tool_context: ToolContext,
    column: str,
    agg: str = "mean",
    key: str = "raw_data",
) -> str:
    """
    Get a single aggregated value for a column.

    Args:
        tool_context (ToolContext): The tool context.
        column (str): The column to aggregate.
        agg (str, optional): Aggregation function. Defaults to 'mean'.
        key (str, optional): The data key. Defaults to 'raw_data'.

    Returns:
        str: The aggregated value.
    """
    try:
        print(
            f"Tool 'get_aggregation_scalar_tool' called with parameters: column={column}, agg={agg}, key={key}"
        )
        df = _get_dataframe(tool_context, key, columns=[column])
        result = get_aggregation_scalar(df, column, agg)
        return f"Aggregation ({agg}) for column '{column}': {result}"
    except Exception as e:
        return f"Error executing tool 'get_aggregation_scalar_tool': {str(e)}"


def split_column_tool(
    tool_context: ToolContext,
    column: str,
    delimiter: str,
    new_columns: list[str],
    key: str = "raw_data",
) -> str:
    """
    Split a column into multiple columns based on a delimiter.

    Args:
        tool_context (ToolContext): The tool context.
        column (str): The column to split.
        delimiter (str): The delimiter to split by.
        new_columns (list[str]): The names of the new columns.
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'split_column_tool' called with parameters: column={column}, delimiter={delimiter}, new_columns={new_columns}, key={key}"
        )
        if (
            "data_state" not in tool_context.state
            or key not in tool_context.state["data_state"]
        ):
            return f"Error: Key '{key}' not found in data state."

        df = _get_dataframe(tool_context, key)
        new_columns = _parse_argument(new_columns)

        updated_df = split_column(df, column, delimiter, new_columns)
        _save_dataframe(
            tool_context,
            updated_df,
            key,
            f"Data with column {column} split into {new_columns}: {key}",
        )
        return f"Column {column} split into {new_columns} in data state: {key}"
    except Exception as e:
        return f"Error executing tool 'split_column_tool': {str(e)}"


def convert_column_type_tool(
    tool_context: ToolContext,
    column: str,
    target_type: str,
    key: str = "raw_data",
) -> str:
    """
    Convert a column to a specified type.

    Args:
        tool_context (ToolContext): The tool context.
        column (str): The column to convert.
        target_type (str): The target type ('numeric', 'datetime', 'string', 'int', 'float').
        key (str, optional): The key to use for accessing the data state. Defaults to 'raw_data'.

    Returns:
        str: Message indicating success.
    """
    try:
        print(
            f"Tool 'convert_column_type_tool' called with parameters: column={column}, target_type={target_type}, key={key}"
        )
        if (
            "data_state" not in tool_context.state
            or key not in tool_context.state["data_state"]
        ):
            return f"Error: Key '{key}' not found in data state."

        df = _get_dataframe(tool_context, key)
        updated_df = convert_column_type(df, column, target_type)
        _save_dataframe(
            tool_context,
            updated_df,
            key,
            f"Data with column {column} converted to {target_type}: {key}",
        )
        return f"Column {column} converted to {target_type} in data state: {key}"
    except Exception as e:
        return f"Error executing tool 'convert_column_type_tool': {str(e)}"


def plot_chart_tool(
    tool_context: ToolContext,
    key: str,
    plot_type: str,
    x: str,
    y: str = None,
    hue: str = None,
    title: str = None,
    save_path: str = None,
) -> str:
    """
    Generate a plot from an existing dataframe.

    Args:
        tool_context (ToolContext): The tool context.
        key (str): The key of the dataframe in the data state.
        plot_type (str): The type of plot to generate ('bar', 'line', 'scatter', 'pie', 'histogram', 'box').
        x (str): The column to use for the x-axis (or labels for pie structure).
        y (str, optional): The column to use for the y-axis (or values for pie structure).
        hue (str, optional): The column to use for grouping colors.
        title (str, optional): The title of the plot.
        save_path (str, optional): The path to save the plot to.

    Returns:
        str: A message indicating the plot was generated.
    """
    try:
        print(
            f"Tool 'plot_chart_tool' called with parameters: key={key}, plot_type={plot_type}, x={x}, y={y}, hue={hue}, title={title}, save_path={save_path}"
        )

        if key not in tool_context.state["data_state"]:
            return f"Error: Key '{key}' not found in data state."

        df = _get_dataframe(tool_context, key)

        # Default save path
        if not save_path:
            # Sanitize filename
            safe_x = (
                "".join(c for c in x if c.isalnum() or c in (" ", "_", "-"))
                .strip()
                .replace(" ", "_")
            )
            safe_y = (
                "".join(c for c in y if c.isalnum() or c in (" ", "_", "-"))
                .strip()
                .replace(" ", "_")
                if y
                else ""
            )
            save_path = f"plot_{plot_type}_{key}_{safe_x}_{safe_y}.png"

        # Ensure output directory exists if handled by system
        output_dir = tool_context.state.get("output_dir", "")
        if output_dir:
            import os

            save_path = os.path.join(output_dir, os.path.basename(save_path))

        warning = None

        # Dispatch to dataTools plotting functions
        if plot_type == "bar":
            warning = plot_bar(
                df,
                x=x,
                y=y,
                hue=hue,
                title=title,
                save_path=save_path,
            )
        elif plot_type == "line":
            warning = plot_line(
                df,
                x=x,
                y=y,
                hue=hue,
                title=title,
                save_path=save_path,
            )
        elif plot_type == "scatter":
            warning = plot_scatter(
                df,
                x=x,
                y=y,
                hue=hue,
                title=title,
                save_path=save_path,
            )
        elif plot_type == "pie":
            warning = plot_pie(
                df,
                labels=x,
                values=y,
                title=title,
                save_path=save_path,
            )
        elif plot_type == "histogram":
            warning = plot_histogram(
                df,
                x=x,
                hue=hue,
                title=title,
                save_path=save_path,
            )
        elif plot_type == "box":
            warning = plot_box(
                df,
                x=x,
                y=y,
                hue=hue,
                title=title,
                save_path=save_path,
            )
        elif plot_type == "count":
            warning = plot_count(
                df,
                x=x,
                hue=hue,
                title=title,
                save_path=save_path,
            )
        else:
            return f"Error: Unsupported plot type '{plot_type}'"

        msg = f"[PLOT GENERATED] Plot saved to: {os.path.basename(save_path)}"
        if warning:
            msg += f" (Warning: {warning})"
        return msg

    except Exception as e:
        return f"Error executing tool 'plot_chart_tool': {str(e)}"


def list_output_files_tool(tool_context: ToolContext) -> list[str]:
    """
    List all files in the output directory.

    Args:
        tool_context (ToolContext): The tool context.

    Returns:
        list[str]: A list of filenames in the output directory.
    """
    try:
        print("Tool 'list_output_files_tool' called")
        output_dir = tool_context.state.get("output_dir", "")
        if not output_dir or not os.path.exists(output_dir):
            return []

        files = [
            f
            for f in os.listdir(output_dir)
            if os.path.isfile(os.path.join(output_dir, f))
        ]
        return files
    except Exception as e:
        return [f"Error executing tool 'list_output_files_tool': {str(e)}"]

'''
