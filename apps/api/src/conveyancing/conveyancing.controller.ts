import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { RolesGuard } from '../identity/rbac/roles.guard';
import { Roles } from '../identity/rbac/roles.decorator';
import { ConveyancingService } from './conveyancing.service';
import { CaseTasksService } from './case-tasks.service';
import { TrustAccountService } from './trust-account.service';
import { InvoiceService } from './invoice.service';
import { DocumentWorkflowService } from './document-workflow.service';
import { ClientPortalService } from './client-portal.service';
import { FeeCalculatorService } from './fee-calculator.service';
import { GovernmentInteractionsService } from './government-interactions.service';
import {
  AdvanceLifecycleDto,
  CalculateFeeDto,
  CreateCaseDto,
  CreateDeadlineDto,
  CreateGovInteractionDto,
  CreateInvoiceDto,
  CreateNoteDto,
  CreatePortalAccessDto,
  CreateTaskDto,
  CreateTrustEntryDto,
  ExtendDeadlineDto,
  GenerateDocumentDto,
  RequestSignatureDto,
  UpdateCaseDto,
  UpdateGovInteractionDto,
  UpdateInvoiceStatusDto,
  UpdateTaskDto,
} from './conveyancing.dto';
import { AuthRequest } from '../common/types';

// ──────────────────────────────────────────────────────────────────────────────
// Conveyancing Cases  /api/v1/conveyancing/cases
// ──────────────────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('conveyancer', 'admin')
@Controller('conveyancing/cases')
export class ConveyancingCasesController {
  constructor(
    private readonly conveyancingService: ConveyancingService,
    private readonly tasksService: CaseTasksService,
    private readonly trustService: TrustAccountService,
    private readonly invoiceService: InvoiceService,
    private readonly docService: DocumentWorkflowService,
    private readonly portalService: ClientPortalService,
    private readonly govService: GovernmentInteractionsService,
  ) {}

