import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { Roles } from '../identity/rbac/roles.decorator';
import { RolesGuard } from '../identity/rbac/roles.guard';
import {
  ApproveEscrowReleaseDto,
  InitiateDepositDto,
  RejectEscrowReleaseDto,
  RequestEscrowReleaseDto,
} from './financial.dto';
import { EscrowService } from './escrow.service';
import { AccountService } from './account.service';

interface JwtUser {
  sub: string;
  roles: string[];
}

@Controller('escrow')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EscrowController {
  constructor(
    private readonly escrow: EscrowService,
    private readonly accounts: AccountService,
  ) {}

  /** POST /escrow/deposit — initiate a payment request against an escrow account.
   *  Accepts either escrowAccountId or saleId (auto-resolves to the sale's escrow account). */
  @Post('deposit')
  @Roles('buyer_seller', 'admin')
  async initiateDeposit(@Body() dto: InitiateDepositDto, @Req() req: Request) {
    const user = req.user as JwtUser;
    let escrowAccountId = dto.escrowAccountId;
    if (!escrowAccountId && dto.saleId) {
      const acct = await this.accounts.getOrCreateEscrowAccount(dto.saleId, dto.currency);
      escrowAccountId = acct.id;
    }
    if (!escrowAccountId) {
      throw new BadRequestException('Either escrowAccountId or saleId is required.');
    }
    return this.escrow.initiateDeposit({
      escrowAccountId,
      amount: dto.amount,
      currency: dto.currency,
      paymentMethod: dto.paymentMethod,
      initiatedBy: user.sub,
      idempotencyKey: dto.idempotencyKey,
      ipAddress: req.ip,
    });
  }

  /** GET /escrow/by-sale/:saleId — get (or lazily create) the escrow account summary for a sale */
  @Get('by-sale/:saleId')
  @Roles('buyer_seller', 'agent', 'conveyancer', 'admin')
  async getSummaryBySaleId(@Param('saleId', ParseUUIDPipe) saleId: string) {
    return this.escrow.getSummaryBySaleId(saleId);
  }

  /** GET /escrow/:escrowAccountId/summary — balance, conditions, pending releases */
  @Get(':escrowAccountId/summary')
  @Roles('buyer_seller', 'agent', 'conveyancer', 'admin')
  async getSummary(@Param('escrowAccountId', ParseUUIDPipe) escrowAccountId: string) {
    return this.escrow.getEscrowSummary(escrowAccountId);
  }

  /** POST /escrow/release/request — request a release (buyer-initiated) */
  @Post('release/request')
  @Roles('buyer_seller', 'admin')
  async requestRelease(@Body() dto: RequestEscrowReleaseDto, @Req() req: Request) {
    const user = req.user as JwtUser;
    // Resolve destination: use provided id or fall back to the platform incoming account
    let destinationAccountId = dto.destinationAccountId;
    if (!destinationAccountId) {
      const platform = await this.accounts.getPlatformAccount();
      destinationAccountId = platform!.id;
    }
    return this.escrow.requestRelease({
      escrowAccountId: dto.escrowAccountId,
      releaseAmount: dto.releaseAmount,
      currency: dto.currency,
      destinationAccountId,
      reason: dto.reason,
      requestedBy: user.sub,
      mfaVerified: !!dto.mfaToken,
      ipAddress: req.ip,
    });
  }

  /** POST /escrow/release/:releaseId/buyer-approve — buyer confirms consent */
  @Post('release/:releaseId/buyer-approve')
  @Roles('buyer_seller')
  async buyerApprove(@Param('releaseId', ParseUUIDPipe) releaseId: string, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.escrow.buyerApproveRelease(releaseId, user.sub, req.ip);
  }

  /** POST /escrow/release/:releaseId/admin-approve — admin final approval & execution */
  @Post('release/:releaseId/admin-approve')
  @Roles('admin')
  async adminApprove(@Param('releaseId', ParseUUIDPipe) releaseId: string, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.escrow.adminApproveRelease(releaseId, user.sub, req.ip);
  }

  /** POST /escrow/release/:releaseId/reject — admin rejects a release */
  @Post('release/:releaseId/reject')
  @Roles('admin')
  async rejectRelease(
    @Param('releaseId', ParseUUIDPipe) releaseId: string,
    @Body() dto: RejectEscrowReleaseDto,
    @Req() req: Request,
  ) {
    const user = req.user as JwtUser;
    return this.escrow.rejectRelease(releaseId, user.sub, dto.rejectionReason, req.ip);
  }

  /** GET /escrow/release/:releaseId — get release details */
  @Get('release/:releaseId')
  @Roles('buyer_seller', 'agent', 'conveyancer', 'admin')
  async getRelease(@Param('releaseId', ParseUUIDPipe) releaseId: string) {
    return this.escrow.getRelease(releaseId);
  }
}
