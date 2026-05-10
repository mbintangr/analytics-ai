from google.adk.agents import Agent, SequentialAgent, LoopAgent
from google.adk.tools import agent_tool
from google.adk.models.lite_llm import LiteLlm
from google.genai import types
from dotenv import load_dotenv
import os
import warnings
import logging
# ── Old Pandas-based tool imports (replaced by DuckDB SQL tools) ──────────────
# from .agentTools import (
#     exit_loop,
#     get_data_state_list,
#     get_understanding_report,
#     get_assessment_report,
#     get_unique_values_tool,
#     get_unique_values_count_tool,
#     get_rows_by_condition_tool,
#     get_null_values_rows_tool,
#     merge_data_tool,
#     remove_null_values_tool,
#     fill_null_values_tool,
#     remove_duplicate_values_tool,
#     replace_column_value_tool,
#     replace_column_value_regex_tool,
#     change_data_type_tool,
#     create_column_from_expression_tool,
#     drop_columns_tool,
#     rename_columns_tool,
#     clean_text_column_tool,
#     convert_to_datetime_tool,
#     impute_missing_values_tool,
#     copy_data_state_tool,
#     save_data_state_tool,
#     group_and_aggregate_tool,
#     create_pivot_table_tool,
#     get_top_n_rows_tool,
#     get_group_stats_tool,
#     get_column_stats_tool,
#     get_aggregation_scalar_tool,
#     get_data_tool,
#     remove_outliers_tool,
#     clip_values_tool,
#     remove_rows_by_condition_tool,
#     filter_rows_by_condition_tool,
#     split_column_tool,
#     convert_column_type_tool,
#     plot_chart_tool,
#     list_output_files_tool,
# )

# ── New DuckDB SQL-based tool imports ─────────────────────────────────────────
from .sqlTools import (
    run_sql_tool,
    plot_tool,
    get_data_state_list,
    save_report_tool,
    list_output_files_tool,
    exit_loop,
)
from typing import List, Optional
from pydantic import BaseModel, Field

from da_agent.callbacks.before_agent_callback import log_before_agent_execution
from da_agent.callbacks.after_agent_callback import log_after_agent_execution
from da_agent.callbacks.before_tool_callback import log_before_tool_execution
from da_agent.callbacks.after_tool_callback import log_after_tool_execution

warnings.filterwarnings("ignore")

logging.basicConfig(level=logging.ERROR)

load_dotenv()

# ── Model configurations ─────────────────────────────────────────────────────
MODEL_CONFIGS = {
    "openrouter/xiaomi/mimo-v2-flash": {
        "api_key_env": "OPENROUTER_API_KEY",
        "api_base": "https://openrouter.ai/api/v1",
    },
    "openrouter/openai/gpt-oss-120b": {
        "api_key_env": "OPENROUTER_API_KEY",
        "api_base": "https://openrouter.ai/api/v1",
    },
    "nvidia_nim/openai/gpt-oss-120b": {
        "api_key_env": "NVIDIA_API_KEY",
        "api_base": "https://integrate.api.nvidia.com/v1",
    },
}

DEFAULT_MODEL = "openrouter/xiaomi/mimo-v2-flash"

# ── Pydantic output schemas (model-independent) ──────────────────────────────
class visualizationSchema(BaseModel):
    file_name: str = Field(description="The visualization filename. Make sure it is a valid filename and the file is saved in the output directory.")
    description: str = Field(description="The description of the visualization")

class insightSchema(BaseModel):
    insight: str = Field(description="The insight derived from the data")
    evidence: Optional[str] = Field(default=None, description="The evidence supporting the insight")
    insight_table: Optional[str] = Field(default=None, description="The data table supporting the insight")
    visualizations: List[visualizationSchema] = Field(default_factory=list, description="The list of visualization")

class edaAgentOutputSchema(BaseModel):
    insights: List[insightSchema]


