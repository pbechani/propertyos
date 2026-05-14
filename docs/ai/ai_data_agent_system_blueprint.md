# AI Data Agent System Blueprint

## Purpose

Create an AI system that allows users to ask questions in natural
language and automatically query databases.

Example: User: Which agent sold the most houses last year?

AI Agent workflow: 1. Discover relevant tables 2. Generate SQL query 3.
Execute query 4. Return explanation

------------------------------------------------------------------------

# 1. System Architecture

User ↓ AI Interface ↓ AI Gateway ↓ Agent Orchestrator ↓ Tool Registry ↓
Database Query Engine ↓ Data Sources

Components:

  Layer                Responsibility
  -------------------- ---------------------------
  User Interface       Chat or dashboard
  AI Gateway           Receives prompts
  Agent Orchestrator   Decides which agent runs
  Query Planner        Converts question → query
  Execution Engine     Runs database queries
  Response Formatter   Converts results to text

------------------------------------------------------------------------

# 2. Core Agents

## Data Discovery Agent

Purpose: Identify which tables contain relevant information.

Input: Which suburb has the highest house prices?

Output: - properties - transactions

------------------------------------------------------------------------

## Query Planner Agent

Creates a structured plan.

Example:

Step 1: find property prices\
Step 2: group by suburb\
Step 3: calculate average price\
Step 4: order descending

------------------------------------------------------------------------

## SQL Generator Agent

Creates SQL queries.

Example:

SELECT suburb, AVG(price) as avg_price FROM properties GROUP BY suburb
ORDER BY avg_price DESC LIMIT 5;

------------------------------------------------------------------------

## Execution Agent

Responsibilities: - Connect to database - Execute query - Return
results - Handle errors

------------------------------------------------------------------------

## Insight Agent

Explains results.

Example: Borrowdale has the highest average property price at \$425,000.

------------------------------------------------------------------------

# 3. AI Data Map Layer

Example schema map:

``` json
{
 "tables":[
  {
   "name":"properties",
   "description":"Real estate listings",
   "columns":[
    {"name":"id","type":"uuid"},
    {"name":"price","type":"number"},
    {"name":"suburb","type":"text"},
    {"name":"agent_id","type":"uuid"}
   ]
  },
  {
   "name":"transactions",
   "description":"Completed property sales",
   "columns":[
    {"name":"id","type":"uuid"},
    {"name":"property_id","type":"uuid"},
    {"name":"sale_price","type":"number"},
    {"name":"date","type":"date"}
   ]
  }
 ]
}
```

------------------------------------------------------------------------

# 4. Tool Registry

Example tools:

-   get_tables
-   get_table_schema
-   run_sql_query
-   get_sample_data
-   create_visualization

Tool format:

``` json
{
 "name":"run_sql_query",
 "description":"Execute SQL against database",
 "parameters":{
   "query":"string"
 }
}
```

------------------------------------------------------------------------

# 5. Query Execution Engine

Workflow:

Agent generates SQL\
↓\
SQL validator checks safety\
↓\
Execution engine runs query\
↓\
Results returned

------------------------------------------------------------------------

# 6. Agent Orchestration

Workflow:

User question\
↓\
Data Discovery Agent\
↓\
Query Planner Agent\
↓\
SQL Generator Agent\
↓\
Execution Agent\
↓\
Insight Agent\
↓\
Response

------------------------------------------------------------------------

# 7. Example Free Tech Stack

LLM Runtime: - Ollama - LM Studio

Recommended models: - llama3 - mistral - deepseek-coder

Agent Frameworks: - LangChain - CrewAI - LlamaIndex

Databases: - PostgreSQL - MySQL - SQLite

------------------------------------------------------------------------

# 8. Example Implementation

``` python
from crewai import Agent
from langchain.llms import Ollama

llm = Ollama(model="llama3")

query_agent = Agent(
 role="SQL Generator",
 goal="Generate correct SQL queries",
 backstory="Expert database engineer",
 llm=llm
)
```

------------------------------------------------------------------------

# 9. API Layer

Endpoints:

POST /ask-data\
GET /schema\
GET /query-history

Example:

POST /ask-data

{ "question":"Which agent closed the most deals?" }

------------------------------------------------------------------------

# 10. Frontend Interface

Suggested frameworks:

-   Next.js
-   Streamlit

Example UI:

Ask your data:

Average property price in Harare?

Result: Average price: \$185,000

------------------------------------------------------------------------

# 11. AI Command Center Dashboard

Admin features:

-   Agent activity
-   Query history
-   Data sources
-   Agent performance
-   Error logs

------------------------------------------------------------------------

# 12. Advanced Features

AI Query Caching\
AI Query Optimization\
Data Visualization\
Multi-database support

Possible sources: - Postgres - Supabase - MongoDB - APIs - CSV files

------------------------------------------------------------------------

# 13. Example Real Estate Queries

Which suburb has the fastest property price growth?\
Which agent sold the most houses?\
Average building cost per suburb\
Most active contractors

------------------------------------------------------------------------

# 14. Folder Structure

ai-data-agents/

agents/ - data_discovery_agent.py - query_planner_agent.py -
sql_generator_agent.py - insight_agent.py

tools/ - run_sql_query.py - get_schema.py

core/ - agent_orchestrator.py - query_engine.py

data/ - schema_map.json

api/ - ask_data_endpoint.py

frontend/ - dashboard

------------------------------------------------------------------------

# 15. Future Expansion

Possible AI workforce agents:

-   Finance Agent
-   Sales Agent
-   Construction Cost Agent
-   Market Analysis Agent
-   Fraud Detection Agent
