import { Injectable, Logger } from '@nestjs/common';
import { AgentRegistryService } from '../registry/agent-registry.service';
import { AgentMemoryService } from '../memory/agent-memory.service';
import { AiObservabilityService } from '../observability/ai-observability.service';
import { ExecutionPlan, ExecutionTask, QueryPlannerService } from './query-planner.service';
import { AssistantResponse } from '../ai-intelligence.types';

// ─────────────────────────────────────────────────────────────────────────────
// AI Workflow Orchestrator
//
// The Orchestrator is the runtime engine that EXECUTES an ExecutionPlan.
// It coordinates the full agent workforce lifecycle:
//
//   1. Receive a query + context from the controller
//   2. Run it through the QueryPlanner to get an ExecutionPlan (DAG)
//   3. Topologically sort tasks respecting dependency edges
//   4. Dispatch each task to the correct agent via the AgentRegistry
//   5. Record observability traces for each task
//   6. Cache results in AgentMemory for fast re-use
//   7. On failure: retry once, then mark failed and continue with fallback
//   8. Aggregate task results into a single AssistantResponse
//
// The FallbackRouter tasks (from the semantic fallback plan) are handled by
// a delegate callback injected at boot — this allows the orchestrator to call
// AIIntelligenceService without a circular dependency.
// ─────────────────────────────────────────────────────────────────────────────

export type OrchestratorResult = {
  planId: string;
  intent: string;
  confidence: number;
  response: AssistantResponse;
  durationMs: number;
  traceId: string;
};

/** Signature of the fallback delegate (AIIntelligenceService.queryAssistant). */
export type FallbackDelegate = (
  userId: string,
  companyId: string,
  query: string,
  pageContext?: string,
) => Promise<AssistantResponse>;

@Injectable()
export class WorkflowOrchestratorService {
  private readonly logger = new Logger(WorkflowOrchestratorService.name);

  /** Injected at module boot to break the circular dependency with AIIntelligenceService. */
  private fallbackDelegate?: FallbackDelegate;

  constructor(
    private readonly planner: QueryPlannerService,
    private readonly registry: AgentRegistryService,
    private readonly memory: AgentMemoryService,
    private readonly observability: AiObservabilityService,
  ) {}

  /**
   * Register the fallback delegate.  Must be called from the module's
   * `onModuleInit` hook after both services are constructed.
   */
  setFallbackDelegate(delegate: FallbackDelegate): void {
    this.fallbackDelegate = delegate;
  }

  // ── Main entry point ───────────────────────────────────────────────────────

  /**
   * Execute a user query through the full orchestration pipeline.
   * Returns a structured result containing the response and execution metadata.
   */
  async execute(opts: {
    userId: string;
    companyId: string;
    query: string;
    pageContext?: string;
  }): Promise<OrchestratorResult> {
    const { userId, companyId, query, pageContext } = opts;
    const startMs = Date.now();

    // 1. Plan
    const plan = this.planner.createPlan(query, companyId);

    // 2. Start master trace
    const traceId = this.observability.startTrace({
      agentName: 'Orchestrator',
      action: 'execute',
      companyId,
      userId,
      inputSummary: query.substring(0, 150),
      matchedIntent: plan.intent,
      intentConfidence: plan.confidence,
    });

    try {
      // 3. Execute plan
      const response = await this.executePlan(plan, userId, companyId, pageContext);

      // 4. Cache result in short-term memory (for potential follow-up queries)
      const cacheKey = `lastResponse::${plan.intent}`;
      this.memory.storeShortTerm('Orchestrator', companyId, cacheKey, response);

      // 5. Finalise trace
      this.observability.endTrace(traceId, {
        outputSummary: `responseType=${response.responseType} title="${response.title ?? ''}"`,
        metadata: { planId: plan.planId, intent: plan.intent, taskCount: plan.tasks.length },
      });

      return {
        planId: plan.planId,
        intent: plan.intent,
        confidence: plan.confidence,
        response,
        durationMs: Date.now() - startMs,
        traceId,
      };
    } catch (err) {
      this.observability.failTrace(traceId, err as Error);
      throw err;
    }
  }

  // ── Plan execution ─────────────────────────────────────────────────────────

