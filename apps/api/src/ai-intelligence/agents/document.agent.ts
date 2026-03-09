import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database';
import { AssistantResponse } from '../ai-intelligence.types';
import { BaseAgent, ToolPermission } from './base.agent';

// ─────────────────────────────────────────────────────────────────────────────
// DocumentAgent
// Identifies leads and listings that need documentation action — contract-ready
// opportunities and pending document milestones.
// Tool permissions: properties:read, leads:read
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class DocumentAgent extends BaseAgent {
  readonly agentName = 'DocumentAgent';
  readonly description = 'Identifies contract-ready transactions and leads awaiting documentation action.';
  readonly capabilities = ['property_db_read', 'contract_gen'] as const;
  readonly actions = ['listContractReady', 'pendingDocuments', 'summaryByStage'] as const;
  readonly allowedTools: ReadonlySet<ToolPermission> = new Set(['properties:read', 'leads:read']);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    action: string,
    _params: Record<string, string>,
    companyId: string,
  ): Promise<AssistantResponse> {
    switch (action) {
      case 'listContractReady': return this.listContractReady(companyId);
      case 'pendingDocuments':  return this.pendingDocuments(companyId);
      case 'summaryByStage':    return this.summaryByStage(companyId);
      default:
        return { responseType: 'error', text: `DocumentAgent: unknown action "${action}"` };
    }
  }

  /** Leads at offer/negotiation stage — ready for contract preparation */
  private async listContractReady(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    type Row = { id: string; name: string; stage: string; deal_value: string | null; last_contact_at: Date | null };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, name, stage, deal_value::text, last_contact_at
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND stage IN ('verbal_offer', 'written_offer', 'negotiation', 'sale_agreed')
      ORDER BY deal_value DESC NULLS LAST
      LIMIT 20
    `;
    if (!rows.length) return { responseType: 'text', text: 'No leads in the contract-ready stages.' };
    return {
      responseType: 'list',
      title: `${rows.length} contract-ready transaction${rows.length !== 1 ? 's' : ''}`,
      items: rows.map(r => ({
        id: r.id,
        label: r.name,
        sublabel: `Stage: ${r.stage.replace(/_/g, ' ')} · last contact ${r.last_contact_at ? this.relativeTime(r.last_contact_at) : 'never'}`,
        badge: r.deal_value ? this.fmtZar(Number(r.deal_value)) : 'No value',
        badgeColor: r.deal_value ? 'green' : 'gray',
        href: `/app/leads/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }

  /**
   * Leads in early stages that typically need documentation uploads
   * (pre-qualification, viewing, etc.).
   */
  private async pendingDocuments(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    type Row = { id: string; name: string; stage: string; prequalified: boolean; created_at: Date };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT id, name, stage, prequalified, created_at
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND prequalified = false
        AND stage NOT IN ('closed_lost','closed_won')
      ORDER BY created_at DESC
      LIMIT 20
    `;
    if (!rows.length) return { responseType: 'text', text: 'All active leads are pre-qualified.' };
    return {
      responseType: 'list',
      title: `${rows.length} lead${rows.length !== 1 ? 's' : ''} awaiting pre-qualification documents`,
      items: rows.map(r => ({
        id: r.id,
        label: r.name,
        sublabel: `Stage: ${r.stage.replace(/_/g, ' ')} · added ${this.relativeTime(r.created_at)}`,
        badge: 'Docs pending',
        badgeColor: 'orange',
        href: `/app/leads/${r.id}`,
      })),
      totalCount: rows.length,
    };
  }

  /** Count of leads per document-relevant stage for overview */
  private async summaryByStage(companyId: string): Promise<AssistantResponse> {
    this.assertPermission('leads:read');
    type Row = { stage: string; total: string; prequalified: string };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT stage,
             COUNT(*)::text AS total,
             COUNT(*) FILTER (WHERE prequalified = true)::text AS prequalified
      FROM sales.leads
      WHERE company_id = ${companyId}::uuid
        AND stage NOT IN ('closed_lost', 'closed_won')
      GROUP BY stage
      ORDER BY total DESC
    `;
    if (!rows.length) return { responseType: 'text', text: 'No active leads found.' };
    return {
      responseType: 'summary',
      title: 'Document status by pipeline stage',
      summaryCards: rows.flatMap(r => [
        { label: `${r.stage.replace(/_/g, ' ')} — total`,         value: r.total },
        { label: `${r.stage.replace(/_/g, ' ')} — pre-qualified`,  value: r.prequalified },
      ]),
    };
  }
}
