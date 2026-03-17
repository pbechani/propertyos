import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentStorageService } from '../identity/document-storage.service';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { RolesGuard } from '../identity/rbac/roles.guard';
import { Roles } from '../identity/rbac/roles.decorator';
import { MandateService } from './mandate.service';
import {
  CancelMandateDto,
  CreateMandateDto,
  MarkSellerSignedOfflineDto,
  MANDATE_SIGNING_PARTIES,
  MandateSigningParty,
} from './mandate.dto';
import { BadRequestException } from '@nestjs/common';
import { AuthRequest } from '../common/types';

@Controller('properties/:propertyId/mandate')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MandateController {
  constructor(
    private readonly mandateService: MandateService,
    private readonly documentStorageService: DocumentStorageService,
  ) {}

  /**
   * POST /api/v1/properties/:propertyId/mandate
   * Agent creates a mandate draft for a property.
   */
  @Roles('agent', 'admin')
  @Post()
  async create(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() dto: CreateMandateDto,
    @Request() req: AuthRequest,
  ) {
    return this.mandateService.create(
      propertyId,
      req.user.sub,
      dto,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }

  /**
   * GET /api/v1/properties/:propertyId/mandate
   * View mandate(s) for a property. [agent (own), buyer_seller, admin]
   */
  @Roles('agent', 'admin', 'buyer_seller', 'investor')
  @Get()
  async findByProperty(@Param('propertyId', ParseUUIDPipe) propertyId: string) {
    return this.mandateService.findByProperty(propertyId);
  }

  /**
   * POST /api/v1/properties/:propertyId/mandate/:mId/sign
   * Sign mandate as seller or agent.
   */
  @Roles('agent', 'admin', 'buyer_seller')
  @Post(':mId/sign')
  async sign(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('mId', ParseUUIDPipe) mId: string,
    @Body('party') party: string,
    @Request() req: AuthRequest,
  ) {
    if (!MANDATE_SIGNING_PARTIES.includes(party as MandateSigningParty)) {
      throw new BadRequestException('party must be "seller" or "agent"');
    }
    return this.mandateService.sign(
      propertyId,
      mId,
      party as MandateSigningParty,
      req.user.sub,
      req.user.roles[0] ?? 'agent',
      { party: party as MandateSigningParty },
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }

  /**
   * POST /api/v1/properties/:propertyId/mandate/:mId/seller-offline-sign
   * Agent uploads proof document and marks an off-platform seller as signed.
   */
  @Roles('agent', 'admin')
  @Post(':mId/seller-offline-sign')
  @UseInterceptors(FileInterceptor('file'))
  async sellerOfflineSign(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('mId', ParseUUIDPipe) mId: string,
    @Body() dto: MarkSellerSignedOfflineDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Request() req: AuthRequest,
  ) {
    let documentUrl = dto.documentUrl;

    if (file) {
      const uploaded = await this.documentStorageService.upload({
        context: 'mandate-agreements',
        userId: req.user.sub,
        documentType: 'seller_signed_agreement',
        file,
      });
      documentUrl = uploaded.publicUrl;
    }

    if (!documentUrl) {
      throw new BadRequestException('Either a file upload or documentUrl is required');
    }

    return this.mandateService.markSellerSignedOffline(
      propertyId,
      mId,
      { documentUrl },
      req.user.sub,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }

  /**
   * PATCH /api/v1/properties/:propertyId/mandate/:mId/cancel
   * Cancel a mandate.
   */
  @Roles('agent', 'admin', 'buyer_seller')
  @Patch(':mId/cancel')
  async cancel(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('mId', ParseUUIDPipe) mId: string,
    @Body() dto: CancelMandateDto,
    @Request() req: AuthRequest,
  ) {
    return this.mandateService.cancel(
      propertyId,
      mId,
      req.user.sub,
      req.user.roles[0] ?? 'agent',
      dto,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }
}

@Controller('agent/mandates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgentMandateController {
  constructor(private readonly mandateService: MandateService) {}

  /**
   * GET /api/v1/agent/mandates
   * List all active mandates for the authenticated agent.
   */
  @Roles('agent', 'admin')
  @Get()
  async myMandates(@Request() req: AuthRequest) {
    return this.mandateService.findAgentMandates(req.user.sub);
  }
}
