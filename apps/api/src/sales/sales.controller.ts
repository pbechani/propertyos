import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { SalesService } from './sales.service';
import { StageService } from './stage.service';
import { StageDocumentService } from './stage-document.service';
import { GovernmentInteractionService } from './government-interaction.service';
import { SaleMessageService } from './sale-message.service';
import {
  AssignConveyancerDto,
  AssignAgentDto,
  AssignBuyerDto,
  AssignSellerDto,
  CompleteStageDto,
  CreateGovernmentInteractionDto,
  FlagStageDto,
  ListSalesQueryDto,
  SendMessageDto,
  StartStageDto,
  UpdateDocumentStatusDto,
  UpdateGovernmentInteractionDto,
  UploadDocumentDto,
  InitiateSaleDto,
} from './sales.dto';
import { AuthRequest } from '../common/types';

// ─────────────────────────────────────────────────────────────────────────────
// Sales controller  — /api/v1/sales
// ─────────────────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly stageService: StageService,
    private readonly docService: StageDocumentService,
    private readonly govService: GovernmentInteractionService,
    private readonly msgService: SaleMessageService,
  ) {}

  // ─── Sales ───────────────────────────────────────────────

  /**
   * POST /api/v1/sales
   * Initiate a new property sale. [agent, admin]
   */
  @UseGuards(RolesGuard)
  @Roles('agent', 'admin')
  @Post()
  initiateSale(@Body() dto: InitiateSaleDto, @Request() req: AuthRequest) {
    return this.salesService.initiateSale(
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }

  /**
   * GET /api/v1/sales/me
   * List the authenticated user's sales.
   */
  @Get('me')
  listMySales(@Query() query: ListSalesQueryDto, @Request() req: AuthRequest) {
    return this.salesService.listMySales(req.user.sub, req.user.roles, query);
  }

  /**
   * GET /api/v1/sales/:id
   * Get full sale detail with stage progress. [sale parties]
   */
  @Get(':id')
  getSale(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthRequest) {
    return this.salesService.getSale(id, req.user.sub, req.user.roles);
  }

  /**
   * PATCH /api/v1/sales/:id/assign-buyer
   * Add a buyer to a sale (multiple buyers supported). [agent, admin]
   */
  @UseGuards(RolesGuard)
  @Roles('agent', 'admin')
  @Patch(':id/assign-buyer')
  assignBuyer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignBuyerDto,
    @Request() req: AuthRequest,
  ) {
    return this.salesService.assignBuyer(
      id,
      req.user.sub,
      req.user.roles,
      dto.buyerId,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /**
   * DELETE /api/v1/sales/:id/buyers/:userId
   * Remove a buyer from a sale. [agent, admin]
   */
  @UseGuards(RolesGuard)
  @Roles('agent', 'admin')
  @Delete(':id/buyers/:userId')
  removeBuyer(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req: AuthRequest,
  ) {
    return this.salesService.removeBuyer(
      id,
      req.user.sub,
      req.user.roles,
      userId,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /**
   * PATCH /api/v1/sales/:id/assign-seller
   * Add a seller to a sale (multiple sellers supported). [agent, admin]
   */
  @UseGuards(RolesGuard)
  @Roles('agent', 'admin')
  @Patch(':id/assign-seller')
  assignSeller(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignSellerDto,
    @Request() req: AuthRequest,
  ) {
    return this.salesService.assignSeller(
      id,
      req.user.sub,
      req.user.roles,
      dto.sellerId,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /**
   * DELETE /api/v1/sales/:id/sellers/:userId
   * Remove a seller from a sale. At least one seller must remain. [agent, admin]
   */
  @UseGuards(RolesGuard)
  @Roles('agent', 'admin')
  @Delete(':id/sellers/:userId')
  removeSeller(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req: AuthRequest,
  ) {
    return this.salesService.removeSeller(
      id,
      req.user.sub,
      req.user.roles,
      userId,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /**
   * PATCH /api/v1/sales/:id/assign-agent
   * Assign or change the agent on a sale. [agent, admin]
   */
  @UseGuards(RolesGuard)
  @Roles('agent', 'admin')
  @Patch(':id/assign-agent')
  assignAgent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignAgentDto,
    @Request() req: AuthRequest,
  ) {
    return this.salesService.assignAgent(
      id,
      req.user.sub,
      req.user.roles,
      dto.agentId,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /**
   * PATCH /api/v1/sales/:id/assign-conveyancer
   * Assign buyer / seller conveyancers. [agent, admin]
   */
  @UseGuards(RolesGuard)
  @Roles('agent', 'admin')
  @Patch(':id/assign-conveyancer')
  assignConveyancer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignConveyancerDto,
    @Request() req: AuthRequest,
  ) {
    return this.salesService.assignConveyancer(
      id,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /**
   * PATCH /api/v1/sales/:id/cancel
   * Cancel a sale. [agent, admin]
   */
  @UseGuards(RolesGuard)
  @Roles('agent', 'admin')
  @Patch(':id/cancel')
  cancelSale(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthRequest) {
    return this.salesService.cancelSale(
      id,
      req.user.sub,
      req.user.roles,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ─── Stages ──────────────────────────────────────────────

  /**
   * GET /api/v1/sales/:id/stages
   * List all stages with config metadata. [sale parties]
   */
  @Get(':id/stages')
  listStages(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthRequest) {
    return this.stageService.listStages(id, req.user.sub, req.user.roles);
  }

  /**
   * POST /api/v1/sales/:id/stages/:stageNum/start
   * Mark a stage as in_progress. [responsible role]
   */
  @Post(':id/stages/:stageNum/start')
  startStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stageNum', ParseIntPipe) stageNum: number,
    @Body() dto: StartStageDto,
    @Request() req: AuthRequest,
  ) {
    return this.stageService.startStage(
      id,
      stageNum,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /**
   * POST /api/v1/sales/:id/stages/:stageNum/complete
   * Mark a stage as completed. [responsible role]
   */
  @Post(':id/stages/:stageNum/complete')
  completeStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stageNum', ParseIntPipe) stageNum: number,
    @Body() dto: CompleteStageDto,
    @Request() req: AuthRequest,
  ) {
    return this.stageService.completeStage(
      id,
      stageNum,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /**
   * POST /api/v1/sales/:id/stages/:stageNum/flag
   * Flag a stage — creates a sale issue. [any party]
   */
  @Post(':id/stages/:stageNum/flag')
  flagStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stageNum', ParseIntPipe) stageNum: number,
    @Body() dto: FlagStageDto,
    @Request() req: AuthRequest,
  ) {
    return this.stageService.flagStage(
      id,
      stageNum,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ─── Documents ───────────────────────────────────────────

  /**
   * POST /api/v1/sales/:id/stages/:stageNum/documents
   * Upload a document for a stage. [conveyancer, agent]
   */
  @Post(':id/stages/:stageNum/documents')
  uploadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stageNum', ParseIntPipe) stageNum: number,
    @Body() dto: UploadDocumentDto,
    @Request() req: AuthRequest,
  ) {
    return this.docService.uploadDocument(
      id,
      stageNum,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /**
   * GET /api/v1/sales/:id/documents
   * List all documents for a sale. [sale parties]
   */
  @Get(':id/documents')
  listDocuments(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthRequest) {
    return this.docService.listDocuments(id, req.user.sub, req.user.roles);
  }

  /**
   * PATCH /api/v1/sales/:id/documents/:docId/status
   * Update document status. [admin, conveyancer]
   */
  @Patch(':id/documents/:docId/status')
  updateDocumentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('docId', ParseUUIDPipe) docId: string,
    @Body() dto: UpdateDocumentStatusDto,
    @Request() req: AuthRequest,
  ) {
    return this.docService.updateDocumentStatus(
      id,
      docId,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /**
   * DELETE /api/v1/sales/:id/documents/:docId
   * Delete a document (uploader or admin only).
   */
  @Delete(':id/documents/:docId')
  deleteDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('docId', ParseUUIDPipe) docId: string,
    @Request() req: AuthRequest,
  ) {
    return this.docService.deleteDocument(
      id,
      docId,
      req.user.sub,
      req.user.roles,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ─── Government Interactions ─────────────────────────────

  /**
   * POST /api/v1/sales/:id/government-interactions
   * Record a gov dept interaction. [conveyancer, admin]
   */
  @Post(':id/government-interactions')
  createGovInteraction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateGovernmentInteractionDto,
    @Request() req: AuthRequest,
  ) {
    return this.govService.create(
      id,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /**
   * GET /api/v1/sales/:id/government-interactions
   * List gov interactions for a sale. [sale parties]
   */
  @Get(':id/government-interactions')
  listGovInteractions(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthRequest) {
    return this.govService.list(id, req.user.sub, req.user.roles);
  }

  /**
   * PATCH /api/v1/sales/:id/government-interactions/:intId
   * Update a gov interaction. [conveyancer, admin]
   */
  @Patch(':id/government-interactions/:intId')
  updateGovInteraction(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('intId', ParseUUIDPipe) intId: string,
    @Body() dto: UpdateGovernmentInteractionDto,
    @Request() req: AuthRequest,
  ) {
    return this.govService.update(
      id,
      intId,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ─── Messages ────────────────────────────────────────────

  /**
   * POST /api/v1/sales/:id/messages
   * Send a message in the sale communication hub. [sale parties]
   */
  @Post(':id/messages')
  sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
    @Request() req: AuthRequest,
  ) {
    return this.msgService.send(
      id,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /**
   * GET /api/v1/sales/:id/messages
   * List messages (role-filtered). [sale parties]
   */
  @Get(':id/messages')
  listMessages(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthRequest) {
    return this.msgService.list(id, req.user.sub, req.user.roles);
  }
}
