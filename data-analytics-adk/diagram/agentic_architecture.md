graph TB
    subgraph "Model Configuration"
        MC[MODEL_CONFIGS]
        DM[DEFAULT_MODEL]
        LLM[LiteLlm Model]
    end
    
    subgraph "Root Agent (SequentialAgent)"
        RA[Root Agent<br/>SequentialAgent]
    end
    
    subgraph "Phase 1: Data Preprocessing"
        DPA[Data Preprocessing Agent<br/>Agent (Orchestrator)]
    end
    
    subgraph "Phase 2: EDA Analysis"
        EDA[EDA Agent<br/>Agent (Coordinator)]
    end
    
    subgraph "Phase 3: Final Report"
        DER[Data Explainer Agent<br/>Agent (Storyteller)]
    end
    
    subgraph "Data Preprocessing Sub-Agents"
        DUA[Data Understanding Agent<br/>Agent]
        DAA[Data Assessing Agent<br/>Agent]
        DCA[Data Cleaning Agent<br/>Agent]
    end
    
    subgraph "EDA Sub-Agents"
        PIA[Prep Insight Agent<br/>SequentialAgent]
    end
    
    subgraph "Prep Insight Sub-Agents"
        DPAg[Data Preparation Agent<br/>Agent]
        IGA[Insights Gatherer Agent<br/>Agent]
    end
    
    subgraph "Tools"
        T1[run_sql_tool]
        T2[plot_tool]
        T3[get_data_state_list]
        T4[list_output_files_tool]
        T5[save_report_tool]
        T6[exit_loop]
        AT[agent_tool.AgentTool]
    end
    
    subgraph "Callbacks"
        CB1[Before Agent Callback]
        CB2[After Agent Callback]
        CB3[Before Tool Callback]
        CB4[After Tool Callback]
    end
    
    subgraph "Output Schemas"
        VS[visualizationSchema]
        IS[insightSchema]
        EAS[edaAgentOutputSchema]
    end
    
    %% Connections
    MC --> DM
    DM --> LLM
    LLM --> RA
    
    RA --> DPA
    RA --> EDA
    RA --> DER
    
    DPA --> AT
    DPA --> DUA
    DPA --> DAA
    DPA --> DCA
    
    EDA --> AT
    EDA --> PIA
    
    PIA --> DPAg
    PIA --> IGA
    
    %% Tools connections
    DUA --> T1
    DAA --> T3
    DAA --> T1
    DCA --> T3
    DCA --> T1
    DPAg --> T3
    DPAg --> T1
    IGA --> T3
    IGA --> T1
    IGA --> T2
    DER --> T3
    DER --> T4
    
    %% Callbacks connections
    DUA --> CB1
    DUA --> CB2
    DUA --> CB3
    DUA --> CB4
    
    DAA --> CB1
    DAA --> CB2
    DAA --> CB3
    DAA --> CB4
    
    DCA --> CB1
    DCA --> CB2
    DCA --> CB3
    DCA --> CB4
    
    DPA --> CB1
    DPA --> CB2
    DPA --> CB3
    DPA --> CB4
    
    DPAg --> CB1
    DPAg --> CB2
    DPAg --> CB3
    DPAg --> CB4
    
    IGA --> CB1
    IGA --> CB2
    IGA --> CB3
    IGA --> CB4
    
    EDA --> CB1
    EDA --> CB2
    EDA --> CB3
    EDA --> CB4
    
    DER --> CB1
    DER --> CB2
    DER --> CB3
    DER --> CB4
    
    RA --> CB1
    RA --> CB2
    
    %% Schema connections
    IGA --> IS
    EDA --> EAS
    IS --> VS
    
    %% Data Flow
    subgraph "Data Flow"
        DF1[Raw Data]
        DF2[Understood Data]
        DF3[Assessed Data]
        DF4[Cleaned Data]
        DF5[Prepared Data]
        DF6[Insights & Visualizations]
        DF7[Final Report]
    end
    
    DF1 --> DUA
    DUA --> DF2
    DF2 --> DAA
    DAA --> DF3
    DF3 --> DCA
    DCA --> DF4
    DF4 --> DPAg
    DPAg --> DF5
    DF5 --> IGA
    IGA --> DF6
    DF6 --> EDA
    EDA --> DER
    DER --> DF7
```

## Architecture Overview

This diagram illustrates the comprehensive Agentic AI workflow for data analytics. The system is organized into three main phases:

### Phase 1: Data Preprocessing
- **Data Preprocessing Agent**: Orchestrates the entire preprocessing pipeline
- **Data Understanding Agent**: Establishes authoritative schema and data types
- **Data Assessing Agent**: Performs quality assessment and cleaning recommendations
- **Data Cleaning Agent**: Executes cleaning operations deterministically

### Phase 2: EDA Analysis
- **EDA Agent**: Coordinates exploratory data analysis for each business question
- **Prep Insight Agent**: Sequential agent combining preparation and insights
- **Data Preparation Agent**: Creates question-specific datasets
- **Insights Gatherer Agent**: Extracts quantitative insights with visualizations

### Phase 3: Final Report
- **Data Explainer Agent**: Transforms EDA outputs into executive-ready reports

### Key Components

#### Model Configuration
- Supports multiple LLM providers (OpenRouter, NVIDIA)
- Configurable API endpoints and authentication
- Default model: `openrouter/xiaomi/mimo-v2-flash`

#### Tools Integration
- **SQL Tools**: DuckDB-based SQL execution (`run_sql_tool`)
- **Visualization**: Chart generation (`plot_tool`)
- **Data Management**: State tracking and file listing
- **Agent Communication**: Inter-agent tool delegation

#### Callback System
- Comprehensive logging for agent execution
- Before/after hooks for both agents and tools
- Enables monitoring and debugging

#### Output Schemas
- Structured data validation using Pydantic
- `visualizationSchema`: File names and descriptions
- `insightSchema`: Insights with evidence and visualizations
- `edaAgentOutputSchema`: Complete EDA report structure

### Data Flow
1. **Raw Data** → Schema understanding → Quality assessment → Cleaning
2. **Cleaned Data** → Question-specific preparation → Statistical analysis → Visualization
3. **Insights & Visualizations** → Executive report generation

### Agent Types
- **Agent**: Individual specialized agents with specific tools
- **SequentialAgent**: Orchestrates agents in strict sequence
- **LoopAgent**: (Available but not used in current implementation)

This architecture ensures systematic data processing, comprehensive analysis, and clear business storytelling while maintaining data integrity and reproducibility.