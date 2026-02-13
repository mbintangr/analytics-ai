from google.adk.agents import Agent, SequentialAgent, LoopAgent
from google.adk.tools import agent_tool
from google.adk.models.lite_llm import LiteLlm
from google.genai import types
from dotenv import load_dotenv
import os
import warnings
import logging
from .agentTools import (
    exit_loop,
    get_data_state_list,
    get_understanding_report,
    get_assessment_report,
    get_unique_values_tool,
    get_unique_values_count_tool,
    get_rows_by_condition_tool,
    get_null_values_rows_tool,
    merge_data_tool,
    remove_null_values_tool,
    fill_null_values_tool,
    remove_duplicate_values_tool,
    replace_column_value_tool,
    replace_column_value_regex_tool,
    change_data_type_tool,
    create_column_from_expression_tool,
    drop_columns_tool,
    rename_columns_tool,
    clean_text_column_tool,
    convert_to_datetime_tool,
    impute_missing_values_tool,
    copy_data_state_tool,
    save_data_state_tool,
    group_and_aggregate_tool,
    create_pivot_table_tool,
    get_top_n_rows_tool,
    get_group_stats_tool,
    get_column_stats_tool,
    get_aggregation_scalar_tool,
    get_data_tool,
    remove_outliers_tool,
    clip_values_tool,
    remove_rows_by_condition_tool,
    filter_rows_by_condition_tool,
    split_column_tool,
    convert_column_type_tool,
    plot_chart_tool,
    list_output_files_tool,
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

#model = LiteLlm(
    # model="openrouter/xiaomi/mimo-v2-flash",
    # model="openrouter/openai/gpt-oss-120b:free",
    # model="openrouter/openai/gpt-oss-20b:free",
    # model="openrouter/nvidia/nemotron-3-nano-30b-a3b:free",
    # model="openrouter/qwen/qwen3-coder:free",
#    model="openrouter/arcee-ai/trinity-large-preview:free",
#    api_key=os.environ["OPENROUTER_API_KEY"],
#    api_base="https://openrouter.ai/api/v1",
#)

model = LiteLlm(
    model="nvidia_nim/openai/gpt-oss-120b",
    api_key=os.environ["NVIDIA_API_KEY"],
    api_base="https://integrate.api.nvidia.com/v1",
)

data_understanding_agent = Agent(
    model=model,
    name="data_understanding_agent",
    description="A data understanding agent.",
    instruction="""
You are a Data Understanding Agent.

OBJECTIVE:
Produce a strictly factual, schema-level understanding of the dataset.
This agent establishes the ONLY authoritative reference for column names and data types.

MANDATORY EXECUTION RULES:
1. You MUST call get_understanding_report(key="raw_data") as your FIRST and ONLY tool call.
2. You MUST NOT call any other tool.
3. You MUST NOT infer, hypothesize, or suggest anything.

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
        get_understanding_report,
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
You are a Data Quality Assessment Agent.

OBJECTIVE:
Diagnose data quality issues and produce an actionable cleaning plan.
You MUST NOT modify data.

EXECUTION STEPS:
1. Call get_data_state_list().
2. Select the MOST PROCESSED dataset:
   - Prefer keys starting with 'cleaned_' or 'processed_'
   - Otherwise use 'raw_data'
3. Call get_assessment_report(key).
4. Use inspection tools ONLY if the assessment reveals ambiguity.

OUTPUT FORMAT (Markdown ONLY):

## Data Quality Assessment
- Bullet list of concrete issues (nulls, duplicates, invalid values, outliers)

## Cleaning Recommendations
Numbered list.
Each item MUST:
- Reference a specific column
- Map DIRECTLY to a tool used by data_cleaning_agent
- Be feasible and deterministic

STRICT CONSTRAINTS:
- Do NOT clean data
- Do NOT call cleaning tools
- Do NOT suggest unverifiable actions
- Do NOT restate tool output verbatim
- No extra text outside the report
    """,
    output_key="data_assessment",
    tools=[
        get_data_state_list,
        get_assessment_report,
        get_unique_values_tool,
        get_unique_values_count_tool,
        get_rows_by_condition_tool,
        get_null_values_rows_tool,
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
You are a Data Cleaning Execution Agent.

OBJECTIVE:
Execute the Cleaning Recommendations exactly using tools.
You MUST NOT assess, verify, or interpret results.

MANDATORY PROCEDURE:
1. Identify the latest usable data key using get_data_state_list().
2. FIRST ACTION:
   Call copy_data_state_tool(source_key, target_key='cleaned_data').
   ALL operations MUST use 'cleaned_data'.
3. Execute cleaning steps ONE BY ONE.
4. After every major transformation, call save_data_state_tool(key='cleaned_data').

OUTPUT REQUIREMENTS:
- Output a concise Markdown execution log listing:
  - Step number
  - Tool used
  - Column(s) affected

STRICT CONSTRAINTS:
- NEVER call get_assessment_report
- NEVER judge cleanliness
- NEVER invent columns
- NEVER modify the source dataset
- Output ONLY the execution log
    """,
    tools=[
        get_data_state_list,
        copy_data_state_tool,
        merge_data_tool,
        remove_null_values_tool,
        fill_null_values_tool,
        remove_duplicate_values_tool,
        replace_column_value_tool,
        replace_column_value_regex_tool,
        change_data_type_tool,
        create_column_from_expression_tool,
        drop_columns_tool,
        rename_columns_tool,
        clean_text_column_tool,
        convert_to_datetime_tool,
        impute_missing_values_tool,
        save_data_state_tool,
        remove_outliers_tool,
        clip_values_tool,
        remove_rows_by_condition_tool,
        split_column_tool,
        convert_column_type_tool,
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

OBJECTIVE:
Execute a strictly ordered preprocessing pipeline consisting of:
1) schema understanding,
2) pre-cleaning data quality diagnosis,
3) deterministic cleaning execution,
4) post-cleaning data quality validation.

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
    before_agent_callback=[log_before_agent_execution],
    after_agent_callback=[log_after_agent_execution],
    before_tool_callback=[log_before_tool_execution],
    after_tool_callback=[log_after_tool_execution],
)

business_questions_agent = Agent(
    model=model,
    name="business_questions_agent",
    description="A business questions agent.",
    instruction="""
You are a Business Question Formulation Agent.

OBJECTIVE:
Generate 5-7 high-impact, data-answerable business questions.

EXECUTION STEPS:
1. Call get_data_state_list() and select the CLEANEST dataset.
2. Call get_understanding_report(key).
3. Call get_assessment_report(key).
4. Generate questions that:
   - Can be answered with aggregation, grouping, or visualization
   - Do NOT require external data
   - Do NOT require ML modeling

OUTPUT FORMAT:
Numbered Markdown list ONLY.

STRICT CONSTRAINTS:
- No explanations
- No sub-bullets
- No assumptions
- No operational recommendations
    """,
    tools=[
        get_data_state_list,
        get_understanding_report,
        get_assessment_report,
    ],
    output_key="business_questions",
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
You are a Data Preparation Agent.

OBJECTIVE:
Prepare question-specific datasets for visualization and analysis.

INPUT:
- Business Questions

MANDATORY RULES:
1. Call get_data_state_list().
2. Identify 'cleaned_data'.
3. Call get_understanding_report(key='cleaned_data') to confirm column names.
4. For EACH business question:
   a. Create a NEW dataset via copy_data_state_tool
   b. Apply ONLY the transformations required for that question
   c. NEVER modify 'cleaned_data'

CRITICAL FAILURE CONDITIONS:
- Guessing column names
- Reusing the same prep key for multiple questions
- Describing transformations without executing tools

OUTPUT:
Bullet list of:
- Dataset key
- One-line description

Output ONLY this list.
    """,
    tools=[
        get_data_state_list,
        get_understanding_report,
        copy_data_state_tool,
        get_top_n_rows_tool,
        group_and_aggregate_tool,
        create_pivot_table_tool,
        create_column_from_expression_tool,
        filter_rows_by_condition_tool,
        convert_to_datetime_tool,
        save_data_state_tool,
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
You are an Insights Generation Agent.

OBJECTIVE:
Extract quantitative insights supported by plots.

INPUT:
- Business Questions
- Prepared Data Keys

EXECUTION STEPS:
1. Call get_data_state_list().
2. For EACH question:
   a. Select the correct prepared dataset
   b. Generate statistics using analysis tools
   c. Ensure at least ONE visualization is produced
3. Record visualization filenames EXACTLY as returned.   

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
        get_top_n_rows_tool,
        get_group_stats_tool,
        get_column_stats_tool,
        get_aggregation_scalar_tool,
        get_data_tool,
        plot_chart_tool,
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

eda_agent = Agent(
    name="eda_agent",
    model=model,
    description="An EDA agent.",
    instruction="""
You are an Exploratory Data Analysis Coordinator.

OBJECTIVE:
Run EDA for EACH business question and consolidate results.

AVAILABLE AGENTS:
- prep_insight_agent

EXECUTION RULES:
1. Iterate over questions ONE AT A TIME.
2. Call prep_insight_agent for each question.
3. Preserve ALL visualization references exactly.

OUTPUT:
Structured Markdown report:
- Section per question
- Insights + visualizations grouped correctly

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

OBJECTIVE:
Transform EDA outputs into a compelling executive-ready report.

INPUT:
- EDA Report

MANDATORY RULES:
1. Call list_output_files_tool().
2. Embed ONLY images that exist in the output directory.
3. Every embedded image MUST appear in the EDA report.
4. Don't add any extra text outside the report.

REPORT STRUCTURE (Strictly Follow This Format):
    
# [Title: Catchy & Professional]

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

[Embed Image Here: `![Description](q1_filename.png)`]

The q* prefix is used to identify the question number.

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
        business_questions_agent,
        eda_agent,
        data_explainer_agent,
    ],
    before_agent_callback=[log_before_agent_execution],
    after_agent_callback=[log_after_agent_execution],
)
