
# AI Query Planner + Execution Engine

## Purpose
The Query Planner is the brain that translates user intent into executable system actions. 
It decides **what needs to be done**, **which AI agents should do it**, and **in what order**.

The Execution Engine is responsible for **running the plan**, managing agent coordination, 
tracking progress, and handling errors.

---

## Core Responsibilities

### Query Planner
1. Interpret user requests using LLM intent classification.
2. Identify relevant domain entities.
3. Break requests into atomic tasks.
4. Select appropriate AI agents.
5. Construct an execution plan.

### Execution Engine
1. Dispatch tasks to agents.
2. Track execution state.
3. Handle retries and failures.
4. Aggregate outputs.
5. Return final results to the user.

---

## Architecture Layers

### 1. Input Layer
- Chat UI
- API Requests
- Dashboard commands
- Scheduled automation

### 2. Intent Understanding
- Natural Language Parser
- Intent Classifier
- Entity Extractor

### 3. Planning Engine
Produces a structured plan:

Example:

User Query:
"Find 5 houses under $200k and notify interested buyers"

Plan:
1. PropertySearchAgent.search()
2. RankingAgent.rank_results()
3. BuyerMatchingAgent.find_interested_buyers()
4. NotificationAgent.send_alerts()

---

### 4. Task Execution Layer

Each task contains:

{
  task_id,
  agent,
  action,
  parameters,
  dependencies
}

Execution states:

- queued
- running
- success
- failed
- retry

---

## Key Components

### Plan Generator
Transforms intent into a DAG (Directed Acyclic Graph).

### Task Dispatcher
Routes tasks to the correct AI agent.

### Execution Tracker
Maintains task lifecycle states.

### Result Aggregator
Combines results from multiple agents.

---

## Example Flow

User:
"Show me houses under $150k in Borrowdale."

Steps:

1. Query Planner identifies:
   - location
   - price
   - property search intent

2. Plan Generated

SearchAgent -> RankingAgent -> UIResponseAgent

3. Execution Engine runs tasks.

4. Results returned to dashboard.

---

## Benefits

- Modular AI architecture
- Fault tolerant execution
- Scalable task processing
- Easy to add new agents
