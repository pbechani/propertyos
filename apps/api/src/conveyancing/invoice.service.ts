import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { ConveyancingAuditService } from './conveyancing-audit.service';
import { CreateInvoiceDto, UpdateInvoiceStatusDto } from './conveyancing.dto';
import { INVOICE_STATUSES } from './conveyancing.constants';

export type InvoiceRow = {
  id: string;
  invoice_number: string;
  case_id: string;
  firm_id: string;
  billed_to_id: string;
  invoice_type: string;
  subtotal: string;
  vat_amount: string;
  total_amount: string;
  currency: string;
  status: string;
  issue_date: Date | null;
  due_date: Date | null;
  paid_amount: string;
  paid_at: Date | null;
  document_url: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

let invoiceSeq = 0;
function generateInvoiceNumber(firmId: string): string {
  invoiceSeq = (invoiceSeq + 1) % 100000;
  const ts = Date.now();
  return `INV-${ts}-${String(invoiceSeq).padStart(5, '0')}`;
}

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ConveyancingAuditService,
  ) {}

  async createInvoice(
    actorId: string,
    actorRole: string,
    firmId: string,
    caseId: string,
    dto: CreateInvoiceDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<InvoiceRow & { line_items: unknown[] }> {
    if (!dto.lineItems?.length) {
      throw new BadRequestException('Invoice must have at least one line item');
    }

    const VAT_RATE = 0.15;
    let subtotal = 0;
    for (const item of dto.lineItems) {
      const qty = item.quantity ?? 1;
      subtotal += qty * item.unitPrice;
    }
    subtotal = Math.round(subtotal * 100) / 100;
    const vatAmount = Math.round(subtotal * VAT_RATE * 100) / 100;
    const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;
    const invoiceNumber = generateInvoiceNumber(firmId);

    const rows = await this.prisma.$queryRaw<InvoiceRow[]>`
      INSERT INTO conveyancing.invoices
        (invoice_number, case_id, firm_id, billed_to_id, invoice_type,
         subtotal, vat_amount, total_amount, currency, status, issue_date, due_date, notes)
      VALUES (
        ${invoiceNumber}, ${caseId}::uuid, ${firmId}::uuid, ${dto.billedToId}::uuid,
        ${dto.invoiceType},
        ${subtotal}, ${vatAmount}, ${totalAmount}, 'ZAR',
        'draft',
        ${dto.issueDate ?? null}::date,
        ${dto.dueDate ?? null}::date,
        ${dto.notes ?? null}
      )
      RETURNING *
    `;
    const invoice = rows[0];

    const lineItems: unknown[] = [];
    for (let i = 0; i < dto.lineItems.length; i++) {
      const li = dto.lineItems[i];
      const qty = li.quantity ?? 1;
      const amount = Math.round(qty * li.unitPrice * 100) / 100;
      const liRows = await this.prisma.$queryRaw<unknown[]>`
        INSERT INTO conveyancing.invoice_line_items
          (invoice_id, description, line_type, quantity, unit_price, amount, sort_order)
        VALUES (
          ${invoice.id}::uuid, ${li.description}, ${li.lineType},
          ${qty}, ${li.unitPrice}, ${amount}, ${li.sortOrder ?? i}
        )
        RETURNING *
      `;
      lineItems.push(liRows[0]);
    }

    await this.audit.log({
      actorId,
      actorRole,
      firmId,
      action: 'invoice.created',
      resourceType: 'conveyancing_invoice',
      resourceId: invoice.id,
      payload: { caseId, invoiceNumber, totalAmount, invoiceType: dto.invoiceType },
      ipAddress,
      userAgent,
    });

    return { ...invoice, line_items: lineItems };
  }

  async listInvoices(caseId: string, firmId: string): Promise<InvoiceRow[]> {
    return this.prisma.$queryRaw<InvoiceRow[]>`
      SELECT * FROM conveyancing.invoices
      WHERE case_id = ${caseId}::uuid AND firm_id = ${firmId}::uuid
      ORDER BY created_at DESC
    `;
  }

  async getInvoice(invoiceId: string, firmId: string): Promise<InvoiceRow & { line_items: unknown[] }> {
    const rows = await this.prisma.$queryRaw<InvoiceRow[]>`
      SELECT * FROM conveyancing.invoices
      WHERE id = ${invoiceId}::uuid AND firm_id = ${firmId}::uuid LIMIT 1
    `;
    if (!rows.length) throw new NotFoundException('Invoice not found');

    const lineItems = await this.prisma.$queryRaw`
      SELECT * FROM conveyancing.invoice_line_items
      WHERE invoice_id = ${invoiceId}::uuid
      ORDER BY sort_order
    `;

    return { ...rows[0], line_items: lineItems as unknown[] };
  }

  async updateStatus(
    actorId: string,
    actorRole: string,
    firmId: string,
    invoiceId: string,
    dto: UpdateInvoiceStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<InvoiceRow> {
    if (!INVOICE_STATUSES.includes(dto.status as any)) {
      throw new BadRequestException('Invalid invoice status');
    }

    const rows = await this.prisma.$queryRaw<InvoiceRow[]>`
      UPDATE conveyancing.invoices
      SET
        status     = ${dto.status},
        paid_amount = COALESCE(${dto.paidAmount ?? null}, paid_amount),
        paid_at    = CASE WHEN ${dto.status} = 'paid' THEN NOW() ELSE paid_at END,
        updated_at = NOW()
      WHERE id = ${invoiceId}::uuid AND firm_id = ${firmId}::uuid
      RETURNING *
    `;
    if (!rows.length) throw new NotFoundException('Invoice not found');

    await this.audit.log({
      actorId,
      actorRole,
      firmId,
      action: 'invoice.status_updated',
      resourceType: 'conveyancing_invoice',
      resourceId: invoiceId,
      payload: { status: dto.status, paidAmount: dto.paidAmount },
      ipAddress,
      userAgent,
    });

    return rows[0];
  }
}
