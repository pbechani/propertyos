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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { RolesGuard } from '../identity/rbac/roles.guard';
import { Roles } from '../identity/rbac/roles.decorator';
import { PropertyService } from './property.service';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  SearchPropertiesDto,
} from './property.dto';

type AuthRequest = {
  user: { sub: string; email: string; roles: string[] };
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
    const agentRole = req.user.roles?.[0] ?? 'agent';
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
   * GET /api/v1/properties/:id
   * Public property detail.
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertyService.findById(id);
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
    const agentRole = req.user.roles?.[0] ?? 'agent';
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
    const agentRole = req.user.roles?.[0] ?? 'agent';
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
  @UseInterceptors(FileInterceptor('file'))
  async addMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthRequest,
  ) {
    const agentRole = req.user.roles?.[0] ?? 'agent';
    return this.propertyService.addMedia(
      id,
      req.user.sub,
      agentRole,
      file,
      req.ip,
      req.headers['user-agent'],
    );
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
    const agentRole = req.user.roles?.[0] ?? 'agent';
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
