import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfessionalLicencesService } from './professional-licences.service';
import {
  CreateProfessionalLicenceDto,
  VerifyLicenceDto,
} from './professional-licences.dto';
import { JwtAuthGuard } from '../rbac/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { Roles } from '../rbac/roles.decorator';
import { Permissions } from '../rbac/permissions.decorator';
import { AuditService } from '../audit.service';
import { DocumentStorageService } from '../document-storage.service';

type RequestUser = { sub: string; roles: string[] };

@ApiTags('Professional Licences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('users/me/licences')
export class ProfessionalLicencesController {
  constructor(
    private readonly licencesService: ProfessionalLicencesService,
    private readonly auditService: AuditService,
    private readonly documentStorageService: DocumentStorageService,
  ) {}

  @Post()
  @Permissions({ resource: 'users', action: 'self' })
  async submit(
    @Req() req: { user: RequestUser; ip: string; headers: Record<string, string> },
    @Body() dto: CreateProfessionalLicenceDto,
  ) {
    const licence = await this.licencesService.submit(req.user.sub, dto);

    await this.auditService.log({
      eventId: 'licence.submitted',
      actorId: req.user.sub,
      actorRole: req.user.roles[0] ?? null,
      action: 'submit_licence',
      resourceType: 'professional_licence',
      resourceId: licence.id,
      payload: { licenceType: dto.licenceType },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return licence;
  }

  @Get()
  @Permissions({ resource: 'users', action: 'self' })
  async list(@Req() req: { user: RequestUser }) {
    return this.licencesService.findByUser(req.user.sub);
  }

  /** Upload or replace the supporting document for a licence. */
  @ApiConsumes('multipart/form-data')
  @Patch(':id/document')
  @Permissions({ resource: 'users', action: 'self' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Req() req: { user: RequestUser; ip: string; headers: Record<string, string> },
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { publicUrl } = await this.documentStorageService.upload({
      context: 'professional-licences',
      userId: req.user.sub,
      documentType: 'licence-document',
      file,
    });

    await this.licencesService.setDocumentUrl(id, req.user.sub, publicUrl);

    await this.auditService.log({
      eventId: 'licence.document_uploaded',
      actorId: req.user.sub,
      actorRole: req.user.roles[0] ?? null,
      action: 'upload_licence_document',
      resourceType: 'professional_licence',
      resourceId: id,
      payload: {},
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return { success: true, publicUrl };
  }
}

@ApiTags('Admin — Professional Licences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin/licences')
export class AdminProfessionalLicencesController {
  constructor(
    private readonly licencesService: ProfessionalLicencesService,
    private readonly auditService: AuditService,
  ) {}

  @Roles('admin')
  @Get()
  @Permissions({ resource: 'users', action: 'full' })
  async listAll(
    @Query('status') status?: string,
    @Query('licenceType') licenceType?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.licencesService.adminListAll({
      status,
      licenceType,
      page,
      limit: Math.min(limit, 100),
    });
  }

  @Roles('admin')
  @Get('expiring')
  @Permissions({ resource: 'users', action: 'full' })
  async expiring(
    @Query('days', new ParseIntPipe({ optional: true })) days = 90,
  ) {
    return this.licencesService.findExpiring(days);
  }

  @Roles('admin')
  @Get(':id')
  @Permissions({ resource: 'users', action: 'full' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.licencesService.findById(id);
  }

  @Roles('admin')
  @Patch(':id/verify')
  @Permissions({ resource: 'kyc', action: 'approve' })
  async verify(
    @Req() req: { user: RequestUser; ip: string; headers: Record<string, string> },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: VerifyLicenceDto,
  ) {
    const licence = await this.licencesService.adminVerify(id, req.user.sub, dto.status);

    await this.auditService.log({
      eventId: 'licence.verified',
      actorId: req.user.sub,
      actorRole: 'admin',
      action: `licence_${dto.status}`,
      resourceType: 'professional_licence',
      resourceId: id,
      payload: { status: dto.status, notes: dto.notes },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return licence;
  }

  @Roles('admin')
  @Get('user/:userId')
  @Permissions({ resource: 'users', action: 'full' })
  async listForUser(@Param('userId', new ParseUUIDPipe()) userId: string) {
    return this.licencesService.findByUser(userId);
  }
}
