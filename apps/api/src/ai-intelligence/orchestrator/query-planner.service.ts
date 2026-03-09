import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// AI Query Planner
//
// Translates a user's natural-language query into an explicit ExecutionPlan —
// a Directed Acyclic Graph (DAG) of atomic tasks, each scoped to a specific
// agent and action.
//
// This layer makes intent VISIBLE and AUDITABLE.  Every query produces a plan
// object with:
//   • planId      — unique trace identifier
//   • intent      — human-readable description of what was understood
//   • confidence  — 0–1 score (1 = exact keyword, 0.3 = semantic fallback)
//   • tasks[]     — ordered list of tasks with agent/action assignments
//
// For the current MVP the planner uses deterministic rule-based matching
// (the same patterns as the existing queryAssistant service, now explicit).
// Post-MVP: the planner will call an LLM for true NL understanding and
// multi-step query decomposition.
// ─────────────────────────────────────────────────────────────────────────────

export type TaskStatus = 'queued' | 'running' | 'success' | 'failed' | 'skipped';

export type ExecutionTask = {
  taskId: string;
  /** Agent responsible for executing this task. */
  agentName: string;
  /** Action to invoke on the agent (maps to agent.execute(action, ...)). */
  action: string;
  /** Structured parameters extracted from the query. */
  params: Record<string, string>;
  /** taskIds that must complete successfully before this task runs. */
  dependencies: string[];
  status: TaskStatus;
  /** Populated by the orchestrator on completion. */
  result?: unknown;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
};

export type ExecutionPlan = {
  planId: string;
  /** Original user query. */
  query: string;
  /** Matched intent label. */
  intent: string;
  /** 0–1 confidence of the match. */
  confidence: number;
  tasks: ExecutionTask[];
  createdAt: Date;
};

/** Internal intent→agent routing entry. */
type IntentRoute = {
  /** Human-readable label for observability. */
  label: string;
  /** Confidence assigned when this route fires (1 = explicit, 0.7 = semantic). */
  confidence: number;
  /** Keyword patterns — the plan fires if the query matches ANY of these. */
  patterns: RegExp[];
  agentName: string;
  action: string;
  /** Optional params extractor from the normalised query. */
  paramsExtractor?: (q: string) => Record<string, string>;
};

@Injectable()
export class QueryPlannerService {
  /** Ordered routing table — first match wins for primary path. */
  private readonly routes: IntentRoute[] = [
    // ── Tasks ──────────────────────────────────────────────────────────────
    {
      label: 'overdue_tasks',
      confidence: 0.95,
      patterns: [/overdue\s+task|late\s+task|past\s+due|what.{0,10}missed|tasks\s+past\s+due/],
      agentName: 'TaskAgent',
      action: 'listOverdue',
    },
    {
      label: 'tasks_upcoming',
      confidence: 0.95,
      patterns: [/upcoming\s+task|tasks?\s+this\s+week|tasks?\s+due\s+(this|next)\s+week|due\s+soon/],
      agentName: 'TaskAgent',
      action: 'listUpcoming',
    },
    {
      label: 'tasks_high_priority',
      confidence: 0.95,
      patterns: [/high.{0,8}priority\s+task|urgent\s+task|important\s+task/],
      agentName: 'TaskAgent',
      action: 'listHighPriority',
    },
    {
      label: 'tasks_today',
      confidence: 0.9,
      patterns: [/tasks?\s+today|today.{0,8}task|my tasks?|pending\s+task/],
      agentName: 'TaskAgent',
      action: 'listToday',
    },
    {
      label: 'tasks_count',
      confidence: 0.9,
      patterns: [/how\s+many\s+tasks?|task\s+count|number\s+of\s+tasks?|total\s+tasks?/],
      agentName: 'TaskAgent',
      action: 'getCount',
    },
    // ── Fallback ────────────────────────────────────────────────────────────
    // Everything else is handled by the AIIntelligenceService semantic router
    // which has the full keyword/synonym matching logic.  The orchestrator
    // will detect 'agentName === FallbackRouter' and delegate accordingly.
  ];

  /**
   * Build an ExecutionPlan from a natural language query.
   *
   * @param query  The original user query (already validated + sanitised by
   *               AiGuardrailsService).
   * @param companyId  Used to scope any extracted entity params.
   */
  createPlan(query: string, companyId: string): ExecutionPlan {
    const planId = randomUUID();
    const q = query.toLowerCase().trim();

    for (const route of this.routes) {
      if (route.patterns.some((p) => p.test(q))) {
        const params = route.paramsExtractor ? route.paramsExtractor(q) : {};
        return {
          planId,
          query,
          intent: route.label,
          confidence: route.confidence,
          tasks: [
            {
              taskId: randomUUID(),
              agentName: route.agentName,
              action: route.action,
              params: { companyId, ...params },
              dependencies: [],
              status: 'queued',
            },
          ],
          createdAt: new Date(),
        };
      }
    }

    // Semantic fallback — the full keyword router in AIIntelligenceService
    return {
      planId,
      query,
      intent: 'semantic_fallback',
      confidence: 0.5,
      tasks: [
        {
          taskId: randomUUID(),
          agentName: 'FallbackRouter',
          action: 'route',
          params: { companyId, query },
          dependencies: [],
          status: 'queued',
        },
      ],
      createdAt: new Date(),
    };
  }

  /**
   * Build a multi-step plan for complex queries that require multiple agents.
   * Today every plan is single-task; this method is the hook for future
   * LLM-driven multi-agent decomposition.
   *
   * Example future use case:
   *   "Find my hot leads, find matching properties, and draft follow-up emails"
   *   → [LeadAgent.listHot, PropertyAgent.matchBuyer, DraftAgent.writeEmail]
   *      with task[2].dependencies = [task[0].taskId, task[1].taskId]
   */
  createMultiStepPlan(steps: Array<{ agentName: string; action: string; params?: Record<string, string>; dependsOn?: string[] }>): ExecutionPlan {
    const planId = randomUUID();
    const taskIds: string[] = steps.map(() => randomUUID());

    const tasks: ExecutionTask[] = steps.map((step, i) => ({
      taskId: taskIds[i],
      agentName: step.agentName,
      action: step.action,
      params: step.params ?? {},
      dependencies: (step.dependsOn ?? []).map((label) => {
        const depIdx = steps.findIndex((s) => s.action === label);
        return depIdx >= 0 ? taskIds[depIdx] : label;
      }),
      status: 'queued',
    }));

    return {
      planId,
      query: `[multi-step: ${steps.map((s) => `${s.agentName}.${s.action}`).join(' → ')}]`,
      intent: 'multi_step',
      confidence: 1,
      tasks,
      createdAt: new Date(),
    };
  }
}
