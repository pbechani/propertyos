import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { Roles } from '../identity/rbac/roles.decorator';
import { RolesGuard } from '../identity/rbac/roles.guard';
import { ConfirmDepositDto } from './financial.dto';
import { EscrowService } from './escrow.service';
import { AccountService } from './account.service';

interface JwtUser {
  sub: string;
  roles: string[];
  active_company_id?: string | null;
}

/**
 * Admin-only financial management endpoints.
 * All routes require admin role.
 */
@Controller('admin/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminFinanceController {
  constructor(
    private readonly escrow: EscrowService,
    private readonly accounts: AccountService,
  ) {}

  /** POST /admin/finance/deposit/confirm — confirm a payment after gateway webhook */
  @Post('deposit/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmDeposit(@Body() dto: ConfirmDepositDto, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.escrow.confirmDeposit({
      paymentRequestId: dto.paymentRequestId,
      gatewayReference: dto.gatewayReference,
      gatewayStatus: dto.gatewayStatus ?? 'admin_confirmed',
      confirmedBy: user.sub,
      ipAddress: req.ip,
    });
  }

  /** GET /admin/finance/accounts/:id/balance — compute live balance */
  @Get('accounts/:id/balance')
  async getBalance(@Param('id', ParseUUIDPipe) id: string) {
    const balance = await this.accounts.computeBalance(id);
    return { accountId: id, balance };
  }

  /** GET /admin/finance/deposits/pending — list all unconfirmed deposits */
  @Get('deposits/pending')
  async getPendingDeposits() {
    return this.escrow.getAllPendingDeposits();
  }

  /** GET /admin/finance/escrow-accounts — list all escrow accounts for the calling user's company */
  @Get('escrow-accounts')
  async getCompanyEscrowAccounts(@Req() req: Request) {
    const user = req.user as JwtUser;
    if (!user.active_company_id) {
      return [];
    }
    return this.escrow.getCompanyEscrowAccounts(user.active_company_id);
  }

  /** GET /admin/finance/releases — list release requests, optionally filtered by ?status= */
  @Get('releases')
  async getReleases(@Query('status') status?: string) {
    return this.escrow.listReleases(status);
  }

  /** POST /admin/finance/release/:id/approve — admin final approval & execution */
  @Post('release/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveRelease(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as JwtUser;
    return this.escrow.adminApproveRelease(id, user.sub, req.ip);
  }

  /** POST /admin/finance/release/:id/reject — admin rejects a release */
  @Post('release/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectRelease(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string },
    @Req() req: Request,
  ) {
    const user = req.user as JwtUser;
    return this.escrow.rejectRelease(id, user.sub, body.reason ?? '', req.ip);
  }
}