  @Post()
  async createCase(@Request() req: AuthRequest, @Body() dto: CreateCaseDto) {
    return this.conveyancingService.createCase(
      req.user.sub,
      req.user.roles[0] ?? 'conveyancer',
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get()
  async listCases(
    @Request() req: AuthRequest,
    @Query('firmId') firmId?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.conveyancingService.listCases(
      req.user.roles,
      req.user.active_company_id ?? firmId,
      req.user.sub,
      status,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Get('dashboard')
  async getDashboard(@Request() req: AuthRequest) {
    return this.conveyancingService.getDashboard(
      req.user.roles,
      req.user.active_company_id ?? undefined,
    );
  }

  @Get(':caseId')
  async getCase(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) caseId: string,
  ) {
    return this.conveyancingService.getCase(req.user.roles, caseId, req.user.active_company_id ?? undefined);
  }

  @Patch(':caseId')
  async updateCase(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: UpdateCaseDto,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.conveyancingService.updateCase(
      req.user.sub,
      req.user.roles[0] ?? 'conveyancer',
      caseId,
      firmId,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────

  @Get(':caseId/tasks')
  async listTasks(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Query('status') status?: string,
  ) {
    return this.tasksService.listTasks(caseId, status);
  }

  @Post(':caseId/tasks')
  async createTask(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: CreateTaskDto,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.tasksService.createTask(
      req.user.sub,
      req.user.roles[0] ?? 'conveyancer',
      firmId,
      caseId,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch(':caseId/tasks/:taskId')
  async updateTask(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) _caseId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.tasksService.updateTask(
      req.user.sub,
      req.user.roles[0] ?? 'conveyancer',
      firmId,
      taskId,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ── Notes ──────────────────────────────────────────────────────────────────

  @Get(':caseId/notes')
  async listNotes(@Param('caseId', ParseUUIDPipe) caseId: string) {
    return this.tasksService.listNotes(caseId);
  }

  @Post(':caseId/notes')
  async addNote(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.tasksService.addNote(caseId, req.user.sub, dto.content, dto.attachments);
  }

  // ── Trust Ledger ───────────────────────────────────────────────────────────

  @Get(':caseId/trust-ledger')
  async getLedger(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) caseId: string,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.trustService.getLedger(caseId, firmId);
  }

  @Post(':caseId/trust-ledger')
  @Roles('conveyancer', 'admin')
  async recordTrustEntry(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: CreateTrustEntryDto,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.trustService.recordEntry(
      req.user.sub,
      req.user.roles[0] ?? 'conveyancer',
      firmId,
      caseId,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ── Invoices ───────────────────────────────────────────────────────────────

  @Get(':caseId/invoices')
  async listInvoices(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) caseId: string,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.invoiceService.listInvoices(caseId, firmId);
  }

  @Post(':caseId/invoices')
  async createInvoice(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.invoiceService.createInvoice(
      req.user.sub,
      req.user.roles[0] ?? 'conveyancer',
      firmId,
      caseId,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch(':caseId/invoices/:invoiceId/status')
  async updateInvoiceStatus(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) _caseId: string,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.invoiceService.updateStatus(
      req.user.sub,
      req.user.roles[0] ?? 'conveyancer',
      firmId,
      invoiceId,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ── Documents ──────────────────────────────────────────────────────────────

  @Get(':caseId/documents')
  async listDocuments(@Param('caseId', ParseUUIDPipe) caseId: string) {
    return this.docService.listDocuments(caseId);
  }

  @Post(':caseId/documents')
  async generateDocument(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: GenerateDocumentDto,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.docService.generateDocument(
      req.user.sub,
      req.user.roles[0] ?? 'conveyancer',
      firmId,
      caseId,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':caseId/documents/request-signatures')
  async requestSignatures(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) _caseId: string,
    @Body() dto: RequestSignatureDto,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.docService.requestSignatures(
      req.user.sub,
      req.user.roles[0] ?? 'conveyancer',
      firmId,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post(':caseId/documents/:docId/sign')
  async signDocument(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) _caseId: string,
    @Param('docId', ParseUUIDPipe) docId: string,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.docService.recordSignature(
      req.user.sub,
      req.user.roles[0] ?? 'conveyancer',
      firmId,
      docId,
      req.user.sub,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ── Client Portal ──────────────────────────────────────────────────────────

  @Post(':caseId/portal-access')
  async issuePortalToken(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: CreatePortalAccessDto,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.portalService.issuePortalToken(
      req.user.sub,
      req.user.roles[0] ?? 'conveyancer',
      firmId,
      caseId,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch(':caseId/portal-access/:accessId/revoke')
  async revokePortalToken(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) _caseId: string,
    @Param('accessId', ParseUUIDPipe) accessId: string,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.portalService.revokeAccess(
      req.user.sub,
      req.user.roles[0] ?? 'conveyancer',
      firmId,
      accessId,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ── Deadlines ──────────────────────────────────────────────────────────────

  @Get(':caseId/deadlines')
  async listDeadlines(@Param('caseId', ParseUUIDPipe) caseId: string) {
    return this.tasksService.listDeadlines(caseId);
  }

  @Post(':caseId/deadlines')
  async createDeadline(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: CreateDeadlineDto,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.tasksService.createDeadline(
      req.user.sub,
      req.user.roles[0] ?? 'conveyancer',
      firmId,
      caseId,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch(':caseId/deadlines/:deadlineId/extend')
  async extendDeadline(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) _caseId: string,
    @Param('deadlineId', ParseUUIDPipe) deadlineId: string,
    @Body() dto: ExtendDeadlineDto,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.tasksService.extendDeadline(
      req.user.sub,
      req.user.roles[0] ?? 'conveyancer',
      firmId,
      deadlineId,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ── Government Interactions ────────────────────────────────────────────────

  @Get(':caseId/government-interactions')
  async listGovInteractions(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Query('department') department?: string,
  ) {
    return this.govService.listInteractions(caseId, department);
  }

  @Post(':caseId/government-interactions')
  async createGovInteraction(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: CreateGovInteractionDto,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.govService.createInteraction(
      req.user.sub,
      req.user.roles[0] ?? 'conveyancer',
      firmId,
      caseId,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Patch(':caseId/government-interactions/:interactionId')
  async updateGovInteraction(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) _caseId: string,
    @Param('interactionId', ParseUUIDPipe) interactionId: string,
    @Body() dto: UpdateGovInteractionDto,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.govService.updateInteraction(
      req.user.sub,
      req.user.roles[0] ?? 'conveyancer',
      firmId,
      interactionId,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ── Case Lifecycle ─────────────────────────────────────────────────────────

  @Get(':caseId/lifecycle')
  async getLifecycleHistory(@Param('caseId', ParseUUIDPipe) caseId: string) {
    return this.govService.getLifecycleHistory(caseId);
  }

  @Post(':caseId/lifecycle/advance')
  async advanceLifecycle(
    @Request() req: AuthRequest,
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: AdvanceLifecycleDto,
  ) {
    const firmId = req.user.active_company_id ?? '';
    return this.govService.advanceLifecycle(
      req.user.sub,
      req.user.roles[0] ?? 'conveyancer',
      firmId,
      caseId,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Fee Calculator  /api/v1/conveyancing/fee-calculator
// ──────────────────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard)
@Controller('conveyancing/fee-calculator')
export class FeeCalculatorController {
  constructor(private readonly feeCalcService: FeeCalculatorService) {}

  @Post()
  calculate(@Body() dto: CalculateFeeDto) {
    return this.feeCalcService.calculate(dto.purchasePrice, dto.feeType, dto.country ?? 'ZA');
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Document Templates  /api/v1/conveyancing/document-templates
// ──────────────────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard)
@Controller('conveyancing/document-templates')
export class DocumentTemplatesController {
  constructor(private readonly docService: DocumentWorkflowService) {}

  @Get()
  listTemplates(@Query('country') country = 'ZA', @Query('caseType') caseType = 'transfer') {
    return this.docService.listTemplates(country, caseType);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Client Portal  /api/v1/conveyancing/portal/:caseId
// (Public token-authenticated endpoint — no JwtAuthGuard)
// ──────────────────────────────────────────────────────────────────────────────

@Controller('conveyancing/portal')
export class ClientPortalController {
  constructor(private readonly portalService: ClientPortalService) {}

  @Get(':caseId')
  getPortalSummary(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Query('token') token: string,
    @Request() req: { ip: string },
  ) {
    return this.portalService.getPortalSummary(token, caseId, req.ip);
  }
}
