import {
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from './rbac/jwt-auth.guard';
import { RolesGuard } from './rbac/roles.guard';
import { Roles } from './rbac/roles.decorator';
import { SubmitKycDto, ReviewKycDto } from './kyc.dto';
import { KycService } from './kyc.service';
import { DocumentStorageService } from './document-storage.service';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { UsersService } from './users.service';

type RequestUser = {
  sub: string;
  roles: string[];
};

type RequestMeta = {
  user: RequestUser;
  ip: string;
  headers: Record<string, string>;
};

type UploadedFileMap = {
  id_document?: Express.Multer.File[];
  address_proof?: Express.Multer.File[];
  business_registration?: Express.Multer.File[];
  selfie?: Express.Multer.File[];
};

@ApiTags('KYC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kyc')
export class KycController {
  constructor(
    private readonly kycService: KycService,
    private readonly storageService: DocumentStorageService,
    private readonly auditService: AuditService,
  ) {}

  @Post('submit')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'id_document', maxCount: 1 },
      { name: 'address_proof', maxCount: 1 },
      { name: 'business_registration', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
    ]),
  )
  async submit(
    @Req() req: RequestMeta,
    @Body() body: SubmitKycDto,
    @UploadedFiles() files: UploadedFileMap,
  ): Promise<Record<string, unknown>> {
    const existing = await this.kycService.getLatestByUser(req.user.sub);
    if (existing && ['pending', 'under_review'].includes(existing.status)) {
      throw new ConflictException('A KYC submission is already pending review');
    }

    const idDocumentUpload = files.id_document?.[0]
      ? await this.storageService.upload({
          context: 'kyc',
          userId: req.user.sub,
          documentType: 'id_document',
          file: files.id_document[0],
        })
      : null;

    const addressProofUpload = files.address_proof?.[0]
      ? await this.storageService.upload({
          context: 'kyc',
          userId: req.user.sub,
          documentType: 'address_proof',
          file: files.address_proof[0],
        })
      : null;

    const businessRegistrationUpload = files.business_registration?.[0]
      ? await this.storageService.upload({
          context: 'kyc',
          userId: req.user.sub,
          documentType: 'business_registration',
          file: files.business_registration[0],
        })
      : null;

    const selfieUpload = files.selfie?.[0]
      ? await this.storageService.upload({
          context: 'kyc',
          userId: req.user.sub,
          documentType: 'selfie',
          file: files.selfie[0],
        })
      : null;

    const submitted = await this.kycService.submit({
      userId: req.user.sub,
      idDocumentType: body.idDocumentType,
      idDocumentUrl: idDocumentUpload?.storagePath,
      addressProofUrl: addressProofUpload?.storagePath,
      businessRegistrationUrl: businessRegistrationUpload?.storagePath,
      selfieUrl: selfieUpload?.storagePath,
    });

    await this.auditService.log({
      eventId: 'kyc.submitted',
      actorId: req.user.sub,
      actorRole: req.user.roles[0] ?? null,
      action: 'submit_kyc',
      resourceType: 'kyc_verification',
      resourceId: submitted.id,
      payload: { status: submitted.status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return this.kycService.sanitize(submitted);
  }

  @Get('status')
  async status(@Req() req: RequestMeta): Promise<Record<string, unknown>> {
    const record = await this.kycService.getLatestByUser(req.user.sub);
    if (!record) {
      return {
        status: 'not_submitted',
      };
    }

    return this.kycService.sanitize(record);
  }
}

@ApiTags('Admin KYC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/kyc')
export class AdminKycController {
  constructor(
    private readonly kycService: KycService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly usersService: UsersService,
  ) {}

  @Get('pending')
  async pending(): Promise<Record<string, unknown>[]> {
    const rows = await this.kycService.listPending();
    return rows.map((row) => this.kycService.sanitize(row));
  }

  @Get(':id')
  async getOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<Record<string, unknown>> {
    const row = await this.kycService.getById(id);
    return this.kycService.sanitize(row);
  }

  @Post(':id/approve')
  async approve(
    @Req() req: RequestMeta,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: ReviewKycDto,
  ): Promise<Record<string, unknown>> {
    const updated = await this.kycService.approve(id, req.user.sub, body.reviewerNotes);
    const user = await this.usersService.findById(updated.user_id);
    await this.notificationService.sendEmail(user.email, 'KYC approved', 'Your KYC is approved.');
    if (user.phone) {
      await this.notificationService.sendSms(user.phone, 'Your KYC has been approved.');
    }

    await this.auditService.log({
      eventId: 'kyc.approved',
      actorId: req.user.sub,
      actorRole: 'admin',
      action: 'approve_kyc',
      resourceType: 'kyc_verification',
      resourceId: updated.id,
      payload: { previous_status: 'pending', new_status: 'approved' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return this.kycService.sanitize(updated);
  }

  @Post(':id/reject')
  async reject(
    @Req() req: RequestMeta,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: ReviewKycDto,
  ): Promise<Record<string, unknown>> {
    const updated = await this.kycService.reject(id, req.user.sub, body.reviewerNotes);
    const user = await this.usersService.findById(updated.user_id);
    await this.notificationService.sendEmail(user.email, 'KYC rejected', 'Your KYC was rejected.');
    if (user.phone) {
      await this.notificationService.sendSms(user.phone, 'Your KYC has been rejected.');
    }

    await this.auditService.log({
      eventId: 'kyc.rejected',
      actorId: req.user.sub,
      actorRole: 'admin',
      action: 'reject_kyc',
      resourceType: 'kyc_verification',
      resourceId: updated.id,
      payload: { previous_status: 'pending', new_status: 'rejected' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return this.kycService.sanitize(updated);
  }
}
