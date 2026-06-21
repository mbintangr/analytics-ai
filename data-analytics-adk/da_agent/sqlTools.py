import os
import json
import gc
import numpy as np
import pandas as pd
from google.adk.tools.tool_context import ToolContext

from .dataTools import (
    plot_bar,
    plot_line,
    plot_scatter,
    plot_histogram,
    plot_box,
    plot_heatmap,
    plot_count,
    plot_pie,
)

def _truncate_output(data: str, max_chars: int = 5000) -> str:
    if len(data) <= max_chars:
        return data
    return data[:max_chars] + f"\n... [Output truncated to {max_chars} chars] ..."


def _get_engine(tool_context: ToolContext):
    engine = tool_context.state.get("duckdb_engine")
    if engine is None:
        raise ValueError("DuckDB engine not found in tool context state. Ensure it was initialized in tasks.py.")
    
    output_dir = tool_context.state.get("output_dir")
    if output_dir and os.path.exists(output_dir):
        import glob
        parquet_files = glob.glob(os.path.join(output_dir, "*.parquet"))
        data_state = tool_context.state.get("data_state", {})
        
        for p_file in parquet_files:
            table_name = os.path.splitext(os.path.basename(p_file))[0]
            p_file_safe = p_file.replace("\\", "/")
            
            if table_name not in engine._registered_tables:
                engine.register_parquet(table_name, p_file_safe)
            
            if table_name not in data_state:
                data_state[table_name] = {
                    "path": p_file_safe,
                    "description": f"Dataset: {table_name}",
                }
        
        tool_context.state["data_state"] = data_state

    return engine


def _format_query_result(result: dict) -> str:
    if not result.get("columns"):
        return result.get("message", "Query executed successfully (no result set).")

    columns = result["columns"]
    rows = result["rows"]

    if not rows:
        return f"Columns: {columns}\n(No rows returned)"

    col_widths = [len(str(c)) for c in columns]
    for row in rows[:50]:
        for i, val in enumerate(row):
            str_val = str(val if val is not None else "NULL").replace("|", "\\|").replace("\n", " ")[:40]
            col_widths[i] = min(max(col_widths[i], len(str_val)), 40)

    header = "| " + " | ".join(str(c).ljust(col_widths[i]) for i, c in enumerate(columns)) + " |"
    separator = "|" + "|".join("-" * (w + 2) for w in col_widths) + "|"

    lines = [header, separator]
    for row in rows:
        line = "| " + " | ".join(
            str(val if val is not None else "NULL").replace("|", "\\|").replace("\n", " ")[:40].ljust(col_widths[i])
            for i, val in enumerate(row)
        ) + " |"
        lines.append(line)

    output = "\n".join(lines)

    if result.get("truncated"):
        output += f"\n... [Truncated: showing {result['row_count']} of more rows]"

    return output

def run_sql_tool(
    tool_context: ToolContext,
    sql: str,
    save_as: str = "",
) -> str:
    """
    Execute a SQL query against the registered data tables using DuckDB.

    DuckDB supports full SQL including:
    - SELECT, WHERE, GROUP BY, ORDER BY, LIMIT, JOIN
    - Window functions: ROW_NUMBER(), RANK(), LAG(), LEAD()
    - Aggregations: COUNT, SUM, AVG, MIN, MAX, MEDIAN, STDDEV, PERCENTILE_CONT
    - String functions: regexp_replace, trim, lower, upper, string_split
    - Date functions: CAST(col AS DATE), date_part, date_trunc
    - DESCRIBE table_name — get column names and types
    - SUMMARIZE table_name — get statistics for all columns
    - SELECT * FROM table_name USING SAMPLE 5 — random sample
    - CREATE OR REPLACE VIEW ... AS — create derived views
    - PIVOT / UNPIVOT
    - EXCLUDE — e.g., SELECT * EXCLUDE (col1, col2) FROM table

    Args:
        tool_context: The tool context.
        sql: The SQL query to execute. Use table names from get_data_state_list.
        save_as: If provided, save query result as a new Parquet file and register
                 it as a new table with this name. Use for data transformations
                 (e.g., cleaning, creating derived datasets).

    Returns:
        Query results as formatted text, or confirmation of save.
    """
    try:
        print(f"Tool 'run_sql_tool' called with sql={sql[:200]}..., save_as={save_as}")
        engine = _get_engine(tool_context)

        if save_as:
            output_dir = tool_context.state.get("output_dir", "outputs")
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join(output_dir, f"{save_as}.parquet")

            engine.save_query_as_parquet(sql, output_path)
            engine.register_parquet(save_as, output_path)

            data_state = tool_context.state.get("data_state", {})
            data_state[save_as] = {
                "path": output_path,
                "description": f"Derived dataset: {save_as}",
            }
            tool_context.state["data_state"] = data_state

            count_result = engine.execute_query(f'SELECT COUNT(*) as cnt FROM "{save_as}"')
            row_count = count_result["rows"][0][0] if count_result["rows"] else "unknown"

            return f"Query result saved as table '{save_as}' ({row_count} rows) at {output_path}"
        else:
            result = engine.execute_query(sql)
            return _truncate_output(_format_query_result(result))

    except Exception as e:
        return f"Error executing SQL: {str(e)}\n\nQuery was: {sql}"