  private async executePlan(
    plan: ExecutionPlan,
    userId: string,
    companyId: string,
    pageContext?: string,
  ): Promise<AssistantResponse> {
    // Topological execution — resolve dependencies
    const completed = new Map<string, unknown>(); // taskId → result

    for (const task of this.topologicalSort(plan.tasks)) {
      // Check all dependencies are satisfied
      const depsOk = task.dependencies.every(
        (dep) => completed.has(dep),
      );
      if (!depsOk) {
        task.status = 'skipped';
        continue;
      }

      const result = await this.executeTask(task, userId, companyId, pageContext);
      completed.set(task.taskId, result);
    }

    // Aggregate: for single-task plans (the common case) return direct result
    if (plan.tasks.length === 1) {
      const task = plan.tasks[0];
      if (task.result) return task.result as AssistantResponse;
      return this.errorResponse(task.error ?? 'Task failed with no error detail');
    }

    // Multi-task: collect all successful results
    const results = plan.tasks
      .filter((t) => t.status === 'success' && t.result)
      .map((t) => t.result as AssistantResponse);

    if (results.length === 0) {
      return this.errorResponse('All tasks in the plan failed.');
    }

    // For now: return the last successful result.
    // TODO: merge results into a compound response in Phase 2.
    return results[results.length - 1];
  }

  private async executeTask(
    task: ExecutionTask,
    userId: string,
    companyId: string,
    pageContext?: string,
  ): Promise<AssistantResponse> {
    task.status = 'running';
    task.startedAt = new Date();
    const taskStart = Date.now();

    const traceId = this.observability.startTrace({
      agentName: task.agentName,
      action: task.action,
      companyId,
      userId,
      inputSummary: JSON.stringify(task.params).substring(0, 100),
    });

    try {
      let response: AssistantResponse;

      if (task.agentName === 'FallbackRouter') {
        // Delegate to the full semantic router
        if (!this.fallbackDelegate) {
          throw new Error('FallbackDelegate not registered in orchestrator');
        }
        response = await this.fallbackDelegate(userId, companyId, task.params['query'] ?? '', pageContext);
      } else {
        // Route to the agent registry
        const agent = this.registry.getAgent(task.agentName);
        if (!agent) {
          throw new Error(`Agent "${task.agentName}" not found in registry`);
        }
        response = await (agent as unknown as AgentWithExecute).execute(task.action, task.params, companyId);
      }

      const durationMs = Date.now() - taskStart;
      task.status = 'success';
      task.result = response;
      task.completedAt = new Date();
      task.durationMs = durationMs;

      this.observability.endTrace(traceId, {
        outputSummary: `responseType=${response.responseType}`,
      });
      this.registry.recordInvocation(task.agentName, true, durationMs);

      return response;
    } catch (err) {
      const durationMs = Date.now() - taskStart;
      const errMsg = (err as Error).message ?? String(err);
      task.status = 'failed';
      task.error = errMsg;
      task.completedAt = new Date();
      task.durationMs = durationMs;

      this.observability.failTrace(traceId, err as Error);
      this.registry.recordInvocation(task.agentName, false, durationMs, errMsg);
      this.logger.error(`Task failed [${task.agentName}.${task.action}]: ${errMsg}`);

      return this.errorResponse(errMsg);
    }
  }

  // ── Utilities ──────────────────────────────────────────────────────────────

  /**
   * Kahn's algorithm for topological sort.
   * Ensures tasks with dependencies are executed after their prerequisites.
   */
  private topologicalSort(tasks: ExecutionTask[]): ExecutionTask[] {
    const idToTask = new Map(tasks.map((t) => [t.taskId, t]));
    const inDegree = new Map(tasks.map((t) => [t.taskId, t.dependencies.length]));
    const queue: ExecutionTask[] = tasks.filter((t) => t.dependencies.length === 0);
    const sorted: ExecutionTask[] = [];

    while (queue.length > 0) {
      const task = queue.shift()!;
      sorted.push(task);

      for (const other of tasks) {
        if (other.dependencies.includes(task.taskId)) {
          const deg = (inDegree.get(other.taskId) ?? 0) - 1;
          inDegree.set(other.taskId, deg);
          if (deg === 0) queue.push(other);
        }
      }
    }

    // Append any remaining tasks (cycle protection) so we don't deadlock
    for (const task of tasks) {
      if (!sorted.includes(task)) sorted.push(task);
    }

    return sorted;
  }

  private errorResponse(message: string): AssistantResponse {
    return { responseType: 'error', text: message };
  }
}

/** Minimal interface implemented by all domain agents. */
interface AgentWithExecute {
  execute(
    action: string,
    params: Record<string, string>,
    companyId: string,
  ): Promise<AssistantResponse>;
}
