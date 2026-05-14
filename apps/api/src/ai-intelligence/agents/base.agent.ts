// ─────────────────────────────────────────────────────────────────────────────
// Base Agent
//
// All AI agents extend this class.  It enforces the tool permission matrix —
// each agent declares which tools it is allowed to use, and any attempt to
// invoke a disallowed tool raises an error before the DB call is made.
//
// Every agent also declares:
//   • description   — one-line human-readable purpose (shown in the registry)
//   • capabilities  — semantic tags used by the registry for agent discovery
//   • actions       — the action strings the agent's execute() method handles
//
// These metadata properties are consumed by:
//   AgentRegistryService  — for routing and Command Center display
//   WorkflowOrchestratorService — for task dispatch
// ─────────────────────────────────────────────────────────────────────────────

/** Fine-grained tool permissions from the Agent Tool Permission Matrix. */
export type ToolPermission =
  | 'leads:read'
  | 'tasks:read'
  | 'properties:read'
  | 'viewings:read'
  | 'activity:read'
  | 'analytics:read';

export abstract class BaseAgent {
  /** Display name used in logs, execution plan traces, and the registry. */
  abstract readonly agentName: string;

  /** One-line description surfaced in the AI Command Center dashboard. */
  abstract readonly description: string;

  /**
   * Semantic capability tags.  The AgentRegistry uses these for capability-
   * based routing: `registry.getCapableAgent('task_management')`.
   */
  abstract readonly capabilities: readonly string[];

  /**
   * Action identifiers handled by this agent's `execute()` method.
   * The QueryPlanner and Orchestrator use these for action → agent routing.
   */
  abstract readonly actions: readonly string[];

  /** Declared tool permissions — agents may only call tools listed here. */
  abstract readonly allowedTools: ReadonlySet<ToolPermission>;

  /**
   * Asserts that the agent holds the required tool permission.
   * Throws if the agent tries to exceed its declared permissions.
   */
  protected assertPermission(tool: ToolPermission): void {
    if (!this.allowedTools.has(tool)) {
      throw new Error(
        `Agent "${this.agentName}" does not have permission to use tool "${tool}". ` +
          `Allowed tools: [${[...this.allowedTools].join(', ')}]`,
      );
    }
  }

  /** Utility: format a number as ZAR currency string. */
  protected fmtZar(n: number): string {
    if (n >= 1_000_000) return `R${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `R${(n / 1_000).toFixed(0)}K`;
    return n > 0 ? `R${n.toLocaleString()}` : '—';
  }

  /** Utility: format a date as a human-readable relative time string. */
  protected relativeTime(date: Date | string): string {
    const hours = Math.floor((Date.now() - new Date(date).getTime()) / 3_600_000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  }
}
