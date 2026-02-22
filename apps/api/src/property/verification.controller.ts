import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { VerificationService } from './verification.service';
import { AdminRejectDto, AdminVerifyDto, SubmitVerificationDto } from './property.dto';

type AuthRequest = {
  user: { sub: string; email: string; roles: string[] };
  ip: string;
  headers: { 'user-agent'?: string };
};

/**
 * Agent verification request endpoint.
 */
@Controller('properties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  /**
   * POST /api/v1/properties/:id/verification-request
   * Submit a title deed for admin review. [agent]
   */
  @Roles('agent', 'admin')
  @Post(':id/verification-request')
  @UseInterceptors(FileInterceptor('titleDeed'))
  async submitRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitVerificationDto,
    @UploadedFile() titleDeedFile: Express.Multer.File | undefined,
    @Request() req: AuthRequest,
  ) {
    if (!titleDeedFile) {
      throw new BadRequestException('titleDeed file is required');
    }

    const role = req.user.roles?.[0] ?? 'agent';
    return this.verificationService.submitVerificationRequest(
      id,
      req.user.sub,
      role,
      dto,
      titleDeedFile,
      req.ip,
      req.headers['user-agent'],
    );
  }
}

/**
 * Admin verification management endpoints.
 */
@Controller('admin/properties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminVerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  /**
   * GET /api/v1/admin/properties/pending-verification
   * List all properties awaiting verification. [admin]
   */
  @Get('pending-verification')
  async getPending(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.verificationService.getPendingVerifications({
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * POST /api/v1/admin/properties/:id/verify
   * Approve a verification request. [admin]
   */
  @Post(':id/verify')
  async verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminVerifyDto,
    @Request() req: AuthRequest,
  ) {
    await this.verificationService.approveVerification(
      id,
      req.user.sub,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    return { message: 'Property verification approved' };
  }

  /**
   * POST /api/v1/admin/properties/:id/reject
   * Reject a verification request. [admin]
   */
  @Post(':id/reject')
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminRejectDto,
    @Request() req: AuthRequest,
  ) {
    await this.verificationService.rejectVerification(
      id,
      req.user.sub,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    return { message: 'Property verification rejected' };
  }
}
