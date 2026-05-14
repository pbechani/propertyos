import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { CompanyAdminGuard } from '../identity/companies/guards/company-admin.guard';
import { AIIntelligenceService } from './ai-intelligence.service';
import { AgentRegistryService } from './registry/agent-registry.service';
import { AgentMemoryService } from './memory/agent-memory.service';
import { AiObservabilityService } from './observability/ai-observability.service';
import { WorkflowOrchestratorService } from './orchestrator/workflow-orchestrator.service';

class AssistantQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  query!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  pageContext?: string;
}

import { AuthRequest } from '../common/types';

/** Static guardrail rules derived from AiGuardrailsService definitions. */
const SAFETY_RULES = [
  { id: 'G001', name: 'PII Detection', description: 'Scans inputs for SA ID numbers, credit cards, email addresses, and phone numbers', severity: 'high', enabled: true },
  { id: 'G002', name: 'Prompt Injection', description: 'Detects "ignore previous instructions" and similar adversarial patterns (OWASP LLM01)', severity: 'critical', enabled: true },
  { id: 'G003', name: 'Input Length Limit', description: 'Rejects queries exceeding 1000 characters to prevent context-flooding DoS attacks', severity: 'medium', enabled: true },
  { id: 'G004', name: 'Content Policy', description: 'Blocks queries related to hacking, exploitation, credentials, and malicious tooling', severity: 'high', enabled: true },
  { id: 'G005', name: 'Per-User Rate Limit', description: 'Enforces a per-user AI query limit of 120 queries per hour', severity: 'medium', enabled: true },
  { id: 'G006', name: 'Output Schema Validation', description: 'Ensures agent responses conform to the AssistantResponse contract before delivery', severity: 'medium', enabled: true },
  { id: 'G007', name: 'SQL / XSS Injection', description: 'Detects SQL injection and cross-site scripting patterns embedded in AI queries', severity: 'critical', enabled: true },
  { id: 'G008', name: 'Hate Speech Filter', description: 'Blocks harmful, hateful, or abusive content in AI interactions', severity: 'high', enabled: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// AI Intelligence controller  — /api/v1/ai-intelligence
// ─────────────────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard)
@Controller('ai-intelligence')
export class AIIntelligenceController {
  constructor(
    private readonly aiService: AIIntelligenceService,
    private readonly registry: AgentRegistryService,
    private readonly memory: AgentMemoryService,
    private readonly observability: AiObservabilityService,
    private readonly orchestrator: WorkflowOrchestratorService,
  ) {}

  // ── Core AI endpoints ──────────────────────────────────────────────────────

  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    const { sub, roles, active_company_id } = req.user;
    return this.aiService.getDashboard(sub, roles, active_company_id ?? '');
  }

  @Post('assistant')
  queryAssistant(@Request() req: AuthRequest, @Body() body: AssistantQueryDto) {
    const { sub, active_company_id } = req.user;
    return this.aiService.queryAssistant(sub, active_company_id ?? '', body.query, body.pageContext);
  }

  /**
   * Orchestrated assistant — runs through the full orchestration pipeline.
   * Returns the response PLUS execution metadata (planId, intent, confidence).
   */
  @Post('assistant/orchestrated')
  orchestratedAssistant(@Request() req: AuthRequest, @Body() body: AssistantQueryDto) {
    const { sub, active_company_id } = req.user;
    return this.orchestrator.execute({
      userId: sub,
      companyId: active_company_id ?? '',
      query: body.query,
      pageContext: body.pageContext,
    });
  }

  // ── Agent Registry endpoints ───────────────────────────────────────────────

  /** List all registered AI agents and their current status. */
  @Get('agents')
  listAgents() {
    return {
      agents: this.registry.listDescriptors(),
      health: this.registry.getHealth(),
    };
  }

  // ── Observability endpoints ────────────────────────────────────────────────

  /** Recent execution traces for the authenticated user's company. */
  @Get('observability/traces')
  getTraces(
    @Request() req: AuthRequest,
    @Query('limit') limit?: string,
  ) {
    const companyId = req.user.active_company_id ?? '';
    return this.observability.getRecentTraces({
      companyId,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  /** Aggregated AI usage metrics for the Command Center dashboard. */
  @Get('observability/metrics')
  getMetrics(@Request() req: AuthRequest) {
    const companyId = req.user.active_company_id ?? '';
    return this.observability.getMetrics(companyId);
  }

  // ── Admin Command Center endpoints (Company Admin only) ────────────────────

  /**
   * Unified overview for the AI Command Center.
   * Returns agent health, memory store sizes, and observability metrics in one call.
   */
  @UseGuards(CompanyAdminGuard)
  @Get('command-center/overview')
  getCommandCenterOverview(@Request() req: AuthRequest) {
    const companyId = req.user.active_company_id ?? '';
    return {
      agents: this.registry.listDescriptors(),
      health: this.registry.getHealth(),
      metrics: this.observability.getMetrics(companyId),
      memorySizes: this.memory.getStoreSizes(),
    };
  }

  /** Pause a named agent (admin only). */
  @UseGuards(CompanyAdminGuard)
  @Post('agents/:name/pause')
  pauseAgent(@Param('name') name: string) {
    this.registry.pauseAgent(name);
    return { name, status: 'paused' };
  }

  /** Resume a paused agent (admin only). */
  @UseGuards(CompanyAdminGuard)
  @Post('agents/:name/resume')
  resumeAgent(@Param('name') name: string) {
    this.registry.resumeAgent(name);
    return { name, status: 'active' };
  }

  /** List all active safety guardrail rules (admin only). */
  @UseGuards(CompanyAdminGuard)
  @Get('safety/rules')
  getSafetyRules() {
    return SAFETY_RULES;
  }
}

