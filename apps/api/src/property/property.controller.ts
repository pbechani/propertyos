import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { RolesGuard } from '../identity/rbac/roles.guard';
import { Roles } from '../identity/rbac/roles.decorator';
import { PropertyService } from './property.service';
import { PropertyDocumentService } from './property-document.service';
import { PropertyConditionService } from './property-condition.service';
import { InspectionRequestService } from './inspection-request.service';
import { SellingPointService } from './selling-point.service';
import { NoteService } from './note.service';
import { CommunicationLogService } from './communication-log.service';
import { ComparisonService } from './comparison.service';
import { SellerDashboardService } from './seller-dashboard.service';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  SearchPropertiesDto,
  ContactAgentDto,
  ScheduleCallDto,
} from './property.dto';
import { resolvePropertyActorRole } from './property.constants';
import { AuthRequest, PublicRequest } from '../common/types';

@Controller('properties')
export class PropertyController {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly propertyDocumentService: PropertyDocumentService,
    private readonly propertyConditionService: PropertyConditionService,
    private readonly inspectionRequestService: InspectionRequestService,
    private readonly sellingPointService: SellingPointService,
    private readonly noteService: NoteService,
    private readonly communicationLogService: CommunicationLogService,
    private readonly comparisonService: ComparisonService,
  ) {}

  /**
   * GET /api/v1/properties/compare?ids=uuid1,uuid2,uuid3
   * Compare up to 4 properties side-by-side. [public]
   * Must appear BEFORE @Get(':id') to avoid UUID route interception.
   */
  @Get('compare')
  async compare(@Query('ids') ids: string) {
    const idList = (ids ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return this.comparisonService.compare(idList);
  }

  /**
   * POST /api/v1/properties
   * Create a new property listing. [agent, admin, buyer_seller, investor]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'buyer_seller', 'investor')
  @Post()
  async create(@Body() dto: CreatePropertyDto, @Request() req: AuthRequest) {
    const agentRole = resolvePropertyActorRole(req.user.roles, 'agent');
    return this.propertyService.create(
      req.user.sub,
      agentRole,
      dto,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }

  /**
   * GET /api/v1/properties
   * Public search with filters and geo-radius.
   */
  @Get()
  async search(@Query() query: SearchPropertiesDto) {
    return this.propertyService.search(query);
  }

  /**
   * GET /api/v1/properties/agents/featured
   * Public list of featured agents based on active listings.
   */
  @Get('agents/featured')
  async featuredAgents(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : 8;
    return this.propertyService.getFeaturedAgents(
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 8,
    );
  }

  /**
   * GET /api/v1/properties/agents/:id/profile
   * Public agent profile details and listings.
   */
  @Get('agents/:id/profile')
  async agentProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertyService.getAgentProfile(id);
  }

  /**
   * GET /api/v1/properties/agents/:id/reviews
   * Public list of client reviews for an agent.
   */
  @Get('agents/:id/reviews')
  async agentReviews(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.propertyService.getAgentReviews(
      id,
      limit ? Math.min(parseInt(limit, 10) || 10, 50) : 10,
      offset ? parseInt(offset, 10) || 0 : 0,
    );
  }

  /**
   * POST /api/v1/properties/agents/:id/contact
   * Log a Contact Agent request. Auth optional.
   */
  @Post('agents/:id/contact')
  async contactAgent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ContactAgentDto,
    @Request() req: PublicRequest,
  ) {
    return this.propertyService.contactAgent(
      id,
      dto,
      req.user?.sub,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /**
   * POST /api/v1/properties/agents/:id/schedule-call
   * Log a Schedule Call request. Auth optional.
   */
  @Post('agents/:id/schedule-call')
  async scheduleCall(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleCallDto,
    @Request() req: PublicRequest,
  ) {
    return this.propertyService.scheduleAgentCall(
      id,
      dto,
      req.user?.sub,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /**
   * GET /api/v1/properties/:id/stats
   * Per-property performance stats for the listing creator (agent or owner). [auth, own listing]
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/stats')
  async getPropertyStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.propertyService.getPropertyStats(req.user.sub, id);
  }

  /**
   * GET /api/v1/properties/:id/viewings
   * All viewings for the listing — accessible by listing creator. [auth, own listing]
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/viewings')
  async getPropertyViewings(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.propertyService.getPropertyViewingsList(req.user.sub, id);
  }

  /**
   * GET /api/v1/properties/:id/ownership-history
   * Public ownership transfer timeline.
   */
  @Get(':id/ownership-history')
  async getOwnershipHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertyService.getOwnershipHistory(id);
  }

  /**
   * GET /api/v1/properties/:id/price-history
   * Public price change timeline.
   */
  @Get(':id/price-history')
  async getPriceHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertyService.getPriceHistory(id);
  }

  /**
   * GET /api/v1/properties/:id/floor-plans
   * Public floor plan media for a property.
   */
  @Get(':id/floor-plans')
  async getFloorPlans(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertyService.getFloorPlans(id);
  }

  /**
   * GET /api/v1/properties/:id
   * Public property detail.
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: PublicRequest) {
    const actorRole = req.user?.roles
      ? resolvePropertyActorRole(req.user.roles, 'public')
      : 'public';

    return this.propertyService.findById(id, {
      actorId: req.user?.sub,
      actorRole,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  /**
   * PATCH /api/v1/properties/:id
   * Update a listing. [owner, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'buyer_seller', 'investor')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyDto,
    @Request() req: AuthRequest,
  ) {
    const agentRole = resolvePropertyActorRole(req.user.roles, 'agent');
    return this.propertyService.update(
      id,
      req.user.sub,
      agentRole,
      dto,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }

  /**
   * DELETE /api/v1/properties/:id
   * Delete a listing. [agent (own), admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'buyer_seller', 'investor')
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    const agentRole = resolvePropertyActorRole(req.user.roles, 'agent');
    await this.propertyService.delete(
      id,
      req.user.sub,
      agentRole,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
    return { message: 'Property deleted successfully' };
  }

  /**
   * POST /api/v1/properties/:id/media
   * Upload photo/video to a listing. [owner, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'buyer_seller', 'investor')
  @Post(':id/media')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'files', maxCount: 20 },
    ]),
  )
  async addMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles()
    uploaded: { file?: Express.Multer.File[]; files?: Express.Multer.File[] },
    @Request() req: AuthRequest,
  ) {
    const agentRole = resolvePropertyActorRole(req.user.roles, 'agent');

    const files = [
      ...(uploaded.file ?? []),
      ...(uploaded.files ?? []),
    ];

    const result = await this.propertyService.addMediaBatch(
      id,
      req.user.sub,
      agentRole,
      files,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );

    return result.length === 1 ? result[0] : { items: result };
  }

  /**
   * DELETE /api/v1/properties/:id/media/:mediaId
   * Remove a media file from a listing. [owner, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'buyer_seller', 'investor')
  @Delete(':id/media/:mediaId')
  async deleteMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
    @Request() req: AuthRequest,
  ) {
    const agentRole = resolvePropertyActorRole(req.user.roles, 'agent');
    await this.propertyService.deleteMedia(
      id,
      mediaId,
      req.user.sub,
      agentRole,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
    return { message: 'Media deleted successfully' };
  }

  /**
   * POST /api/v1/properties/:id/documents
   * Upload a document to a listing. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      title?: string;
      category?: string;
      description?: string;
      status?: string;
      accessLevel?: string;
      isRequired?: string;
      expirationDate?: string;
      tags?: string;
    },
    @Request() req: AuthRequest,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.propertyDocumentService.uploadDocument({
      propertyId: id,
      uploadedBy: req.user.sub,
      title: body.title ?? '',
      category: body.category ?? 'other',
      description: body.description,
      status: body.status,
      accessLevel: body.accessLevel,
      isRequired: body.isRequired === 'true',
      expirationDate: body.expirationDate,
      tags: body.tags ? JSON.parse(body.tags) : [],
      file,
    });
  }

  /**
   * GET /api/v1/properties/:id/documents
   * List documents for a listing. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Get(':id/documents')
  async listDocuments(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.propertyDocumentService.listDocuments(id, req.user.sub);
  }

  /**
   * DELETE /api/v1/properties/:id/documents/:docId
   * Delete a document from a listing. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Delete(':id/documents/:docId')
  async deleteDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('docId', ParseUUIDPipe) docId: string,
    @Request() req: AuthRequest,
  ) {
    await this.propertyDocumentService.deleteDocument(id, docId, req.user.sub);
    return { message: 'Document deleted successfully' };
  }

  /**
   * POST /api/v1/properties/:id/condition-assessments
   * Save a property condition assessment. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Post(':id/condition-assessments')
  async createConditionAssessment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      inspectionDate: string;
      inspectorName?: string;
      yearBuilt?: string;
      lastRenovation?: string;
      overallNotes?: string;
      roomConditions: Record<string, unknown>;
    },
    @Request() req: AuthRequest,
  ) {
    return this.propertyConditionService.create({
      propertyId: id,
      submittedBy: req.user.sub,
      inspectionDate: body.inspectionDate,
      inspectorName: body.inspectorName,
      yearBuilt: body.yearBuilt,
      lastRenovation: body.lastRenovation,
      overallNotes: body.overallNotes,
      roomConditions: body.roomConditions ?? {},
    });
  }

  /**
   * GET /api/v1/properties/:id/condition-assessments
   * List condition assessments for a listing. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Get(':id/condition-assessments')
  async listConditionAssessments(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.propertyConditionService.list(id, req.user.sub);
  }

  /**
   * POST /api/v1/properties/:id/inspection-requests
   * Submit an inspection request for a listing. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Post(':id/inspection-requests')
  async createInspectionRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      inspectionTypes: string[];
      urgency: string;
      preferredDate: string;
      preferredTime: string;
      alternateDate?: string;
      alternateTime?: string;
      inspectorName?: string;
      inspectorCompany?: string;
      inspectorPhone?: string;
      inspectorEmail?: string;
      accessMethod: string;
      lockboxCode?: string;
      contactPerson?: string;
      contactPhone?: string;
      contactEmail?: string;
      areasOfConcern?: string;
      specialInstructions?: string;
      notifyClient: boolean;
      sendReportTo: string;
    },
    @Request() req: AuthRequest,
  ) {
    return this.inspectionRequestService.create({
      propertyId: id,
      requestedBy: req.user.sub,
      inspectionTypes: body.inspectionTypes ?? [],
      urgency: body.urgency ?? 'standard',
      preferredDate: body.preferredDate,
      preferredTime: body.preferredTime,
      alternateDate: body.alternateDate,
      alternateTime: body.alternateTime,
      inspectorName: body.inspectorName,
      inspectorCompany: body.inspectorCompany,
      inspectorPhone: body.inspectorPhone,
      inspectorEmail: body.inspectorEmail,
      accessMethod: body.accessMethod ?? 'lockbox',
      lockboxCode: body.lockboxCode,
      contactPerson: body.contactPerson,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
      areasOfConcern: body.areasOfConcern,
      specialInstructions: body.specialInstructions,
      notifyClient: body.notifyClient ?? true,
      sendReportTo: body.sendReportTo ?? 'both',
    });
  }

  /**
   * GET /api/v1/properties/:id/inspection-requests
   * List inspection requests for a listing. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Get(':id/inspection-requests')
  async listInspectionRequests(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.inspectionRequestService.list(id, req.user.sub);
  }

  /**
   * POST /api/v1/properties/:id/selling-points
   * Add a selling point to a listing. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Post(':id/selling-points')
  async createSellingPoint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      title: string;
      description: string;
      priority: string;
      category: string;
      tags: string[];
      showInListing: boolean;
      showInFlyer: boolean;
      showOnWebsite: boolean;
    },
    @Request() req: AuthRequest,
  ) {
    return this.sellingPointService.create({
      propertyId: id,
      createdBy: req.user.sub,
      title: body.title,
      description: body.description,
      priority: body.priority ?? 'medium',
      category: body.category ?? 'unique',
      tags: body.tags ?? [],
      showInListing: body.showInListing ?? true,
      showInFlyer: body.showInFlyer ?? true,
      showOnWebsite: body.showOnWebsite ?? true,
    });
  }

  /**
   * GET /api/v1/properties/:id/selling-points
   * List selling points for a listing. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Get(':id/selling-points')
  async listSellingPoints(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.sellingPointService.list(id, req.user.sub);
  }

  /**
   * PATCH /api/v1/properties/:propertyId/selling-points/:pointId
   * Update a selling point. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Patch(':propertyId/selling-points/:pointId')
  async updateSellingPoint(
    @Param('pointId', ParseUUIDPipe) pointId: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      priority?: string;
      category?: string;
      tags?: string[];
      showInListing?: boolean;
      showInFlyer?: boolean;
      showOnWebsite?: boolean;
    },
    @Request() req: AuthRequest,
  ) {
    return this.sellingPointService.update(pointId, req.user.sub, body);
  }

  /**
   * DELETE /api/v1/properties/:propertyId/selling-points/:pointId
   * Delete a selling point. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Delete(':propertyId/selling-points/:pointId')
  async deleteSellingPoint(
    @Param('pointId', ParseUUIDPipe) pointId: string,
    @Request() req: AuthRequest,
  ) {
    await this.sellingPointService.delete(pointId, req.user.sub);
    return { ok: true };
  }

  /**
   * POST /api/v1/properties/:id/notes
   * Create a note for a property. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Post(':id/notes')
  async createNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Record<string, unknown>,
    @Request() req: AuthRequest,
  ) {
    return this.noteService.create({
      propertyId: id,
      createdBy: req.user.sub,
      title: body.title as string,
      content: body.content as string,
      category: (body.category as string) ?? 'general',
      isPinned: (body.isPinned as boolean) ?? false,
      visibility: (body.visibility as string) ?? 'private',
      tags: (body.tags as string[]) ?? [],
      reminder: (body.reminder as string | null) ?? null,
    });
  }

  /**
   * GET /api/v1/properties/:id/notes
   * List notes for a property. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Get(':id/notes')
  async listNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.noteService.list(id, req.user.sub);
  }

  /**
   * PATCH /api/v1/properties/:propertyId/notes/:noteId
   * Update a note. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Patch(':propertyId/notes/:noteId')
  async updateNote(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() body: Record<string, unknown>,
    @Request() req: AuthRequest,
  ) {
    return this.noteService.update(noteId, req.user.sub, {
      title: body.title as string | undefined,
      content: body.content as string | undefined,
      category: body.category as string | undefined,
      isPinned: body.isPinned as boolean | undefined,
      visibility: body.visibility as string | undefined,
      tags: body.tags as string[] | undefined,
      reminder: body.reminder as string | null | undefined,
    });
  }

  /**
   * DELETE /api/v1/properties/:propertyId/notes/:noteId
   * Delete a note. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Delete(':propertyId/notes/:noteId')
  async deleteNote(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Request() req: AuthRequest,
  ) {
    await this.noteService.delete(noteId, req.user.sub);
    return { ok: true };
  }

  /**
   * POST /api/v1/properties/:id/communication-logs
   * Log a communication entry for a listing. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Post(':id/communication-logs')
  async createCommunicationLog(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Record<string, unknown>,
    @Request() req: AuthRequest,
  ) {
    return this.communicationLogService.create({
      propertyId: id,
      loggedBy: req.user.sub,
      type: body['type'] as string,
      contactName: body['contactName'] as string,
      contactRole: (body['contactRole'] as string | undefined) ?? null,
      contactEmail: (body['contactEmail'] as string | undefined) ?? null,
      contactPhone: (body['contactPhone'] as string | undefined) ?? null,
      subject: body['subject'] as string,
      summary: body['summary'] as string,
      communicationDate: body['communicationDate'] as string,
      duration: (body['duration'] as string | undefined) ?? null,
      outcome: (body['outcome'] as string | undefined) ?? null,
      followUpRequired: Boolean(body['followUpRequired']),
      followUpDetails: (body['followUpDetails'] as string | undefined) ?? null,
      followUpDate: (body['followUpDate'] as string | undefined) ?? null,
      tags: (body['tags'] as string[] | undefined) ?? [],
    });
  }

  /**
   * GET /api/v1/properties/:id/communication-logs
   * List communication logs for a listing. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Get(':id/communication-logs')
  async listCommunicationLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.communicationLogService.list(id, req.user.sub);
  }

  /**
   * PATCH /api/v1/properties/:propertyId/communication-logs/:logId
   * Update a communication log entry. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Patch(':propertyId/communication-logs/:logId')
  async updateCommunicationLog(
    @Param('logId', ParseUUIDPipe) logId: string,
    @Body() body: Record<string, unknown>,
    @Request() req: AuthRequest,
  ) {
    return this.communicationLogService.update(logId, req.user.sub, body as any);
  }

  /**
   * DELETE /api/v1/properties/:propertyId/communication-logs/:logId
   * Delete a communication log entry. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Delete(':propertyId/communication-logs/:logId')
  async deleteCommunicationLog(
    @Param('logId', ParseUUIDPipe) logId: string,
    @Request() req: AuthRequest,
  ) {
    await this.communicationLogService.delete(logId, req.user.sub);
    return { ok: true };
  }
}

/**
 * Agent-specific dashboard endpoint.
 */
@Controller('agent')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('agent', 'admin')
export class AgentDashboardController {
  constructor(private readonly propertyService: PropertyService) {}

  /**
   * GET /api/v1/agent/dashboard
   * Listing stats, new inquiries, verification summary.
   */
  @Get('dashboard')
  async getDashboard(@Request() req: AuthRequest) {
    return this.propertyService.getAgentDashboard(req.user.sub, req.user.active_company_id);
  }

  /**
   * GET /api/v1/agent/my-listings
   * All listings for the authenticated agent, including drafts.
   * Optional query param: ?status=draft|active|under_offer|sold|withdrawn|all
   */
  @Get('my-listings')
  async getMyListings(
    @Request() req: AuthRequest,
    @Query('status') status?: string,
  ) {
    return this.propertyService.getMyListings(req.user.sub, status, req.user.active_company_id);
  }

  /**
   * GET /api/v1/agent/dashboard/summary
   * Enhanced summary: listing counts, mandates, viewings, pipeline value.
   */
  @Get('dashboard/summary')
  async getDashboardSummary(@Request() req: AuthRequest) {
    return this.propertyService.getAgentDashboardSummary(req.user.sub, req.user.active_company_id);
  }

  /**
   * GET /api/v1/agent/listings/performance
   * Per-listing views, saves, enquiries, days on market.
   */
  @Get('listings/performance')
  async getListingsPerformance(@Request() req: AuthRequest) {
    return this.propertyService.getAgentListingsPerformance(req.user.sub);
  }

  /**
   * GET /api/v1/agent/listings/activity-feed
   * Recent audit activity across all agent listings.
   */
  @Get('listings/activity-feed')
  async getActivityFeed(@Request() req: AuthRequest) {
    return this.propertyService.getAgentActivityFeed(req.user.sub);
  }

  /**
   * GET /api/v1/agent/commission-pipeline
   * Expected commission from active mandates and in-progress deals.
   */
  @Get('commission-pipeline')
  async getCommissionPipeline(@Request() req: AuthRequest) {
    return this.propertyService.getAgentCommissionPipeline(req.user.sub);
  }

  /** GET /api/v1/agent/my-listings/:id/offers */
  @Get('my-listings/:id/offers')
  async getListingOffers(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.propertyService.getPropertyOffers(req.user.sub, id);
  }

  /** POST /api/v1/agent/my-listings/:id/offers */
  @Post('my-listings/:id/offers')
  async createListingOffer(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      buyerName: string;
      buyerEmail?: string;
      amount: number;
      earnestMoney?: number;
      financing: string;
      contingencies: string[];
      closingDate?: string;
      notes?: string;
    },
  ) {
    return this.propertyService.createPropertyOffer(req.user.sub, id, body);
  }

  /** PATCH /api/v1/agent/my-listings/:id/offers/:offerId/status */
  @Patch('my-listings/:id/offers/:offerId/status')
  async updateListingOfferStatus(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Body() body: { status: string },
  ) {
    return this.propertyService.updatePropertyOfferStatus(req.user.sub, id, offerId, body.status);
  }

  /** POST /api/v1/agent/my-listings/:id/offers/:offerId/counter */
  @Post('my-listings/:id/offers/:offerId/counter')
  async counterListingOffer(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Body() body: {
      counterAmount: number;
      counterEarnestMoney?: number;
      counterClosingDate?: string;
      counterNotes?: string;
    },
  ) {
    return this.propertyService.counterPropertyOffer(req.user.sub, id, offerId, body);
  }
}

/**
 * Seller-facing dashboard: property performance and buyer activity for sellers.
 */
@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('buyer_seller', 'investor', 'admin')
export class SellerDashboardController {
  constructor(private readonly sellerService: SellerDashboardService) {}

  /**
   * GET /api/v1/seller/properties
   * All properties owned by this seller with activity summarised.
   */
  @Get('properties')
  async getProperties(@Request() req: AuthRequest) {
    return this.sellerService.getSellerProperties(req.user.sub);
  }

  /**
   * GET /api/v1/seller/properties/:id/activity
   * Full audit timeline for a single property.
   */
  @Get('properties/:id/activity')
  async getActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.sellerService.getSellerPropertyActivity(req.user.sub, id);
  }

  /**
   * GET /api/v1/seller/properties/:id/viewings
   * All viewings for a property owned by this seller.
   */
  @Get('properties/:id/viewings')
  async getViewings(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.sellerService.getSellerPropertyViewings(req.user.sub, id);
  }

  /**
   * GET /api/v1/seller/properties/:id/offers
   * Sales-stage progression (offers/deals) for a property.
   */
  @Get('properties/:id/offers')
  async getOffers(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.sellerService.getSellerPropertyOffers(req.user.sub, id);
  }
}