def plot_tool(
    tool_context: ToolContext,
    sql: str,
    plot_type: str,
    x: str,
    y: str = None,
    hue: str = None,
    title: str = None,
    xlabel: str = None,
    ylabel: str = None,
    color: str = None,
    palette: str = None,
    save_path: str = None,
) -> str:
    """
    Execute a SQL query and plot the results. The SQL query should return a
    SMALL result set suitable for plotting (ideally < 100 rows).

    The query should pre-aggregate or filter the data so that only the data
    needed for the plot is returned. For example:
    - For a bar chart: SELECT category, AVG(value) as avg_value FROM data GROUP BY category ORDER BY avg_value DESC LIMIT 20
    - For a histogram: SELECT column FROM data (DuckDB will handle binning via the plot library)
    - For a scatter: SELECT x_col, y_col FROM data USING SAMPLE 500

    Args:
        tool_context: The tool context.
        sql: SQL query returning the data to plot. Must be pre-aggregated/filtered.
        plot_type: Type of plot: 'bar', 'line', 'scatter', 'histogram', 'box', 'pie', 'heatmap', 'count'.
        x: Column name for x-axis (from query results).
        y: Column name for y-axis (from query results). Not needed for histogram/count/pie.
        hue: Column name for color grouping (optional).
        title: Plot title (optional).
        xlabel: X-axis label (optional).
        ylabel: Y-axis label (optional).
        color: Single color for the plot (optional).
        palette: Color palette name or JSON dict (optional).
        save_path: Filename to save the plot (e.g., 'revenue_by_category.png'). Auto-generated if not provided.

    Returns:
        Message indicating success and the saved filename.
    """
    try:
        print(f"Tool 'plot_tool' called with plot_type={plot_type}, x={x}, y={y}")
        engine = _get_engine(tool_context)

        plot_df = engine.query_to_df(sql)

        if plot_df.empty:
            return "Error: SQL query returned no data to plot."

        warning = None

        if len(plot_df) > 10000:
            plot_df = plot_df.head(10000)
            print("Warning: Plot data truncated to 10000 rows")
            warning = "Plot data truncated to 10000 rows\n"

        if isinstance(palette, str):
            try:
                import ast
                palette = ast.literal_eval(palette)
            except (ValueError, SyntaxError):
                pass

        if not save_path:
            safe_x = "".join(c for c in x if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_")
            safe_y = "".join(c for c in (y or "") if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_")
            save_path = f"plot_{plot_type}_{safe_x}_{safe_y}.png".rstrip("_.")
            if not save_path.endswith(".png"):
                save_path += ".png"

        output_dir = tool_context.state.get("output_dir", "")
        if output_dir:
            save_path = os.path.join(output_dir, os.path.basename(save_path))
            os.makedirs(output_dir, exist_ok=True)

        plot_warn = None
        if plot_type == "bar":
            plot_warn = plot_bar(plot_df, x=x, y=y, hue=hue, title=title, xlabel=xlabel, ylabel=ylabel, color=color, palette=palette, save_path=save_path)
        elif plot_type == "line":
            plot_warn = plot_line(plot_df, x=x, y=y, hue=hue, title=title, xlabel=xlabel, ylabel=ylabel, color=color, palette=palette, save_path=save_path)
        elif plot_type == "scatter":
            plot_warn = plot_scatter(plot_df, x=x, y=y, hue=hue, title=title, xlabel=xlabel, ylabel=ylabel, color=color, palette=palette, save_path=save_path)
        elif plot_type == "histogram":
            plot_warn = plot_histogram(plot_df, x=x, hue=hue, title=title, xlabel=xlabel, color=color, palette=palette, save_path=save_path)
        elif plot_type == "box":
            plot_warn = plot_box(plot_df, x=x, y=y, hue=hue, title=title, xlabel=xlabel, ylabel=ylabel, color=color, palette=palette, save_path=save_path)
        elif plot_type == "pie":
            plot_warn = plot_pie(plot_df, labels=x, values=y, title=title, palette=palette, save_path=save_path)
        elif plot_type == "heatmap":
            plot_heatmap(plot_df, title=title, cmap=palette or "coolwarm", save_path=save_path)
        elif plot_type == "count":
            plot_warn = plot_count(plot_df, x=x, hue=hue, title=title, xlabel=xlabel, ylabel=ylabel, color=color, palette=palette, save_path=save_path)
        else:
            return f"Error: Unsupported plot type '{plot_type}'. Use: bar, line, scatter, histogram, box, pie, heatmap, count."

        if plot_warn:
            warning = (warning or "") + plot_warn

        del plot_df
        gc.collect()

        msg = f"[PLOT GENERATED] Plot saved to: {os.path.basename(save_path)}"
        if warning:
            msg += f" (Warning: {warning})"
        return msg

    except Exception as e:
        return f"Error in plot_tool: {str(e)}"


def get_understanding_report_tool(
    tool_context: ToolContext, table_name: str = "raw_data"
) -> dict:
    """
    Get an understanding report for the data state.

    Args:
        tool_context: The tool context.
        table_name: The name of the table to analyze. Defaults to 'raw_data'.
    """
    try:
        print(f"Tool 'get_understanding_report_tool' called for table={table_name}")
        engine = _get_engine(tool_context)

        schema_res = engine.execute_query(f'DESCRIBE "{table_name}"')
        data_info = {}
        if schema_res.get("rows"):
            for row in schema_res["rows"]:
                data_info[row[0]] = {"type": row[1]}

        summarize_res = engine.execute_query(f'SUMMARIZE "{table_name}"')
        data_description = {
            "count": {}, "mean": {}, "std": {}, "min": {}, "25%": {}, "50%": {}, "75%": {}, "max": {}, "unique": {}, "null_percentage": {}
        }
        if summarize_res.get("rows"):
            for row in summarize_res["rows"]:
                col_name = row[0]
                data_description["count"][col_name] = row[10]
                data_description["mean"][col_name] = row[5]
                data_description["std"][col_name] = row[6]
                data_description["min"][col_name] = row[2]
                data_description["25%"][col_name] = row[7]
                data_description["50%"][col_name] = row[8]
                data_description["75%"][col_name] = row[9]
                data_description["max"][col_name] = row[3]
                data_description["unique"][col_name] = row[4]
                data_description["null_percentage"][col_name] = row[11]

        sample_res = engine.execute_query(f'SELECT * FROM "{table_name}" USING SAMPLE 3')
        sample_data = {}
        if sample_res.get("columns") and sample_res.get("rows"):
            columns = sample_res["columns"]
            for idx, row in enumerate(sample_res["rows"]):
                sample_data[str(idx)] = {col: val for col, val in zip(columns, row)}

        understanding_report = {
            "data_info": data_info,
            "data_description": data_description,
            "sample_data": sample_data,
        }

        import json
        return json.loads(json.dumps(understanding_report, default=str))
    except Exception as e:
        return {"error": f"Error executing tool 'get_understanding_report_tool': {str(e)}"}


def get_assessment_report_tool(
    tool_context: ToolContext, table_name: str = "raw_data"
) -> dict:
    """
    Get an assessment report for the data state.

    Args:
        tool_context: The tool context.
        table_name: The name of the table to analyze. Defaults to 'raw_data'.
    """
    try:
        print(f"Tool 'get_assessment_report_tool' called for table={table_name}")
        engine = _get_engine(tool_context)

        profile = {}
        schema_res = engine.execute_query(f'DESCRIBE "{table_name}"')
        columns = [r[0] for r in schema_res.get("rows", [])]
        dtypes = {r[0]: r[1] for r in schema_res.get("rows", [])}

        summarize_res = engine.execute_query(f'SUMMARIZE "{table_name}"')
        summarize_dict = {r[0]: r for r in summarize_res.get("rows", [])}

        row_count_res = engine.execute_query(f'SELECT COUNT(*) FROM "{table_name}"')
        total_rows = row_count_res["rows"][0][0] if row_count_res.get("rows") else 0

        for col in columns:
            s_row = summarize_dict.get(col)

            sample_val_res = engine.execute_query(f'SELECT "{col}" FROM "{table_name}" WHERE "{col}" IS NOT NULL LIMIT 5')
            sample_values = [r[0] for r in sample_val_res.get("rows", [])]

            null_percentage = float(s_row[11]) if s_row and s_row[11] is not None else 0.0
            col_null_ratio = null_percentage / 100.0
            null_count = int(total_rows * col_null_ratio)
            unique_count = int(s_row[4]) if s_row and s_row[4] is not None else 0

            profile[col] = {
                "dtype": dtypes[col],
                "null_count": null_count,
                "null_ratio": col_null_ratio,
                "unique_count": unique_count,
                "sample_values": sample_values
            }

            if s_row and s_row[5] is not None:
                profile[col].update({
                    "min": s_row[2],
                    "max": s_row[3],
                    "mean": s_row[5],
                    "std": s_row[6]
                })

        total_cells = total_rows * len(columns) if columns else 0
        total_nulls = sum(profile[c].get("null_count", 0) for c in columns)
        null_ratio = total_nulls / max(total_cells, 1)

        try:
            dup_query = f'SELECT (SELECT COUNT(*) FROM "{table_name}") - (SELECT COUNT(*) FROM (SELECT DISTINCT * FROM "{table_name}"))'
            dup_res = engine.execute_query(dup_query)
            duplicate_count = dup_res["rows"][0][0] if dup_res.get("rows") else 0
        except Exception:
            duplicate_count = 0

        duplicate_ratio = duplicate_count / max(total_rows, 1)

        data_quality_score = {
            "null_ratio": null_ratio,
            "duplicate_ratio": duplicate_ratio,
        }

        assessment_report = {
            "column_profile_report": profile,
            "data_quality_score": data_quality_score,
        }

        import json
        return json.loads(json.dumps(assessment_report, default=str))
    except Exception as e:
        return {"error": f"Error executing tool 'get_assessment_report_tool': {str(e)}"}


def get_data_state_list(tool_context: ToolContext) -> list[dict[str, str]]:
    """
    Get a list of data tables available for querying.

    Returns:
        list[dict]: List of tables with their names and descriptions.
    """
    try:
        print("Tool 'get_data_state_list' called")
        _get_engine(tool_context)
        
        if "data_state" not in tool_context.state:
            return []
        state_list = []
        for key, value in tool_context.state["data_state"].items():
            state_list.append({"key": key, "description": value.get("description", "")})
        return state_list
    except Exception as e:
        return [{"error": f"Error: {str(e)}"}]


def list_output_files_tool(tool_context: ToolContext) -> list[str]:
    """
    List all files in the output directory.

    Returns:
        list[str]: A list of filenames in the output directory.
    """
    try:
        print("Tool 'list_output_files_tool' called")
        output_dir = tool_context.state.get("output_dir", "")
        if not output_dir or not os.path.exists(output_dir):
            return []
        return [f for f in os.listdir(output_dir) if os.path.isfile(os.path.join(output_dir, f))]
    except Exception as e:
        return [f"Error: {str(e)}"]