import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database';

export type TurnaroundReportRow = {
  case_reference: string;
  case_type: string;
  status: string;
  lifecycle_phase: number;
  opened_at: Date;
  target_registration_date: Date | null;
  actual_registration_date: Date | null;
  days_open: number;
};

export type OutstandingTaskRow = {
  case_id: string;
  case_reference: string;
  task_id: string;
  title: string;
  due_date: Date | null;
  status: string;
  is_blocker: boolean;
  days_overdue: number | null;
};

export type FeeCollectionRow = {
  case_reference: string;
  invoice_type: string;
  total_amount: string;
  paid_amount: string;
  outstanding_amount: string;
  invoice_status: string;
};

export type CaseloadRow = {
  conveyancer_id: string;
  total_cases: string;
  open_cases: string;
  lodged_cases: string;
  registered_cases: string;
  closed_cases: string;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTurnaroundReport(
    firmId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<TurnaroundReportRow[]> {
    return this.prisma.$queryRaw<TurnaroundReportRow[]>`
      SELECT
        c.case_reference,
        c.case_type,
        c.status,
        c.lifecycle_phase,
        c.opened_at,
        c.target_registration_date,
        c.actual_registration_date,
        EXTRACT(DAY FROM (COALESCE(c.actual_registration_date, NOW()) - c.opened_at))::int AS days_open
      FROM conveyancing.cases c
      WHERE c.firm_id = ${firmId}::uuid
        AND (${fromDate ?? null}::date IS NULL OR c.opened_at >= ${fromDate ?? null}::date)
        AND (${toDate ?? null}::date IS NULL OR c.opened_at <= ${toDate ?? null}::date)
      ORDER BY c.opened_at DESC
    `;
  }

  async getOutstandingTasksReport(
    firmId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<OutstandingTaskRow[]> {
    return this.prisma.$queryRaw<OutstandingTaskRow[]>`
      SELECT
        c.id        AS case_id,
        c.case_reference,
        t.id        AS task_id,
        t.title,
        t.due_date,
        t.status,
        t.is_blocker,
        CASE
          WHEN t.due_date < CURRENT_DATE AND t.status NOT IN ('completed', 'waived')
            THEN EXTRACT(DAY FROM (CURRENT_DATE - t.due_date))::int
          ELSE NULL
        END AS days_overdue
      FROM conveyancing.case_tasks t
      JOIN conveyancing.cases c ON c.id = t.case_id
      WHERE c.firm_id = ${firmId}::uuid
        AND t.status NOT IN ('completed', 'waived')
        AND (${fromDate ?? null}::date IS NULL OR t.due_date >= ${fromDate ?? null}::date)
        AND (${toDate ?? null}::date IS NULL OR t.due_date <= ${toDate ?? null}::date)
      ORDER BY t.is_blocker DESC, t.due_date ASC NULLS LAST
    `;
  }

  async getFeeCollectionReport(
    firmId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<FeeCollectionRow[]> {
    return this.prisma.$queryRaw<FeeCollectionRow[]>`
      SELECT
        c.case_reference,
        i.invoice_type,
        i.total_amount,
        i.paid_amount,
        (i.total_amount - i.paid_amount) AS outstanding_amount,
        i.status AS invoice_status
      FROM conveyancing.invoices i
      JOIN conveyancing.cases c ON c.id = i.case_id
      WHERE c.firm_id = ${firmId}::uuid
        AND (${fromDate ?? null}::date IS NULL OR i.created_at >= ${fromDate ?? null}::date)
        AND (${toDate ?? null}::date IS NULL OR i.created_at <= ${toDate ?? null}::date)
      ORDER BY i.created_at DESC
    `;
  }

  async getCaseloadReport(firmId: string): Promise<CaseloadRow[]> {
    return this.prisma.$queryRaw<CaseloadRow[]>`
      SELECT
        c.lead_conveyancer_id AS conveyancer_id,
        COUNT(*)                                            AS total_cases,
        COUNT(*) FILTER (WHERE c.status = 'open')           AS open_cases,
        COUNT(*) FILTER (WHERE c.status = 'lodged')         AS lodged_cases,
        COUNT(*) FILTER (WHERE c.status = 'registered')     AS registered_cases,
        COUNT(*) FILTER (WHERE c.status = 'closed')         AS closed_cases
      FROM conveyancing.cases c
      WHERE c.firm_id = ${firmId}::uuid
      GROUP BY c.lead_conveyancer_id
      ORDER BY total_cases DESC
    `;
  }
}
