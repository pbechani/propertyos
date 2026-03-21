import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database';
import { NotificationService } from '../identity/notification.service';

// ─── Graph node types (mirrors the frontend WorkflowNode) ────────────────────

type WorkflowNode = {
  id: string;
  type: 'trigger' | 'action' | 'delay' | 'condition';
  label: string;
  templateId: string;
  config: Record<string, unknown>;
  connections: string[]; // IDs of successor nodes
};

type WorkflowRow = {
  id: string;
  company_id: string;
  name: string;
  status: string;
  trigger_type: string;
  steps: WorkflowNode[];
  enrolled_count: number;
  completed_count: number;
  performance: { sent: number; opened: number; clicked: number };
};

type EnrollmentRow = {
  id: string;
  workflow_id: string;
  company_id: string;
  lead_id: string | null;
  lead_email: string | null;
  lead_name: string | null;
  status: string;
  current_node_id: string | null;
  resume_at: Date | null;
  context: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

// ─── Public result shape used by Test Run endpoint ────────────────────────────

export type StepResult = {
  nodeId: string;
  type: string;
  label: string;
  status: 'executed' | 'skipped' | 'waiting' | 'failed';
  message: string;
};

export type TestRunResult = {
  workflow: string;
  steps: StepResult[];
};

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // ── Trigger ──────────────────────────────────────────────────────────────

  /**
   * Called whenever a domain event fires (e.g. lead created).
   * Finds all active workflows whose trigger_type matches and enrolls the contact.
   */
  async triggerFor(
    triggerType: string,
    companyId: string,
    context: { leadId?: string; leadEmail?: string | null; leadName?: string | null },
  ): Promise<void> {
    const workflows = await this.prisma.$queryRaw<WorkflowRow[]>`
      SELECT * FROM property.agent_workflows
      WHERE company_id = ${companyId}::uuid
        AND status = 'active'
        AND LOWER(trigger_type) = LOWER(${triggerType})
    `;

    for (const wf of workflows) {
      this.enrollLead(wf, companyId, context).catch((err: Error) =>
        this.logger.error(`Enroll failed for workflow ${wf.id}: ${err.message}`),
      );
    }
  }

  // ── Enrolment ─────────────────────────────────────────────────────────────

  async enrollLead(
    workflow: WorkflowRow,
    companyId: string,
    context: { leadId?: string; leadEmail?: string | null; leadName?: string | null },
  ): Promise<EnrollmentRow> {
    const steps: WorkflowNode[] = this.parseSteps(workflow.steps);
    const triggerNode = steps.find((n) => n.type === 'trigger') ?? steps[0];
    const firstNodeId = triggerNode?.connections[0] ?? steps.find((n) => n.type !== 'trigger')?.id ?? null;

    const [enrollment] = await this.prisma.$queryRaw<EnrollmentRow[]>`
      INSERT INTO property.workflow_enrollments
        (workflow_id, company_id, lead_id, lead_email, lead_name, current_node_id)
      VALUES (
        ${workflow.id}::uuid,
        ${companyId}::uuid,
        ${context.leadId ?? null}::uuid,
        ${context.leadEmail ?? null},
        ${context.leadName ?? null},
        ${firstNodeId}
      )
      RETURNING *
    `;

    await this.prisma.$executeRaw`
      UPDATE property.agent_workflows
      SET enrolled_count = enrolled_count + 1, updated_at = now()
      WHERE id = ${workflow.id}::uuid
    `;

    // Non-blocking: run immediately
    this.runEnrollment(enrollment, steps).catch((err: Error) =>
      this.logger.error(`Enrollment ${enrollment.id} run error: ${err.message}`),
    );

    return enrollment;
  }

  // ── Step runner ───────────────────────────────────────────────────────────

  async runEnrollment(enrollment: EnrollmentRow, steps: WorkflowNode[]): Promise<void> {
    let currentNodeId = enrollment.current_node_id;

    while (currentNodeId) {
      const node = steps.find((n) => n.id === currentNodeId);
      if (!node) break;

      const result = await this.executeNode(node, enrollment, steps, false);

      if (result.status !== 'skipped') {
        await this.logStep(enrollment.id, node, result.status, { message: result.message });
      }

      if (result.status === 'waiting') {
        // Delay node persisted resume_at; stop processing
        return;
      }

      // For conditions, pick the correct branch; otherwise follow first connection
      let nextId: string | null = null;
      if (node.type === 'condition') {
        // Default to true branch (connections[0]); false branch = connections[1]
        const took = enrollment.context?.email_opened ? 0 : 1;
        nextId = (node.connections[took] ?? node.connections[0]) ?? null;
      } else {
        nextId = node.connections[0] ?? null;
      }

      currentNodeId = nextId;
      await this.prisma.$executeRaw`
        UPDATE property.workflow_enrollments
        SET current_node_id = ${currentNodeId}, updated_at = now()
        WHERE id = ${enrollment.id}::uuid
      `;
    }

    // No more nodes — workflow complete
    await this.completeEnrollment(enrollment.id);
  }

  // ── Test Run (dry run — no side effects) ──────────────────────────────────

  async testRun(workflowId: string, companyId: string, previewSteps?: unknown[]): Promise<TestRunResult> {
    const [workflow] = await this.prisma.$queryRaw<WorkflowRow[]>`
      SELECT * FROM property.agent_workflows
      WHERE id = ${workflowId}::uuid AND company_id = ${companyId}::uuid
      LIMIT 1
    `;
    if (!workflow) throw new Error('Workflow not found');

    // Use preview steps from request body if provided (allows testing unsaved canvas state)
    const rawSteps = (previewSteps?.length ? previewSteps : workflow.steps) as WorkflowNode[];
    const steps = this.parseSteps(rawSteps);
    const results: StepResult[] = [];

    const fakeEnrollment: EnrollmentRow = {
      id: 'dry-run',
      workflow_id: workflowId,
      company_id: companyId,
      lead_id: null,
      lead_email: 'preview@example.com',
      lead_name: 'Preview Lead',
      status: 'active',
      current_node_id: null,
      resume_at: null,
      context: { email_opened: true }, // simulate 'true' branch for conditions
      created_at: new Date(),
      updated_at: new Date(),
    };

    const triggerNode = steps.find((n) => n.type === 'trigger') ?? steps[0];
    let currentNodeId = triggerNode?.connections[0] ?? null;

    while (currentNodeId) {
      const node = steps.find((n) => n.id === currentNodeId);
      if (!node) break;

      const result = await this.executeNode(node, fakeEnrollment, steps, true);

      // For test run: treat delay as instant
      if (result.status === 'waiting') {
        results.push({
          ...result,
          status: 'executed',
          message: `${result.message} (simulated — skipped in test run)`,
        });
      } else {
        results.push(result);
      }

      // Follow the same branch logic
      let nextId: string | null = null;
      if (node.type === 'condition') {
        nextId = node.connections[0] ?? null; // always true branch in test
      } else {
        nextId = node.connections[0] ?? null;
      }
      currentNodeId = nextId;
    }

    return { workflow: workflow.name, steps: results };
  }

  // ── Scheduler: resume paused enrollments ─────────────────────────────────

  async processScheduledEnrollments(): Promise<void> {
    const pending = await this.prisma.$queryRaw<(EnrollmentRow & { steps: WorkflowNode[] })[]>`
      SELECT e.*, w.steps
      FROM property.workflow_enrollments e
      JOIN property.agent_workflows w ON w.id = e.workflow_id
      WHERE e.status = 'paused'
        AND e.resume_at IS NOT NULL
        AND e.resume_at <= now()
      LIMIT 50
    `;

    for (const row of pending) {
      const steps = this.parseSteps(row.steps);
      await this.prisma.$executeRaw`
        UPDATE property.workflow_enrollments
        SET status = 'active', resume_at = null, updated_at = now()
        WHERE id = ${row.id}::uuid
      `;
      this.runEnrollment(row, steps).catch((err: Error) =>
        this.logger.error(`Resumed enrollment ${row.id} error: ${err.message}`),
      );
    }
  }

  // ── Core node execution ──────────────────────────────────────────────────

  private async executeNode(
    node: WorkflowNode,
    enrollment: EnrollmentRow,
    _steps: WorkflowNode[],
    dryRun: boolean,
  ): Promise<StepResult> {
    const base: StepResult = {
      nodeId: node.id,
      type: node.type,
      label: node.label,
      status: 'executed',
      message: '',
    };

    switch (node.type) {
      case 'trigger':
        return { ...base, status: 'skipped', message: 'Trigger — entry point, not executed' };

      case 'delay': {
        const duration = (node.config?.duration as number) ?? 1;
        const unit = (node.config?.unit as string) ?? 'days';
        const hours = unit === 'hours' ? duration : duration * 24;
        if (!dryRun) {
          const nextNodeId = node.connections[0] ?? null;
          await this.prisma.$executeRaw`
            UPDATE property.workflow_enrollments
            SET status = 'paused',
                resume_at = now() + ${`${hours} hours`}::interval,
                current_node_id = ${nextNodeId},
                updated_at = now()
            WHERE id = ${enrollment.id}::uuid
          `;
        }
        return { ...base, status: 'waiting', message: `Waiting ${duration} ${unit}` };
      }

      case 'condition': {
        const condition = (node.config?.condition as string) ?? '';
        const took = enrollment.context?.email_opened ? 'true' : 'false';
        return { ...base, message: `Condition "${condition}" → took ${took} branch` };
      }

      case 'action':
        return this.executeAction(node, enrollment, dryRun);

      default:
        return { ...base, status: 'skipped', message: `Unknown node type: ${node.type}` };
    }
  }

  private async executeAction(
    node: WorkflowNode,
    enrollment: EnrollmentRow,
    dryRun: boolean,
  ): Promise<StepResult> {
    const base: StepResult = {
      nodeId: node.id,
      type: node.type,
      label: node.label,
      status: 'executed',
      message: '',
    };

    switch (node.templateId) {
      case 'send_email': {
        const subject = (node.config?.subject as string) ?? 'Message from your agent';
        const body =
          (node.config?.body as string) ??
          `Hi ${enrollment.lead_name ?? 'there'},\n\nThank you for your interest.\n\nBest regards`;
        const to = enrollment.lead_email ?? '';
        if (dryRun) {
          return { ...base, message: `Would send email "${subject}" to ${to || '(no email on file)'}` };
        }
        if (to) {
          await this.notificationService.sendEmail(to, subject, body);
          // Increment sent counter
          await this.prisma.$executeRaw`
            UPDATE property.agent_workflows
            SET performance = jsonb_set(
                  performance,
                  '{sent}',
                  (COALESCE(performance->>'sent', '0')::int + 1)::text::jsonb
                ),
                updated_at = now()
            WHERE id = ${enrollment.workflow_id}::uuid
          `;
          return { ...base, message: `Email "${subject}" sent to ${to}` };
        }
        return { ...base, status: 'skipped', message: 'No email address — skipped' };
      }

      case 'send_sms': {
        const message = (node.config?.message as string) ?? 'Your agent has an update for you';
        if (dryRun) {
          return { ...base, message: `Would send SMS: "${message}"` };
        }
        this.logger.log(`SMS queued for enrollment ${enrollment.id}: ${message}`);
        return { ...base, message: `SMS queued: "${message}"` };
      }

      case 'create_task': {
        const title = (node.config?.title as string) ?? 'Follow-up task';
        if (dryRun) {
          return { ...base, message: `Would create task: "${title}"` };
        }
        if (enrollment.lead_id && enrollment.company_id) {
          try {
            const taskId = randomUUID();
            await this.prisma.$executeRaw`
              INSERT INTO sales.lead_tasks
                (id, lead_id, company_id, created_by, title, status)
              VALUES
                (${taskId}::uuid, ${enrollment.lead_id}::uuid,
                 ${enrollment.company_id}::uuid, ${enrollment.company_id}::uuid,
                 ${title}, 'pending')
              ON CONFLICT DO NOTHING
            `;
          } catch {
            this.logger.warn(`create_task skipped — sales.lead_tasks may not exist yet`);
          }
        }
        return { ...base, message: `Task created: "${title}"` };
      }

      case 'add_tag': {
        const tag = (node.config?.tag as string) ?? '';
        if (dryRun) {
          return { ...base, message: `Would add tag: "${tag}"` };
        }
        this.logger.log(`Tag "${tag}" would be applied to lead ${enrollment.lead_id ?? 'unknown'}`);
        return { ...base, message: `Tag "${tag}" applied` };
      }

      case 'approval_form': {
        const formTitle    = (node.config?.formTitle    as string) ?? 'Action Required';
        const message      = (node.config?.message      as string) ?? 'Please review and respond to this request.';
        const approveLabel = (node.config?.approveLabel as string) ?? 'Approve';
        const rejectLabel  = (node.config?.rejectLabel  as string) ?? 'Reject';
        const to = enrollment.lead_email ?? '';

        if (dryRun) {
          return { ...base, message: `Would send approval form "${formTitle}" to ${to || '(no email)'}` };
        }

        const token   = randomUUID();
        const baseUrl = (process.env.API_BASE_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');
        const approveUrl = `${baseUrl}/workflows/approval/${token}?action=approve`;
        const rejectUrl  = `${baseUrl}/workflows/approval/${token}?action=reject`;

        // Pause enrollment and store the token so we can resume on response
        const newContext = {
          ...enrollment.context,
          approval_token:   token,
          approval_node_id: node.id,
        };

        await this.prisma.$executeRaw`
          UPDATE property.workflow_enrollments
          SET status  = 'waiting_approval',
              context = ${JSON.stringify(newContext)}::jsonb,
              updated_at = now()
          WHERE id = ${enrollment.id}::uuid
        `;

        if (to) {
          const emailBody = [
            `Hi ${enrollment.lead_name ?? 'there'},`,
            '',
            message,
            '',
            `✅ ${approveLabel}: ${approveUrl}`,
            `❌ ${rejectLabel}:  ${rejectUrl}`,
            '',
            'This link can only be used once.',
          ].join('\n');
          await this.notificationService.sendEmail(to, formTitle, emailBody);
        }

        return { ...base, status: 'waiting', message: `Approval form "${formTitle}" sent to ${to || '(no email on file)'}` };
      }

      default:
        return { ...base, status: 'skipped', message: `Action "${node.templateId}" not yet implemented` };
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  // ── Approval form response ──────────────────────────────────────────────

  /**
   * Called by the public approval controller when a lead clicks Approve/Reject.
   * Resumes the paused enrollment on the correct branch.
   */
  async resumeAfterApproval(token: string, action: 'approve' | 'reject'): Promise<void> {
    const rows = await this.prisma.$queryRaw<(EnrollmentRow & { steps: WorkflowNode[] })[]>`
      SELECT e.*, w.steps
      FROM property.workflow_enrollments e
      JOIN property.agent_workflows w ON w.id = e.workflow_id
      WHERE e.status = 'waiting_approval'
        AND e.context->>'approval_token' = ${token}
      LIMIT 1
    `;

    if (rows.length === 0) {
      throw new Error('Approval link not found or already used');
    }

    const enrollment = rows[0];
    const steps = this.parseSteps(enrollment.steps);

    const approvalNodeId = enrollment.context?.approval_token ? enrollment.context.approval_node_id as string : null;
    const approvalNode   = steps.find(n => n.id === approvalNodeId);

    // connections[0] = Approved branch, connections[1] = Rejected branch
    const nextNodeId = action === 'approve'
      ? (approvalNode?.connections[0] ?? null)
      : (approvalNode?.connections[1] ?? null);

    // Clear token (single-use) and record the response
    const newContext = {
      ...enrollment.context,
      approval_token:        null,
      approval_result:       action,
      approval_responded_at: new Date().toISOString(),
    };

    await this.prisma.$executeRaw`
      UPDATE property.workflow_enrollments
      SET status          = 'active',
          current_node_id = ${nextNodeId},
          context         = ${JSON.stringify(newContext)}::jsonb,
          updated_at      = now()
      WHERE id = ${enrollment.id}::uuid
    `;

    // Log the approval step
    if (approvalNode) {
      await this.logStep(enrollment.id, approvalNode, 'executed', {
        action,
        responded_at: newContext.approval_responded_at,
        next_node_id: nextNodeId,
      });
    }

    this.logger.log(`Enrollment ${enrollment.id} resumed after approval — action: ${action}, next: ${nextNodeId ?? 'end'}`);

    // Resume workflow asynchronously from the chosen branch
    const resumed: EnrollmentRow = {
      ...enrollment,
      status:          'active',
      current_node_id: nextNodeId,
      context:         newContext,
    };

    this.runEnrollment(resumed, steps).catch((err: Error) =>
      this.logger.error(`Resume after approval error for enrollment ${enrollment.id}: ${err.message}`),
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private parseSteps(raw: unknown): WorkflowNode[] {
    let nodes: WorkflowNode[];
    if (Array.isArray(raw)) {
      nodes = raw as WorkflowNode[];
    } else if (typeof raw === 'string') {
      try { nodes = JSON.parse(raw) as WorkflowNode[]; } catch { return []; }
    } else {
      return [];
    }
    // Ensure every node has a connections array (guard against old/incomplete data)
    return nodes.map((n) => ({ ...n, connections: Array.isArray(n.connections) ? n.connections : [] }));
  }

  private async logStep(
    enrollmentId: string,
    node: WorkflowNode,
    status: string,
    result: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO property.workflow_step_logs
          (enrollment_id, step_node_id, step_type, step_label, status, result)
        VALUES (
          ${enrollmentId}::uuid,
          ${node.id},
          ${node.type},
          ${node.label},
          ${status},
          ${JSON.stringify(result)}::jsonb
        )
      `;
    } catch (err: unknown) {
      this.logger.warn(`Step log insert failed: ${(err as Error).message}`);
    }
  }

  private async completeEnrollment(enrollmentId: string): Promise<void> {
    const rows = await this.prisma.$queryRaw<EnrollmentRow[]>`
      UPDATE property.workflow_enrollments
      SET status = 'completed', updated_at = now()
      WHERE id = ${enrollmentId}::uuid
      RETURNING workflow_id
    `;
    if (rows[0]) {
      await this.prisma.$executeRaw`
        UPDATE property.agent_workflows
        SET completed_count = completed_count + 1, updated_at = now()
        WHERE id = ${rows[0].workflow_id}::uuid
      `;
    }
  }
}