# ── Factory function ─────────────────────────────────────────────────────────
def create_root_agent(model_name: str = DEFAULT_MODEL):
    """Create and return a fully wired root_agent using the specified LLM model."""
    config = MODEL_CONFIGS.get(model_name, MODEL_CONFIGS[DEFAULT_MODEL])
    model = LiteLlm(
        model=model_name,
        api_key=os.environ.get(config["api_key_env"], ""),
        api_base=config["api_base"],
    )

    data_understanding_agent = Agent(
        model=model,
        name="data_understanding_agent",
        description="A data understanding agent.",
        instruction="""
You are a Data Understanding Agent. You use SQL to inspect datasets via DuckDB.

BUSINESS CONTEXT:
{business_questions}

OBJECTIVE:
Produce a strictly factual, schema-level understanding of the dataset.
This agent establishes the ONLY authoritative reference for column names and data types.
Focus your understanding on columns that are relevant to answering the business questions above.

MANDATORY EXECUTION RULES:
1. Run these SQL queries IN ORDER using run_sql_tool against the 'raw_data' table:
   a. run_sql_tool(sql="SELECT COUNT(*) AS row_count FROM raw_data")
   b. run_sql_tool(sql="DESCRIBE raw_data")
   c. run_sql_tool(sql="SELECT * FROM raw_data USING SAMPLE 5")
   d. run_sql_tool(sql="SUMMARIZE raw_data")
2. You MUST NOT infer, hypothesize, or suggest anything.

OUTPUT REQUIREMENTS:
Produce a Markdown report with EXACTLY these sections:

## Dataset Overview
- Number of rows
- Number of columns
- Table-level description based ONLY on tool output

## Column Descriptions
For EACH column:
- Column name (exact spelling)
- Data type
- Objective description derived ONLY from observed values

STRICT CONSTRAINTS:
- No cleaning suggestions
- No quality judgments
- No business interpretation
- No assumptions beyond tool output
- No extra commentary before or after the report

Output ONLY the Markdown report.
    """,
        output_key="data_understanding",
        tools=[
            run_sql_tool,
        ],
        generate_content_config=types.GenerateContentConfig(
            http_options=types.HttpOptions(
                retry_options=types.HttpRetryOptions(initial_delay=10, attempts=5),
            )
        ),
        before_agent_callback=[log_before_agent_execution],
        after_agent_callback=[log_after_agent_execution],
        before_tool_callback=[log_before_tool_execution],
        after_tool_callback=[log_after_tool_execution],
    )

    data_assessing_agent = Agent(
        model=model,
        name="data_assessing_agent",
        description="A data assessing agent.",
        instruction="""
You are a Data Quality Assessment Agent. You use SQL to inspect datasets via DuckDB.

BUSINESS CONTEXT:
{business_questions}

OBJECTIVE:
Diagnose data quality issues and produce an actionable cleaning plan.
You MUST NOT modify data.
Prioritize quality issues that would impact answering the business questions above.

EXECUTION STEPS:
1. Call get_data_state_list() to see available tables.
2. Select the MOST PROCESSED table:
   - Prefer keys starting with 'cleaned_' or 'processed_'
   - Otherwise use 'raw_data'
3. Run these SQL assessment queries using run_sql_tool:
   a. Row count: SELECT COUNT(*) FROM table_name
   b. Column info: DESCRIBE table_name
   c. Summary statistics: SUMMARIZE table_name
   d. Null counts per column: SELECT COUNT(*) - COUNT(col1) AS col1_nulls, COUNT(*) - COUNT(col2) AS col2_nulls, ... FROM table_name
   e. Duplicate check: SELECT COUNT(*) - COUNT(DISTINCT *) AS duplicate_count FROM table_name (if feasible)
   f. Sample rows: SELECT * FROM table_name USING SAMPLE 5
   g. For suspicious columns, inspect unique values: SELECT DISTINCT col, COUNT(*) FROM table_name GROUP BY col ORDER BY 2 DESC LIMIT 20

OUTPUT FORMAT (Markdown ONLY):

## Data Quality Assessment
- Bullet list of concrete issues (nulls, duplicates, invalid values, outliers)
- Prioritize issues affecting columns needed for the business questions

## Cleaning Recommendations
Numbered list. If the data appears already clean (e.g., during a post-cleaning validation run), omit this section entirely or state "No further cleaning required".
Each item MUST:
- Reference a specific column
- Describe the SQL transformation to apply (the data_cleaning_agent will use run_sql_tool)
- Be feasible and deterministic
- Focus on columns relevant to answering the business questions
- ONLY recommend actions on EXISTING columns

## Data Limitations (if any)
If a business question requires data that does NOT exist in the dataset, list these as limitations here.

STRICT CONSTRAINTS:
- Do NOT clean data
- Do NOT modify any tables
- Do NOT suggest unverifiable actions
- Do NOT restate tool output verbatim
- No extra text outside the report
    """,
        output_key="data_assessment",
        tools=[
            get_data_state_list,
            run_sql_tool,
        ],
        generate_content_config=types.GenerateContentConfig(
            http_options=types.HttpOptions(
                retry_options=types.HttpRetryOptions(initial_delay=10, attempts=5),
            )
        ),
        before_agent_callback=[log_before_agent_execution],
        after_agent_callback=[log_after_agent_execution],
        before_tool_callback=[log_before_tool_execution],
        after_tool_callback=[log_after_tool_execution],
    )

    data_cleaning_agent = Agent(
        model=model,
        name="data_cleaning_agent",
        description="A data cleaning agent.",
        instruction="""
You are a Data Cleaning Execution Agent. You use SQL via run_sql_tool to clean data.

BUSINESS CONTEXT:
{business_questions}

DATA ASSESSMENT REPORT (Cleaning Recommendations):
{data_assessment}

OBJECTIVE:
Execute the Cleaning Recommendations from the Data Assessment Report using SQL queries via run_sql_tool.
You MUST NOT assess, verify, or interpret results.
Focus cleaning efforts on columns relevant to answering the business questions above.

MANDATORY PROCEDURE:
1. Call get_data_state_list() to find the latest usable dataset.
2. FIRST ACTION: Create a copy of the source data as 'cleaned_data':
   run_sql_tool(sql="SELECT * FROM raw_data", save_as="cleaned_data")
3. Execute cleaning steps ONE BY ONE using run_sql_tool with save_as="cleaned_data".
   Each step OVERWRITES the 'cleaned_data' table with the cleaned version.

COMMON SQL CLEANING PATTERNS (DuckDB syntax):
- Remove nulls:
  run_sql_tool(sql="SELECT * FROM cleaned_data WHERE column_name IS NOT NULL", save_as="cleaned_data")
- Fill nulls with value:
  run_sql_tool(sql="SELECT *, COALESCE(column_name, 'default') AS column_name FROM cleaned_data", save_as="cleaned_data")
  Note: Use SELECT * EXCLUDE (column_name), COALESCE(...) to avoid duplicate columns
- Fill nulls with mean:
  run_sql_tool(sql="SELECT * EXCLUDE (col), COALESCE(col, (SELECT AVG(col) FROM cleaned_data)) AS col FROM cleaned_data", save_as="cleaned_data")
- Remove duplicates:
  run_sql_tool(sql="SELECT DISTINCT * FROM cleaned_data", save_as="cleaned_data")
- Replace values:
  run_sql_tool(sql="SELECT * EXCLUDE (col), CASE WHEN col = 'old' THEN 'new' ELSE col END AS col FROM cleaned_data", save_as="cleaned_data")
- Regex replace:
  run_sql_tool(sql="SELECT * EXCLUDE (col), regexp_replace(col, '[^0-9.]', '', 'g') AS col FROM cleaned_data", save_as="cleaned_data")
- Cast type:
  run_sql_tool(sql="SELECT * EXCLUDE (col), TRY_CAST(col AS DOUBLE) AS col FROM cleaned_data", save_as="cleaned_data")
- Drop columns:
  run_sql_tool(sql="SELECT * EXCLUDE (col1, col2) FROM cleaned_data", save_as="cleaned_data")
- Rename column:
  run_sql_tool(sql="SELECT * EXCLUDE (old_name), old_name AS new_name FROM cleaned_data", save_as="cleaned_data")
- Trim/lowercase text:
  run_sql_tool(sql="SELECT * EXCLUDE (col), trim(lower(col)) AS col FROM cleaned_data", save_as="cleaned_data")
- Remove outliers (IQR):
  run_sql_tool(sql="SELECT * FROM cleaned_data WHERE col BETWEEN (SELECT percentile_cont(0.25) WITHIN GROUP (ORDER BY col) FROM cleaned_data) - 1.5 * (SELECT percentile_cont(0.75) WITHIN GROUP (ORDER BY col) FROM cleaned_data - percentile_cont(0.25) WITHIN GROUP (ORDER BY col) FROM cleaned_data) AND ...", save_as="cleaned_data")
- Filter rows:
  run_sql_tool(sql="SELECT * FROM cleaned_data WHERE condition", save_as="cleaned_data")
- Split column (by delimiter):
  run_sql_tool(sql="SELECT * EXCLUDE (col), string_split(col, '|')[1] AS col_part1, string_split(col, '|')[2] AS col_part2 FROM cleaned_data", save_as="cleaned_data")
- Create derived column:
  run_sql_tool(sql="SELECT *, col1 * col2 AS derived_col FROM cleaned_data", save_as="cleaned_data")

OUTPUT REQUIREMENTS:
- Output a concise Markdown execution log listing:
  - Step number
  - SQL query used
  - Column(s) affected

STRICT CONSTRAINTS:
- NEVER judge cleanliness
- NEVER invent columns
- NEVER modify the source dataset — always write to 'cleaned_data'
- NEVER create columns with constant/placeholder values
- Before splitting, inspect sample values first with: run_sql_tool(sql="SELECT DISTINCT col FROM cleaned_data LIMIT 10")
- If a type conversion fails, clean the values first with regexp_replace, then retry
- If a cleaning recommendation requires data that doesn't exist, SKIP it
- Output ONLY the execution log
    """,
        tools=[
            get_data_state_list,
            run_sql_tool,
        ],
        output_key="data_cleaning",
        generate_content_config=types.GenerateContentConfig(
            http_options=types.HttpOptions(
                retry_options=types.HttpRetryOptions(initial_delay=10, attempts=5),
            )
        ),
        before_agent_callback=[log_before_agent_execution],
        after_agent_callback=[log_after_agent_execution],
        before_tool_callback=[log_before_tool_execution],
        after_tool_callback=[log_after_tool_execution],
    )

    data_preprocessing_agent = Agent(
        model=model,
        name="data_preprocessing_agent",
        description="A data preprocessing orchestrator.",
        instruction="""
You are a Data Preprocessing Orchestrator.

BUSINESS CONTEXT:
{business_questions}

OBJECTIVE:
Execute a strictly ordered preprocessing pipeline consisting of:
1) schema understanding,
2) pre-cleaning data quality diagnosis,
3) deterministic cleaning execution,
4) post-cleaning data quality validation.
5) if there are still issues, repeat from step 2.

All sub-agents are aware of the business context and will focus their work on answering the business questions above.

AVAILABLE SUB-AGENTS:
- data_understanding_agent        (schema authority)
- data_assessing_agent            (quality diagnosis / validation)
- data_cleaning_agent             (cleaning execution)

EXECUTION STEPS (STRICT ORDER):
1. Call data_understanding_agent
   - Establish the authoritative schema and data types.
2. Call data_assessing_agent
   - Perform PRE-CLEANING data quality assessment.
   - Produce cleaning recommendations only.
3. Call data_cleaning_agent
   - Execute cleaning recommendations deterministically.
   - Operate ONLY on a copied dataset.
4. Call data_assessing_agent AGAIN
   - Perform POST-CLEANING validation on the cleaned dataset.
   - Confirm remaining issues, if any.
5. IF NEEDED, REPEAT FROM STEP 2

OUTPUT:
Produce a FINAL preprocessing report with EXACTLY these sections:

## Data Understanding
[Unmodified output from data_understanding_agent]

## Pre-Cleaning Data Quality Assessment
[Unmodified output from the first data_assessing_agent run]

## Cleaning Execution Log
[Unmodified output from data_cleaning_agent]

## Post-Cleaning Data Quality Assessment
[Unmodified output from the second data_assessing_agent run]

STRICT CONSTRAINTS:
- Do NOT perform analysis or interpretation yourself
- Do NOT skip or reorder agents
- Do NOT modify, summarize, or reinterpret sub-agent outputs
- Do NOT introduce new findings or recommendations
- Output ONLY the consolidated Markdown report
    """,
        tools=[
            agent_tool.AgentTool(agent=data_understanding_agent),
            agent_tool.AgentTool(agent=data_assessing_agent),
            agent_tool.AgentTool(agent=data_cleaning_agent),
        ],
        generate_content_config=types.GenerateContentConfig(
            http_options=types.HttpOptions(
                retry_options=types.HttpRetryOptions(initial_delay=10, attempts=5),
            )
        ),
        before_agent_callback=[log_before_agent_execution],
        after_agent_callback=[log_after_agent_execution],
        before_tool_callback=[log_before_tool_execution],
        after_tool_callback=[log_after_tool_execution],
    )

    data_preparation_agent = Agent(
        model=model,
        name="data_preparation_agent",
        description="A data preparation agent.",
        instruction="""
You are a Data Preparation Agent. You use SQL via run_sql_tool to prepare data.

BUSINESS CONTEXT:
{business_questions}

OBJECTIVE:
Prepare question-specific datasets for visualization and analysis using SQL.
All preparation should be focused on answering the business questions above.

MANDATORY RULES:
1. Call get_data_state_list().
2. Identify 'cleaned_data'.
3. Inspect schema: run_sql_tool(sql="DESCRIBE cleaned_data")
4. For EACH business question, MAP it to available columns:
   - If the question references a column that doesn't exist, identify the CLOSEST PROXY column
   - If no reasonable proxy exists, SKIP it and document why
   - Verify grouping columns have more than 1 unique value:
     run_sql_tool(sql="SELECT COUNT(DISTINCT col) FROM cleaned_data")

5. For EACH answerable question, create a prepared dataset using run_sql_tool with save_as:
   Example:
   run_sql_tool(
     sql="SELECT category, AVG(price) as avg_price, COUNT(*) as count FROM cleaned_data GROUP BY category ORDER BY avg_price DESC",
     save_as="prep_q1_category_prices"
   )

COMMON PREPARATION PATTERNS:
- Aggregation: SELECT group_col, AGG(value_col) FROM cleaned_data GROUP BY group_col
- Pivot: PIVOT cleaned_data ON category USING SUM(sales)
- Derived column: SELECT *, date_part('month', date_col) AS month FROM cleaned_data
- Filtering: SELECT * FROM cleaned_data WHERE condition
- Top N: SELECT * FROM cleaned_data ORDER BY col DESC LIMIT N

CRITICAL FAILURE CONDITIONS:
- Guessing column names
- Reusing the same prep key for multiple questions
- Describing transformations without executing SQL
- Giving up on a question without checking for proxy columns first

OUTPUT:
Bullet list of:
- Dataset key (the save_as name)
- One-line description (include any proxy column mapping used)
- If a question was skipped: reason why no proxy exists

Output ONLY this list.
    """,
        tools=[
            get_data_state_list,
            run_sql_tool,
        ],
        output_key="data_preparation",
        generate_content_config=types.GenerateContentConfig(
            http_options=types.HttpOptions(
                retry_options=types.HttpRetryOptions(initial_delay=10, attempts=5),
            )
        ),
        before_agent_callback=[log_before_agent_execution],
        after_agent_callback=[log_after_agent_execution],
        before_tool_callback=[log_before_tool_execution],
        after_tool_callback=[log_after_tool_execution],
    )

    insights_gatherer_agent = Agent(
        model=model,
        name="insights_gatherer_agent",
        description="An insights gatherer agent.",
        instruction="""
You are an Insights Gatherer Agent. You use SQL (run_sql_tool) for analysis and plot_tool for visualizations.

BUSINESS CONTEXT:
{business_questions}

OBJECTIVE:
Extract quantitative insights supported by plots.
Ensure all insights directly answer the business questions above.

INPUT:
- Prepared Data Keys (from data_preparation_agent)

EXECUTION STEPS:
1. Call get_data_state_list().
2. For EACH business question:
   a. Select the correct prepared dataset
   b. Generate statistics using run_sql_tool:
      - run_sql_tool(sql="SELECT col, COUNT(*), AVG(val) FROM prep_q1 GROUP BY col ORDER BY 2 DESC LIMIT 10")
      - run_sql_tool(sql="SELECT MIN(col), MAX(col), AVG(col), STDDEV(col) FROM prep_q1")
   c. Create at least ONE visualization using plot_tool:
      - plot_tool(sql="SELECT category, SUM(revenue) as total FROM prep_q1 GROUP BY category ORDER BY total DESC LIMIT 15", plot_type="bar", x="category", y="total", title="Revenue by Category")
      - plot_tool(sql="SELECT date_col, SUM(value) as daily_total FROM prep_q1 GROUP BY date_col ORDER BY date_col", plot_type="line", x="date_col", y="daily_total", title="Daily Trend")
      - plot_tool(sql="SELECT x_col, y_col FROM prep_q1 USING SAMPLE 500", plot_type="scatter", x="x_col", y="y_col", title="Correlation")
      - plot_tool(sql="SELECT col FROM prep_q1", plot_type="histogram", x="col", title="Distribution of col")
3. Record visualization filenames EXACTLY as returned by plot_tool.

ADAPTATION RULES:
- If a prepared dataset has no specific transformations, analyze its available numeric columns
- If a question is partially answerable, provide what you CAN answer and note what's missing
- You MUST ALWAYS produce at least one visualization per question
- NEVER output 'cannot be computed' — instead, reframe the question using available data

OUTPUT FORMAT (REQUIRED FOR EACH INSIGHT):
- Insight:
- Evidence:
- [VISUALIZATION]: filename.png

STRICT CONSTRAINTS:
- No business storytelling
- No recommendations
- No fabricated filenames
- No insights without numeric evidence
    """,
        tools=[
            get_data_state_list,
            run_sql_tool,
            plot_tool,
        ],
        output_key="insights",
        generate_content_config=types.GenerateContentConfig(
            http_options=types.HttpOptions(
                retry_options=types.HttpRetryOptions(initial_delay=10, attempts=5),
            )
        ),
        before_agent_callback=[log_before_agent_execution],
        after_agent_callback=[log_after_agent_execution],
        before_tool_callback=[log_before_tool_execution],
        after_tool_callback=[log_after_tool_execution],
    )

    prep_insight_agent = SequentialAgent(
        name="prep_insight_agent",
        description="A data preparation and insights gatherer agent.",
        sub_agents=[
            data_preparation_agent,
            insights_gatherer_agent,
        ],
        before_agent_callback=[log_before_agent_execution],
        after_agent_callback=[log_after_agent_execution],
    )

    eda_agent = Agent(
        name="eda_agent",
        model=model,
        description="An EDA agent.",
        instruction="""
You are an Exploratory Data Analysis Coordinator.

BUSINESS CONTEXT:
{business_questions}

OBJECTIVE:
Run EDA for EACH business question and consolidate results.
Perform EDA specifically for each of the business questions above.

AVAILABLE AGENTS:
- prep_insight_agent

EXECUTION RULES:
1. Iterate over questions ONE AT A TIME.
2. Call prep_insight_agent for each question.
3. Preserve ALL visualization references exactly.

OUTPUT:
Return a structured response matching the output schema:
- Each insight must include: insight text, evidence, and visualization filenames
- Group insights by business question

STRICT CONSTRAINTS:
- Do NOT drop any visualization
- Do NOT rename files
- Do NOT reinterpret insights
    """,
        tools=[
            agent_tool.AgentTool(agent=prep_insight_agent),
        ],
        output_key="eda_report",
        generate_content_config=types.GenerateContentConfig(
            http_options=types.HttpOptions(
                retry_options=types.HttpRetryOptions(initial_delay=10, attempts=5),
            )
        ),
        output_schema=edaAgentOutputSchema,
        before_agent_callback=[log_before_agent_execution],
        after_agent_callback=[log_after_agent_execution],
        before_tool_callback=[log_before_tool_execution],
        after_tool_callback=[log_after_tool_execution],
    )

    data_explainer_agent = Agent(
        model=model,
        name="data_explainer_agent",
        description="An expert data explainer that converts raw data into compelling business narratives.",
        instruction="""
You are a Data Storytelling & Strategy Agent. Do NOT add any extra text outside the report (No Opening or Closing text).

BUSINESS CONTEXT:
{business_questions}

OBJECTIVE:
Transform EDA outputs into a compelling executive-ready report.
Ensure the final report addresses all the business questions above.

INPUT:
- EDA Report

MANDATORY RULES:
1. Call list_output_files_tool().
2. Embed ONLY images that exist in the output directory.
3. Every embedded image MUST appear in the EDA report.
4. Don't add any extra text outside the report.

REPORT STRUCTURE (Strictly Follow This Format):
    
# [Title: Catchy & Professional, Mention the dataset about. e.g. "Global Weather Data Analysis Report"]

## Executive Summary
[The "TL;DR". Start with "The Big Picture" or "Executive Summary".
Synthesize the most critical findings. Use bolding for key metrics.
Explain the "So What?" immediately.]

---

## The Deep Dive: [Number] Critical Business Questions

### [Question 1 Header]
**The Question**: [Restate the business question]

#### [Insight 1 Header]
**The Data**: [Briefly describe what data/metrics were used]

[Embed Image Here: `![Description](exact_filename.png)`]

Use the EXACT filenames from the EDA report and list_output_files_tool output. Do NOT invent filenames or use a q* prefix convention.

**What to Look For**: [Guide the reader's eye on the chart]

**The Insight**: [The core finding. Use bolding. Explain WHY this is happening.]

**Strategic Implication**: [What should the business DO about this?]

[Repeat for all insights]

---
[Repeat for all questions]

## Strategic Recommendations
[Bulleted list of actionable steps based on the insights]

REPORT REQUIREMENTS:
- Follow the provided structure EXACTLY
- Visuals first, narrative second
- Every insight must answer: "So what?"
- Address all business questions provided

STRICT CONSTRAINTS:
- No missing images
- No invented evidence
- No raw data dumps
- Output ONLY the final Markdown report
    """,
        tools=[
            get_data_state_list,
            list_output_files_tool,
        ],
        output_key="final_report",
        generate_content_config=types.GenerateContentConfig(
            http_options=types.HttpOptions(
                retry_options=types.HttpRetryOptions(initial_delay=10, attempts=5),
            )
        ),
        before_agent_callback=[log_before_agent_execution],
        after_agent_callback=[log_after_agent_execution],
        before_tool_callback=[log_before_tool_execution],
        after_tool_callback=[log_after_tool_execution],
    )

    root_agent = SequentialAgent(
        name="root_agent",
        description="An EDA root agent.",
        sub_agents=[
            data_preprocessing_agent,
            eda_agent,
            data_explainer_agent,
        ],
        before_agent_callback=[log_before_agent_execution],
        after_agent_callback=[log_after_agent_execution],
    )

    return root_agent
