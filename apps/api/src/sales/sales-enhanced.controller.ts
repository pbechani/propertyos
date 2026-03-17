// ─────────────────────────────────────────────────────────────────────────────
// Sprint 04 Enhanced — Sales Enhanced Controller
// Provides OTP, Deal Room, Bond, Compliance, Disbursement, Disclosure, Checklist
// Base path: /api/v1/sales/:saleId
// ─────────────────────────────────────────────────────────────────────────────
import {
  Body,
  Controller,
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
import { OtpService } from './otp.service';
import { DealRoomService } from './deal-room.service';
import { BondApplicationService } from './bond-application.service';
import { ComplianceService } from './compliance.service';
import { DisbursementService } from './disbursement.service';
import { SellerDisclosureService } from './seller-disclosure.service';
import { PostSaleChecklistService } from './post-sale-checklist.service';
import {
  ApproveDisbursementDto,
  CounterOfferDto,
  CreateBondApplicationDto,
  CreateDisbursementInstructionDto,
  CreateOtpDto,
  CreateSellerDisclosureDto,
  MarkReadDto,
  SendDealRoomMessageDto,
  SetupComplianceRequirementsDto,
  SignOtpDto,
  SignSellerDisclosureDto,
  UpdateBondApplicationDto,
  UpdateComplianceStatusDto,
  UpdatePostSaleChecklistDto,
  WithdrawOtpDto,
} from './sales-enhanced.dto';
import { AuthRequest } from '../common/types';

@UseGuards(JwtAuthGuard)
@Controller('sales/:saleId')
export class SalesEnhancedController {
  constructor(
    private readonly otpService: OtpService,
    private readonly dealRoomService: DealRoomService,
    private readonly bondService: BondApplicationService,
    private readonly complianceService: ComplianceService,
    private readonly disbursementService: DisbursementService,
    private readonly disclosureService: SellerDisclosureService,
    private readonly checklistService: PostSaleChecklistService,
  ) {}

  // ── OTP ───────────────────────────────────────────────────────────────────

  /** POST /api/v1/sales/:saleId/otp — Generate OTP [agent, admin] */
  @Post('otp')
  createOtp(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Body() dto: CreateOtpDto,
    @Request() req: AuthRequest,
  ) {
    return this.otpService.createOtp(
      saleId,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /** GET /api/v1/sales/:saleId/otp/versions — List all OTP versions */
  @Get('otp/versions')
  listOtpVersions(@Param('saleId', ParseUUIDPipe) saleId: string) {
    return this.otpService.listVersions(saleId);
  }

  /** POST /api/v1/sales/:saleId/otp/:otpId/sign — Sign OTP [buyer|seller] */
  @Post('otp/:otpId/sign')
  signOtp(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Param('otpId', ParseUUIDPipe) otpId: string,
    @Body() dto: SignOtpDto,
    @Request() req: AuthRequest,
  ) {
    return this.otpService.signOtp(
      saleId,
      otpId,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /** POST /api/v1/sales/:saleId/otp/:otpId/counter-offer — Counter-offer [seller via agent] */
  @Post('otp/:otpId/counter-offer')
  counterOffer(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Param('otpId', ParseUUIDPipe) otpId: string,
    @Body() dto: CounterOfferDto,
    @Request() req: AuthRequest,
  ) {
    return this.otpService.counterOffer(
      saleId,
      otpId,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /** POST /api/v1/sales/:saleId/otp/:otpId/withdraw — Withdraw OTP [buyer] */
  @Post('otp/:otpId/withdraw')
  withdrawOtp(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Param('otpId', ParseUUIDPipe) otpId: string,
    @Body() dto: WithdrawOtpDto,
    @Request() req: AuthRequest,
  ) {
    return this.otpService.withdrawOtp(
      saleId,
      otpId,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /** GET /api/v1/sales/:saleId/offers/compare — Compare active offers [seller, agent] */
  @Get('offers/compare')
  compareOffers(@Param('saleId', ParseUUIDPipe) saleId: string) {
    return this.otpService.compareOffers(saleId);
  }

  // ── Deal Room ──────────────────────────────────────────────────────────────

  /** POST /api/v1/sales/:saleId/deal-room/messages */
  @Post('deal-room/messages')
  sendMessage(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Body() dto: SendDealRoomMessageDto,
    @Request() req: AuthRequest,
  ) {
    return this.dealRoomService.sendMessage(saleId, req.user.sub, req.user.roles, dto);
  }

  /** GET /api/v1/sales/:saleId/deal-room/messages */
  @Get('deal-room/messages')
  listMessages(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Query('otpId') otpId: string | undefined,
    @Request() req: AuthRequest,
  ) {
    return this.dealRoomService.listMessages(saleId, req.user.roles, otpId);
  }

  /** PATCH /api/v1/sales/:saleId/deal-room/messages/:messageId/read */
  @Patch('deal-room/messages/:messageId/read')
  markRead(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() dto: MarkReadDto,
    @Request() req: AuthRequest,
  ) {
    return this.dealRoomService.markRead(saleId, messageId, req.user.sub, dto);
  }

  // ── Bond Application ───────────────────────────────────────────────────────

  /** POST /api/v1/sales/:saleId/bond-application */
  @Post('bond-application')
  createBondApplication(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Body() dto: CreateBondApplicationDto,
    @Request() req: AuthRequest,
  ) {
    return this.bondService.createBondApplication(
      saleId,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /** PATCH /api/v1/sales/:saleId/bond-application/:appId/update */
  @Patch('bond-application/:appId/update')
  updateBondApplication(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Param('appId', ParseUUIDPipe) appId: string,
    @Body() dto: UpdateBondApplicationDto,
    @Request() req: AuthRequest,
  ) {
    return this.bondService.updateBondApplication(
      saleId,
      appId,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /** GET /api/v1/sales/:saleId/bond-application */
  @Get('bond-application')
  getBondApplication(@Param('saleId', ParseUUIDPipe) saleId: string) {
    return this.bondService.getBondApplication(saleId);
  }

  // ── Compliance ─────────────────────────────────────────────────────────────

  /** POST /api/v1/sales/:saleId/compliance-requirements [conveyancer] */
  @Post('compliance-requirements')
  setupCompliance(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Body() dto: SetupComplianceRequirementsDto,
    @Request() req: AuthRequest,
  ) {
    return this.complianceService.setupRequirements(
      saleId,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /** PATCH /api/v1/sales/:saleId/compliance/:certType/status */
  @Patch('compliance/:certType/status')
  updateComplianceStatus(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Param('certType') certType: string,
    @Body() dto: UpdateComplianceStatusDto,
    @Request() req: AuthRequest,
  ) {
    return this.complianceService.updateCertStatus(
      saleId,
      certType,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /** GET /api/v1/sales/:saleId/compliance-status */
  @Get('compliance-status')
  getComplianceStatus(@Param('saleId', ParseUUIDPipe) saleId: string) {
    return this.complianceService.getComplianceStatus(saleId);
  }

  // ── Disbursement ───────────────────────────────────────────────────────────

  /** POST /api/v1/sales/:saleId/disbursement-instructions */
  @Post('disbursement-instructions')
  createDisbursement(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Body() dto: CreateDisbursementInstructionDto,
    @Request() req: AuthRequest,
  ) {
    return this.disbursementService.createInstruction(
      saleId,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /** GET /api/v1/sales/:saleId/disbursement-instructions */
  @Get('disbursement-instructions')
  getDisbursement(@Param('saleId', ParseUUIDPipe) saleId: string) {
    return this.disbursementService.getInstruction(saleId);
  }

  /** PATCH /api/v1/sales/:saleId/disbursement-instructions/:instrId/approve */
  @Patch('disbursement-instructions/:instrId/approve')
  approveDisbursement(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Param('instrId', ParseUUIDPipe) instrId: string,
    @Body() dto: ApproveDisbursementDto,
    @Request() req: AuthRequest,
  ) {
    return this.disbursementService.approveInstruction(
      saleId,
      instrId,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ── Seller Disclosure ──────────────────────────────────────────────────────

  /** POST /api/v1/sales/:saleId/seller-disclosure */
  @Post('seller-disclosure')
  createDisclosure(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Body() dto: CreateSellerDisclosureDto,
    @Request() req: AuthRequest,
  ) {
    return this.disclosureService.createDisclosure(
      saleId,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  /** GET /api/v1/sales/:saleId/seller-disclosure */
  @Get('seller-disclosure')
  getDisclosure(@Param('saleId', ParseUUIDPipe) saleId: string) {
    return this.disclosureService.getDisclosure(saleId);
  }

  /** POST /api/v1/sales/:saleId/seller-disclosure/sign */
  @Post('seller-disclosure/sign')
  signDisclosure(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Body() dto: SignSellerDisclosureDto,
    @Request() req: AuthRequest,
  ) {
    return this.disclosureService.signDisclosure(
      saleId,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  // ── Post-Sale Checklist ────────────────────────────────────────────────────

  /** GET /api/v1/sales/:saleId/post-sale-checklist */
  @Get('post-sale-checklist')
  getChecklist(@Param('saleId', ParseUUIDPipe) saleId: string) {
    return this.checklistService.getOrCreate(saleId);
  }

  /** PATCH /api/v1/sales/:saleId/post-sale-checklist */
  @Patch('post-sale-checklist')
  updateChecklist(
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Body() dto: UpdatePostSaleChecklistDto,
    @Request() req: AuthRequest,
  ) {
    return this.checklistService.update(
      saleId,
      req.user.sub,
      req.user.roles,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
