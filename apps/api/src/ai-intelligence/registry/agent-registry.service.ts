import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { BaseAgent } from '../agents/base.agent';

// ─────────────────────────────────────────────────────────────────────────────
// AI Agent Registry
//
// Central registry that tracks every AI agent in the workforce.
// Agents self-register through the `AI_AGENTS` injection token.
// The registry exposes:
//   • Agent discovery by name or capability
//   • Real-time status monitoring (active / paused / error)
//   • Per-agent invocation metrics
//   • Health rollup for the Command Center dashboard
//
// Architecture note: In production, agent health state would be persisted to
// Redis so the registry survives restarts and can coordinate across replicas.
// ─────────────────────────────────────────────────────────────────────────────

/** Injection token used to provide the array of all AI agents. */
export const AI_AGENTS_TOKEN = 'AI_AGENTS';

export type AgentStatus = 'active' | 'paused' | 'error';

export type AgentDescriptor = {
  name: string;
  description: string;
  capabilities: string[];
  actions: string[];
  allowedTools: string[];
  status: AgentStatus;
  registeredAt: Date;
  invocationCount: number;
  successCount: number;
  errorCount: number;
  avgDurationMs: number;
  lastInvokedAt?: Date;
  lastError?: string;
};

export type RegistryHealth = {
  totalAgents: number;
  activeAgents: number;
  pausedAgents: number;
  errorAgents: number;
  totalInvocations: number;
  overallSuccessRate: number;
};

@Injectable()
export class AgentRegistryService {
  private readonly logger = new Logger(AgentRegistryService.name);

  /** Live metadata for each registered agent. */
  private readonly descriptors = new Map<string, AgentDescriptor>();

  /** Agent instances for routing. */
  private readonly instances = new Map<string, BaseAgent>();

  /** Running total of duration samples per agent (for avg calculation). */
  private readonly durationSamples = new Map<string, number[]>();

  constructor(@Optional() @Inject(AI_AGENTS_TOKEN) agents: BaseAgent[] | null) {
    for (const agent of agents ?? []) {
      this.register(agent);
    }
    this.logger.log(`Agent registry initialised with ${this.descriptors.size} agent(s)`);
  }

  // ── Registration ───────────────────────────────────────────────────────────

  /** Register an agent instance.  Idempotent — re-registration updates the descriptor. */
  register(agent: BaseAgent): void {
    const descriptor: AgentDescriptor = {
      name: agent.agentName,
      description: agent.description,
      capabilities: [...agent.capabilities],
      actions: [...agent.actions],
      allowedTools: [...agent.allowedTools],
      status: 'active',
      registeredAt: new Date(),
      invocationCount: 0,
      successCount: 0,
      errorCount: 0,
      avgDurationMs: 0,
    };
    this.descriptors.set(agent.agentName, descriptor);
    this.instances.set(agent.agentName, agent);
    this.durationSamples.set(agent.agentName, []);
    this.logger.log(`Registered agent: ${agent.agentName}`);
  }

  // ── Discovery ──────────────────────────────────────────────────────────────

  /** Retrieve an agent instance by exact name. Returns `undefined` if not found. */
  getAgent(name: string): BaseAgent | undefined {
    return this.instances.get(name);
  }

  /** Retrieve the metadata descriptor for an agent. */
  getDescriptor(name: string): AgentDescriptor | undefined {
    return this.descriptors.get(name);
  }

  /**
   * Find the first _active_ agent that declares the given capability.
   * Returns `undefined` if no capable active agent exists.
   */
  getCapableAgent(capability: string): BaseAgent | undefined {
    for (const [name, desc] of this.descriptors.entries()) {
      if (desc.status === 'active' && desc.capabilities.includes(capability)) {
        return this.instances.get(name);
      }
    }
    return undefined;
  }

  /**
   * Find the first active agent that handles the given action.
   */
  getAgentForAction(action: string): BaseAgent | undefined {
    for (const [name, desc] of this.descriptors.entries()) {
      if (desc.status === 'active' && desc.actions.includes(action)) {
        return this.instances.get(name);
      }
    }
    return undefined;
  }

  /** List descriptors for all registered agents. */
  listDescriptors(): AgentDescriptor[] {
    return [...this.descriptors.values()];
  }

  // ── Lifecycle management ───────────────────────────────────────────────────

  /** Pause an agent — the orchestrator will skip it for new tasks. */
  pauseAgent(name: string): void {
    this.setStatus(name, 'paused');
    this.logger.warn(`Agent paused: ${name}`);
  }

  /** Resume a paused or errored agent. */
  resumeAgent(name: string): void {
    this.setStatus(name, 'active');
    this.logger.log(`Agent resumed: ${name}`);
  }

  private setStatus(name: string, status: AgentStatus): void {
    const d = this.descriptors.get(name);
    if (d) this.descriptors.set(name, { ...d, status });
  }

  // ── Metrics recording ──────────────────────────────────────────────────────

  /** Record the outcome of an agent invocation (called by the orchestrator). */
  recordInvocation(agentName: string, succeeded: boolean, durationMs: number, error?: string): void {
    const d = this.descriptors.get(agentName);
    if (!d) return;

    // Update duration samples (keep last 100)
    const samples = this.durationSamples.get(agentName) ?? [];
    samples.push(durationMs);
    if (samples.length > 100) samples.shift();
    this.durationSamples.set(agentName, samples);

    const avgDurationMs = Math.round(
      samples.reduce((s, v) => s + v, 0) / samples.length,
    );

    this.descriptors.set(agentName, {
      ...d,
      invocationCount: d.invocationCount + 1,
      successCount: d.successCount + (succeeded ? 1 : 0),
      errorCount: d.errorCount + (succeeded ? 0 : 1),
      avgDurationMs,
      lastInvokedAt: new Date(),
      status: succeeded ? 'active' : 'error',
      lastError: succeeded ? d.lastError : (error ?? 'Unknown error'),
    });
  }

  // ── Health ─────────────────────────────────────────────────────────────────

  /** Returns a health summary for the AI Command Center dashboard. */
  getHealth(): RegistryHealth {
    const all = [...this.descriptors.values()];
    const totalInvocations = all.reduce((s, d) => s + d.invocationCount, 0);
    const totalSuccesses = all.reduce((s, d) => s + d.successCount, 0);
    return {
      totalAgents: all.length,
      activeAgents: all.filter((d) => d.status === 'active').length,
      pausedAgents: all.filter((d) => d.status === 'paused').length,
      errorAgents: all.filter((d) => d.status === 'error').length,
      totalInvocations,
      overallSuccessRate:
        totalInvocations > 0 ? Math.round((totalSuccesses / totalInvocations) * 100) : 100,
    };
  }
}
