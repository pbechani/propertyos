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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { RolesGuard } from '../identity/rbac/roles.guard';
import { Roles } from '../identity/rbac/roles.decorator';
import { InquiryService } from './inquiry.service';
import { PropertyService } from './property.service';
import { SavedPropertiesService } from './saved-properties.service';
import { CreateInquiryDto, RespondInquiryDto } from './property.dto';
import { resolvePropertyActorRole } from './property.constants';
import { AuthRequest } from '../common/types';

@Controller('properties')
@UseGuards(JwtAuthGuard)
export class BuyerController {
  constructor(
    private readonly inquiryService: InquiryService,
    private readonly savedService: SavedPropertiesService,
    private readonly propertyService: PropertyService,
  ) {}

  /**
   * GET /api/v1/properties/my-listings
   * Returns all listings owned by the authenticated user (by owner_id).
   * Accessible to buyer_seller, investor, admin — all statuses including drafts.
   * Optional query: ?status=draft|active|under_offer|sold|withdrawn|all
   */
  @Get('my-listings')
  async getMyListings(
    @Request() req: AuthRequest,
    @Query('status') status?: string,
  ) {
    return this.propertyService.getOwnerListings(req.user.sub, status, req.user.active_company_id);
  }

  /**
   * POST /api/v1/properties/:id/save
   * Save a property to the buyer's shortlist.
   */
  @Post(':id/save')
  async save(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    await this.savedService.save(req.user.sub, id);
    return { message: 'Property saved' };
  }

  /**
   * DELETE /api/v1/properties/:id/save
   * Remove a property from the buyer's shortlist.
   */
  @Delete(':id/save')
  async unsave(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    await this.savedService.unsave(req.user.sub, id);
    return { message: 'Property removed from saved list' };
  }

  /**
   * POST /api/v1/properties/:id/inquiries
   * Submit a viewing / offer / question inquiry.
   */
  @Post(':id/inquiries')
  async createInquiry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateInquiryDto,
    @Request() req: AuthRequest,
  ) {
    const role = resolvePropertyActorRole(req.user.roles, 'buyer_seller');
    return this.inquiryService.create(
      id,
      req.user.sub,
      role,
      dto,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }

  /**
   * GET /api/v1/properties/:id/inquiries
   * List inquiries — accessible by the listing agent.
   */
  @UseGuards(RolesGuard)
  @Roles('agent', 'admin')
  @Get(':id/inquiries')
  async listInquiries(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req?: AuthRequest,
  ) {
    const agentRole = resolvePropertyActorRole(req!.user.roles, 'agent');
    return this.inquiryService.findByProperty(id, req!.user.sub, agentRole, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }
}

/**
 * Inquiry response (agent-side).
 */
@Controller('inquiries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('agent', 'admin')
export class InquiryResponseController {
  constructor(private readonly inquiryService: InquiryService) {}

  /**
   * PATCH /api/v1/inquiries/:id/respond
   * Agent responds to an inquiry.
   */
  @Patch(':id/respond')
  async respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondInquiryDto,
    @Request() req: AuthRequest,
  ) {
    const agentRole = resolvePropertyActorRole(req.user.roles, 'agent');
    return this.inquiryService.respond(
      id,
      req.user.sub,
      agentRole,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }
}

/**
 * Saved properties — buyer portal.
 */
@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class SavedPropertiesController {
  constructor(private readonly savedService: SavedPropertiesService) {}

  /**
   * GET /api/v1/users/me/saved-properties
   */
  @Get('saved-properties')
  async getSaved(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req?: AuthRequest,
  ) {
    return this.savedService.findSavedByUser(req!.user.sub, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }
}
