import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database';
import { AssistantResponse } from '../ai-intelligence.types';
import { BaseAgent, ToolPermission } from './base.agent';

// ─────────────────────────────────────────────────────────────────────────────
// DemandAnalysisAgent
// Analyses buyer demand trends across pipeline stages, budget ranges, and
// lead temperature to surface market-level signals.
// Tool permissions: leads:read, analytics:read
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class DemandAnalysisAgent extends BaseAgent {
  readonly agentName = 'DemandAnalysisAgent';
  readonly description = 'Analyses buyer demand trends, pipeline stage distribution, and budget segments.';
  readonly capabilities = ['buyer_db_read', 'trend_analysis'] as const;
  readonly actions = ['analyzeStages', 'analyzeTrends', 'budgetDistribution'] as const;
  readonly allowedTools: ReadonlySet<ToolPermission> = new Set(['leads:read', 'analytics:read']);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    action: string,
    _params: Record<string, string>,
    companyId: string,
  ): Promise<AssistantResponse> {
    switch (action) {
      case 'analyzeStages':       return this.analyzeStages(companyId);
      case 'analyzeTrends':       return this.analyzeTrends(companyId);
      case 'budgetDistribution':  return this.budgetDistribution(companyId);
      default:
        return { responseType: 'error', text: `DemandAnalysisAgent: unknown action "${action}"` };
    }
  }

  /** Number of active leads per pipeline stage */
  private async analyzeStages(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    type Row = { stage: string; count: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT stage, COUNT(*)::text AS count
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND stage NOT IN ('closed_lost', 'closed_won')
      GROUP BY stage
      ORDER BY count DESC
    `;
    if (!rows.length) return { responseType: 'text', text: 'No active leads in the pipeline.' };
    return {
      responseType: 'chart',
      chart: {
        title: 'Leads by pipeline stage',
        bars: rows.map(r => ({
          label: r.stage.replace(/_/g, ' '),
          value: Number(r.count),
        })),
      },
    };
  }

  /** Temperature-based trend: hot vs warm vs cold leads over last 90 days */
  private async analyzeTrends(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    this.assertPermission('analytics:read');

    type Row = { week: string; hot: string; warm: string; cold: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT
        to_char(date_trunc('week', created_at), 'YYYY-MM-DD') AS week,
        COUNT(*) FILTER (WHERE temperature = 'hot')::text  AS hot,
        COUNT(*) FILTER (WHERE temperature = 'warm')::text AS warm,
        COUNT(*) FILTER (WHERE temperature = 'cold')::text AS cold
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND created_at >= NOW() - INTERVAL '90 days'
      GROUP BY week
      ORDER BY week ASC
    `;
    if (!rows.length) return { responseType: 'text', text: 'No lead trend data for the past 90 days.' };
    const summaryCards = rows.flatMap(r => [
      { label: `${r.week} — hot`,  value: r.hot },
      { label: `${r.week} — warm`, value: r.warm },
      { label: `${r.week} — cold`, value: r.cold },
    ]);
    return {
      responseType: 'summary',
      title: 'Lead temperature trends (last 90 days)',
      summaryCards,
    };
  }

  /** Histogram of buyer budgets in four bands */
  private async budgetDistribution(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    type Row = { band: string; count: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT
        CASE
          WHEN budget_max < 1000000   THEN 'Under R1M'
          WHEN budget_max < 3000000   THEN 'R1M – R3M'
          WHEN budget_max < 10000000  THEN 'R3M – R10M'
          ELSE 'Over R10M'
        END AS band,
        COUNT(*)::text AS count
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND budget_max IS NOT NULL
        AND stage NOT IN ('closed_lost', 'closed_won')
      GROUP BY band
      ORDER BY MIN(budget_max) ASC
    `;
    if (!rows.length) return { responseType: 'text', text: 'No budget data available for active leads.' };
    return {
      responseType: 'chart',
      chart: {
        title: 'Buyer budget distribution',
        bars: rows.map(r => ({ label: r.band, value: Number(r.count) })),
      },
    };
  }
}
