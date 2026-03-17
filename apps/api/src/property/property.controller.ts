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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { RolesGuard } from '../identity/rbac/roles.guard';
import { Roles } from '../identity/rbac/roles.decorator';
import { PropertyService } from './property.service';
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
    return this.propertyService.getAgentDashboard(req.user.sub);
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
    return this.propertyService.getMyListings(req.user.sub, status);
  }

  /**
   * GET /api/v1/agent/dashboard/summary
   * Enhanced summary: listing counts, mandates, viewings, pipeline value.
   */
  @Get('dashboard/summary')
  async getDashboardSummary(@Request() req: AuthRequest) {
    return this.propertyService.getAgentDashboardSummary(req.user.sub);
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
