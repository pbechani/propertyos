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
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  SearchPropertiesDto,
} from './property.dto';
import { resolvePropertyActorRole } from './property.constants';

type AuthRequest = {
  user: { sub: string; email: string; roles: string[] };
  ip: string;
  headers: { 'user-agent'?: string };
};

type PublicRequest = {
  user?: { sub: string; email: string; roles: string[] };
  ip: string;
  headers: { 'user-agent'?: string };
};

@Controller('properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  /**
   * POST /api/v1/properties
   * Create a new property listing. [agent, admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Post()
  async create(@Body() dto: CreatePropertyDto, @Request() req: AuthRequest) {
    const agentRole = resolvePropertyActorRole(req.user.roles, 'agent');
    return this.propertyService.create(
      req.user.sub,
      agentRole,
      dto,
      req.ip,
      req.headers['user-agent'],
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
   * Update a listing. [agent (own), admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
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
    );
  }

  /**
   * DELETE /api/v1/properties/:id
   * Delete a listing. [agent (own), admin]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
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
    );
    return { message: 'Property deleted successfully' };
  }

  /**
   * POST /api/v1/properties/:id/media
   * Upload photo/video to a listing. [agent (own)]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
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
    );

    return result.length === 1 ? result[0] : { items: result };
  }

  /**
   * DELETE /api/v1/properties/:id/media/:mediaId
   * Remove a media file from a listing. [agent (own)]
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
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
}
