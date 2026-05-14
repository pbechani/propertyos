# AI Command Center
### Technical Architecture & Developer Guide
*Real Estate AI Platform | v2.0*

---

## Contents

1. [Overview and Philosophy](#1-overview-and-philosophy)
2. [Project File Structure](#2-project-file-structure)
3. [System Deep Dives](#3-system-deep-dives)
4. [How to Add a New Agent](#4-how-to-add-a-new-agent)
5. [Extending the System](#5-extending-the-system)
6. [Quick Reference](#6-quick-reference)

---

| System | Purpose |
|--------|---------|
| Query Planner + Execution Engine | Translates natural language into executable agent task graphs |
| Agent Workforce (11 agents) | Specialized AI agents across 4 functional groups |
| Agent Registry | Central catalog — versions, capabilities, SLAs |
| Permission Matrix | Per-agent tool access control |
| Event Bus | Async pub/sub communication between agents |
| Memory Architecture | Short-term, long-term, and working memory per agent |
| Workflow Orchestrator | Named multi-step workflow templates |
| Observability System | Logs, reasoning traces, API cost tracking |
| Safety & Guardrails | 8 rules: injection, PII, price anomaly, etc. |
| Command Interface | Natural language input layer + live insights feed |

---

## 1. Overview and Philosophy

The AI Command Center is a multi-agent orchestration platform built around one core idea: instead of one large AI model trying to do everything, a workforce of small, specialized agents collaborates through well-defined interfaces.

This architecture mirrors how real organizations work. A property search specialist doesn't also handle contract generation. A notification service doesn't need access to buyer financial data. Each agent has a clear role, a constrained set of tools, and a defined scope of authority.

### 1.1 Core Design Principles

- **Separation of concerns** — each agent owns exactly one domain of responsibility
- **Least privilege** — agents only have access to the tools they need (enforced by the Permission Matrix)
- **Observable by default** — every action is logged, traced, and cost-tracked
- **Safe by default** — every user input passes through the Safety layer before any agent sees it
- **Memory-aware** — agents learn from repeated interactions and carry context across tasks
- **Event-driven** — agents communicate asynchronously through the Event Bus, not by calling each other directly

### 1.2 Request Lifecycle

A user types a natural language command. Here is the complete journey from input to result:

1. **Safety layer** inspects the input for injection patterns, PII, anomalous prices, and hate speech
2. **Query Planner** calls the Claude API to parse intent, extract entities, select agents, and build a Directed Acyclic Graph (DAG) of tasks
3. **Execution Engine** walks the DAG, dispatching tasks to agents in dependency order, running parallel branches concurrently
4. Each **agent** executes, writes to its memory store, publishes events to the Event Bus, and emits observability traces
5. Results flow back through the Execution Engine, which aggregates outputs and surfaces insights to the UI
6. The UI navigates to the relevant view and displays the result

> **Note:** The Query Planner is the only component that calls the Claude API. All agents are deterministic mock executors in the current implementation, making the app predictable and cost-efficient for testing.

---

## 2. Project File Structure

The project uses Vite + React. Each file maps to one architectural layer:

| File | Architectural Layer | Responsibility |
|------|---------------------|----------------|
| `src/data.js` | Configuration | Agent definitions, permissions, mock database, workflow templates, safety rules, nav constants |
| `src/eventBus.js` | Event Bus | Publish/subscribe class. Agents publish events; other systems subscribe |
| `src/memory.js` | Memory Architecture | `MemoryStore` class with short-term, long-term, and working memory. One instance per agent |
| `src/observability.js` | Observability | `OBS` singleton — `log()`, `addTrace()`, `finishTrace()`, `recordCost()` |
| `src/safety.js` | Safety & Guardrails | `runGuardrails()` checks every command before planning. Maintains audit log |
| `src/planner.js` | Query Planner + Execution Engine | `runQueryPlanner()` calls Claude API. `runExecutionEngine()` dispatches the DAG |
| `src/agentExecutor.js` | Agent Workforce | `executeAgent()` — switch-case per agent with memory and observability hooks |
| `src/components.jsx` | Shared UI | `Pill`, `SCard`, `TaskRow`, `EventRow` — reusable primitives |
| `src/App.jsx` | Command Center UI | All 10 views. Subscribes to Event Bus, polls observability, handles commands and workflows |
| `src/main.jsx` | Entry Point | React root mount |
| `.env` | Configuration | `VITE_ANTHROPIC_API_KEY` |
| `vite.config.js` | Build | Vite + React plugin, dev server on port 3000 |

---

## 3. System Deep Dives

### 3.1 Query Planner

The Query Planner is the intelligence layer that bridges human language and machine execution. It lives in `src/planner.js` and makes a single call to the `claude-sonnet-4-20250514` API.

#### What it produces

The planner returns a structured JSON object with four parts:

- **`intent`** — a plain-English description of what the user wants
- **`entities`** — extracted parameters: `location`, `max_price`, `limit`, `beds`
- **`tasks`** — an ordered array of agent tasks, each with an `id`, `agent` name, `action`, `description`, and `deps` (dependency ids)
- **`reasoning`** — the planner's explanation of why it chose these agents

#### How the DAG works

The `deps` field on each task is the key to parallel execution. A task with an empty `deps` array can start immediately. A task with `deps: ["t1"]` must wait for task `t1` to complete before it begins. The Execution Engine walks this graph, dispatching every task whose dependencies are already satisfied.

Example — for the command *"Find 5 houses under $200k in Borrowdale and notify buyers"*:

| Task ID | Agent | Action | Depends On |
|---------|-------|--------|------------|
| t1 | PropertySearchAgent | search | — |
| t2 | RankingAgent | rank_results | t1 |
| t3 | BuyerMatchAgent | match | t2 |
| t4 | NotificationAgent | send_alerts | t3 |

#### System prompt strategy

The planner uses a tight, instruction-only system prompt. It names every available agent, states the dependency rules, and requires JSON-only output with no markdown. This produces reliable structured output suitable for machine parsing.

---

### 3.2 Execution Engine

The Execution Engine in `src/planner.js` is a recursive async dispatcher. It maintains two Sets — `executed` (completed task IDs) and `inProgress` (currently running task IDs) — and calls itself whenever a task completes, to check if any blocked tasks are now unblocked.

#### Task states

| State | Meaning |
|-------|---------|
| `queued` | Task exists in the plan but dependencies are not yet met |
| `running` | Task is currently being executed by its agent |
| `success` | Task completed. Result stored in `taskMap[id].result` |
| `failed` | Task threw an error. Failcount incremented on the agent. Error published to Event Bus |

#### Result passing

When a task completes, its result is stored in `taskMap`. The next task in the chain receives the previous task's result merged with the original plan entities as its parameters. This is how `PropertySearchAgent`'s property list flows automatically into `RankingAgent` without explicit wiring.

---

### 3.3 Agent Workforce

The platform ships with 11 agents across 4 groups. All agents are defined in `src/data.js` (metadata) and implemented in `src/agentExecutor.js` (behavior).

| Group | Agents |
|-------|--------|
| Property Intelligence | PropertySearchAgent, PropertyValuationAgent, RankingAgent |
| Buyer Intelligence | BuyerProfileAgent, BuyerMatchAgent, DemandAnalysisAgent |
| Transaction | OfferAnalysisAgent, NegotiationAgent |
| Operations | NotificationAgent, DocumentAgent, WorkflowAgent |

#### Agent definition fields (`src/data.js`)

| Field | Type | Purpose |
|-------|------|---------|
| `group` | string | Groups agents in the UI and Registry view |
| `color` | hex | Accent color used throughout the dashboard for this agent |
| `icon` | emoji | Visual identifier in task rows, agent cards, and memory view |
| `version` | string | Semver version shown in the Registry |
| `capabilities` | string[] | Human-readable list of what this agent can do |
| `sla_ms` | number | Target maximum execution time in milliseconds |

---

### 3.4 Permission Matrix

The Permission Matrix in `src/data.js` maps each agent to a set of tool permissions. This is enforced at the architecture level — no agent receives a tool it doesn't have permission to use.

Permission levels:

- **`read`** — agent can retrieve data from this source
- **`write`** — agent can modify data (pattern supported, not currently used)
- **`true`** — agent can trigger this capability (email, SMS, contracts, payments)
- **`null` / `false`** — access denied

> **Note:** In a production system, the Permission Matrix would be checked at runtime by a middleware layer before any tool call executes. The current structure makes that upgrade straightforward.

---

### 3.5 Event Bus

The Event Bus in `src/eventBus.js` implements the publish/subscribe pattern. Agents never call each other directly. Instead, each agent publishes a typed event when it completes meaningful work, and any system can subscribe.

This decoupling matters for three reasons:

1. Agents can be replaced or scaled independently without changing callers
2. New consumers (analytics, alerting) can subscribe without modifying the agent
3. The Events view gives a real-time audit trail of everything that happened

#### Published event types

| Event Type | Published By | Meaning |
|------------|-------------|---------|
| `property_found` | PropertySearchAgent | Search returned results |
| `properties_ranked` | RankingAgent | Properties scored and sorted |
| `buyers_matched` | BuyerMatchAgent | Buyers linked to properties |
| `properties_valued` | PropertyValuationAgent | Market valuations computed |
| `profiles_analyzed` | BuyerProfileAgent | Buyer profiles built |
| `demand_analyzed` | DemandAnalysisAgent | Market demand trends computed |
| `offer_analyzed` | OfferAnalysisAgent | Offer recommendation ready |
| `negotiation_planned` | NegotiationAgent | Negotiation strategy generated |
| `notifications_sent` | NotificationAgent | Buyer alerts dispatched |
| `document_generated` | DocumentAgent | Contract or report created |
| `task_started` | Execution Engine | Agent task began |
| `task_completed` | Execution Engine | Agent task succeeded |
| `task_failed` | Execution Engine | Agent task errored |
| `workflow_started` | Workflow Orchestrator | Named workflow began |
| `workflow_completed` | Workflow Orchestrator | Named workflow finished |
| `command_blocked` | Safety Layer | Input was rejected by guardrails |

---

### 3.6 Memory Architecture

Every agent has its own `MemoryStore` instance (`src/memory.js`). Memory has three tiers:

| Tier | Scope | Size Limit | Purpose |
|------|-------|------------|---------|
| Short-Term | Current session | 20 entries per agent | Stores recent task inputs and outputs |
| Long-Term | Persistent | 50 facts per agent | Stores learned facts, auto-promoted from short-term |
| Working | Current task | Unlimited keys | Key-value scratch space for the active task |

#### Memory consolidation

After every task, an agent calls `consolidate()`. This scans short-term entries for repeated patterns — for example, two or more searches for the same area — and promotes them to long-term memory as `location_preference` facts. This is how the system learns user behaviour over time.

In the **Memory** view, click any agent row after running a few commands to inspect all three memory tiers live.

---

### 3.7 Workflow Orchestrator

Workflows are predefined multi-step sequences stored in `WORKFLOW_TEMPLATES` in `src/data.js`. They run independently of the Query Planner — useful for recurring processes that don't need natural language parsing.

| ID | Name | Steps |
|----|------|-------|
| WF001 | Property Search Pipeline | Search → Rank → Match buyers → Notify |
| WF002 | Full Valuation Report | Search → Valuate → Generate document |
| WF003 | Buyer Demand Analysis | Profile buyers → Analyze demand → Rank opportunities |
| WF004 | Offer to Close | Analyze offer → Negotiate → Generate contract |

Workflows execute sequentially (one step at a time), unlike Query Planner tasks which can run in parallel. Each step updates the agent's `successCount`, publishes step events to the Event Bus, and appears in the live Workflow Runs panel.

---

### 3.8 Observability System

The `OBS` singleton in `src/observability.js` provides three observability primitives:

#### Structured logs
`OBS.log(level, source, message, meta)` appends a log entry with a timestamp, log level (`debug`, `info`, `warn`, `error`), source component name, and optional metadata. The Observability view displays the last 300 entries with colour-coded levels.

#### Reasoning traces
`OBS.addTrace(traceId, agentName, step, reasoning, duration)` builds a trace for each agent task — a sequence of named steps with reasoning and duration. Click any trace in the Observability view to expand it. This is the primary tool for debugging unexpected agent behaviour.

#### Cost tracking
`OBS.recordCost(source, tokensIn, tokensOut)` calculates Claude API cost using current pricing (**$3.00 per million input tokens**, **$15.00 per million output tokens** for `claude-sonnet-4`) and accumulates totals.

---

### 3.9 Safety and Guardrails Layer

Every command runs through `runGuardrails()` in `src/safety.js` before reaching the Query Planner. Returns `{ ok, score, results }`.

| Rule ID | Name | Severity | What it checks |
|---------|------|----------|----------------|
| G001 | PII Scrub | critical | SSN patterns `###-##-####` and 16-digit card numbers |
| G002 | Prompt Inject | critical | Phrases like `ignore previous instructions`, `system prompt` |
| G003 | Price Sanity | warning | Prices outside $10k–$10M flagged as anomalous |
| G004 | SQL Injection | critical | Patterns like `DROP TABLE`, `DELETE FROM` |
| G005 | Rate Limit | warning | Architecture support — enforced at application layer |
| G006 | Data Scope | critical | Agents only see data allowed by the Permission Matrix |
| G007 | Output Filter | warning | Strips sensitive fields before displaying agent output |
| G008 | Hate Speech | critical | Blocks harmful or discriminatory content |

The **Safety** view records every check with its score, input fragment, verdicts, and timestamp. Try typing `drop table users` to see a live BLOCK result.

---

## 4. How to Add a New Agent

Adding an agent requires changes to four files. The steps below use a concrete example: a new `PriceTrendAgent` that analyses how property prices in an area have changed over time.

### Step 1 — Define the agent in `src/data.js`

Add an entry to `AGENT_DEFS`:

```js
PriceTrendAgent: {
  group:        'Property Intelligence',
  color:        '#06b6d4',
  icon:         '📉',
  version:      '1.0.0',
  capabilities: ['property_db_read', 'time_series_analysis', 'trend_model'],
  sla_ms:       3500,
},
```

Add an entry to `PERMISSIONS`. Only grant what this agent genuinely needs:

```js
PriceTrendAgent: {
  property_db: 'read',
  buyer_db:    null,
  email:       false,
  sms:         false,
  contracts:   false,
  payments:    false,
},
```

### Step 2 — Implement the agent in `src/agentExecutor.js`

Add a case to the switch statement inside `executeAgent()`:

```js
case 'PriceTrendAgent': {
  const area = parameters?.location || 'Borrowdale';
  // Query your data source here
  const trend = {
    area,
    sixMonthChange: '+4.2%',
    avgPrice: 156000,
    dataPoints: 6,
  };
  result = { trend };

  // Write to memory
  mem.writeShortTerm({ action, area, trend: trend.sixMonthChange });
  mem.writeLongTerm({ key: `trend_${area}`, value: trend });

  // Emit a trace step
  OBS.addTrace(traceId, agentName, 'trend_model',
    `Computed 6-month trend for ${area}: ${trend.sixMonthChange}`, 300);

  // Publish an event
  bus.publish('price_trend_computed', { area, trend, taskId });
  break;
}
```

### Step 3 — Teach the Query Planner about the new agent

Open `src/planner.js` and add `PriceTrendAgent` to the `Available agents` list in `PLANNER_SYSTEM`:

```
Available agents: PropertySearchAgent, PropertyValuationAgent,
RankingAgent, BuyerProfileAgent, BuyerMatchAgent, DemandAnalysisAgent,
OfferAnalysisAgent, NegotiationAgent, NotificationAgent,
DocumentAgent, PriceTrendAgent
```

Also add a usage rule:

```
- PriceTrendAgent analyses historical price movements for a location.
  Use it when the user asks about price changes, trends, or history.
```

### Step 4 — Register an Event Bus type *(optional)*

No code change is required — the bus is dynamic. Document the new event type in your notes and add any subscribers that need to react to it.

### Step 5 — Add a Workflow that uses it *(optional)*

In `src/data.js`, add a new entry to `WORKFLOW_TEMPLATES`:

```js
{
  id:    'WF005',
  name:  'Market Trend Report',
  desc:  'Trend analysis + valuation + document',
  color: '#06b6d4',
  steps: [
    { agent: 'PriceTrendAgent',        action: 'analyse_trends' },
    { agent: 'PropertyValuationAgent', action: 'valuate' },
    { agent: 'DocumentAgent',          action: 'generate' },
  ],
},
```

> **Checklist:** `src/data.js` → AGENT_DEFS + PERMISSIONS · `src/agentExecutor.js` → add case · `src/planner.js` → add agent to system prompt · *(optional)* `src/data.js` → add workflow template

---

## 5. Extending the System

### 5.1 Connecting a Real Database

The mock database lives in `src/data.js` as `PROPERTIES` and `BUYERS` arrays. To connect a real database, replace the switch-case logic in `src/agentExecutor.js` with actual API calls:

```js
case 'PropertySearchAgent': {
  const res  = await fetch(`/api/properties?max_price=${parameters.max_price}`);
  const data = await res.json();
  result = { properties: data.results, count: data.total };
  // ... memory and observability hooks unchanged
}
```

> Keep the memory writes and `OBS` traces in place. The observability value comes from instrumenting real calls, not just mock ones.

### 5.2 Giving Agents Their Own Claude Reasoning Step

The Query Planner already calls the real Claude API. To give individual agents their own reasoning, add a Claude call inside `executeAgent()`:

```js
case 'OfferAnalysisAgent': {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: { 'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY, ... },
    body: JSON.stringify({
      model:    'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: `Analyse this offer: ${JSON.stringify(parameters)}` }]
    })
  });
  const d      = await resp.json();
  const tokIn  = d.usage.input_tokens;
  const tokOut = d.usage.output_tokens;
  OBS.recordCost('OfferAnalysisAgent', tokIn, tokOut); // Always track cost
  result = JSON.parse(d.content[0].text);
}
```

### 5.3 Adding a New Dashboard View

Add an entry to the `NAV` array in `src/data.js`:

```js
{ id: 'analytics', icon: '📊', label: 'Analytics' },
```

Then add a conditional block in `App.jsx`:

```jsx
{view === 'analytics' && <>
  {/* your view content */}
</>}
```

### 5.4 Persisting Memory Across Sessions

The current `MemoryStore` lives in JavaScript module scope and is lost on page reload. To persist long-term memory:

```js
// In writeLongTerm():
localStorage.setItem(
  `agent_ltm_${this.agentName}`,
  JSON.stringify(this.longTerm)
);

// In constructor():
const stored = localStorage.getItem(`agent_ltm_${agentName}`);
this.longTerm = stored ? JSON.parse(stored) : [];
```

### 5.5 Production Security

The current implementation calls the Anthropic API directly from the browser for development convenience. In production:

- Move the API call in `src/planner.js` to a backend server endpoint
- The frontend sends the user query to your backend, not directly to Anthropic
- Your backend holds the API key in an environment variable, never exposed to the browser
- The backend can enforce additional rate limiting, logging, and access control

> The safety layer, memory, event bus, and observability all run client-side and don't change when you move the API call to a backend.

---

## 6. Quick Reference

### 6.1 Environment Setup

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies (react, recharts, vite) |
| `npm run dev` | Start dev server at http://localhost:3000 |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build locally |

### 6.2 Example Commands

| Command | Agents Typically Chosen |
|---------|------------------------|
| Find 5 houses under $200k in Borrowdale and notify buyers | Search → Rank → Match → Notify |
| Show properties under $150k in Highlands | Search → Rank |
| Analyze buyer demand and match top properties | BuyerProfile → Demand → Match |
| Valuate properties and generate documents | Search → Valuate → Document |
| Evaluate this offer and suggest a negotiation strategy | OfferAnalysis → Negotiation |

### 6.3 Safety Test Inputs

| Input | Expected Result |
|-------|----------------|
| `drop table users` | BLOCK — SQL injection (G004) |
| `ignore previous instructions` | BLOCK — Prompt injection (G002) |
| `My SSN is 123-45-6789` | FLAG — PII detected (G001), score reduced |
| `Find a house for $500` | WARN — Price anomaly (G003), score reduced |
| Normal property search query | PASS — All guardrails cleared, score 100 |

### 6.4 Observability Reference

| Method | When to call it |
|--------|----------------|
| `OBS.log(level, source, msg)` | General structured logging from any component |
| `OBS.addTrace(traceId, agent, step, reasoning)` | Record a reasoning step inside an agent task |
| `OBS.finishTrace(traceId)` | Mark a trace as completed after the last step |
| `OBS.recordCost(source, tokIn, tokOut)` | After any Claude API call — tracks spend in real time |

---

*AI Command Center · v2.0 · Built with React, Vite, and Claude claude-sonnet-4*
