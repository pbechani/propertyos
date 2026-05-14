import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { Roles } from '../identity/rbac/roles.decorator';
import { RolesGuard } from '../identity/rbac/roles.guard';
import { AccountService } from './account.service';
import { CommissionService } from './commission.service';
import { ExchangeRateService } from './exchange-rate.service';
import { CalculateCommissionDto, ConvertCurrencyDto, LedgerQueryDto } from './financial.dto';
import { LedgerService } from './ledger.service';

@Controller('financial')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancialController {
  constructor(
    private readonly accounts: AccountService,
    private readonly ledger: LedgerService,
    private readonly fx: ExchangeRateService,
    private readonly commission: CommissionService,
  ) {}

  /** GET /financial/accounts/:id — get account details + balance */
  @Get('accounts/:id')
  @Roles('admin', 'buyer_seller', 'agent')
  async getAccount(@Param('id', ParseUUIDPipe) id: string) {
    const account = await this.accounts.getAccountById(id);
    const balance = await this.accounts.computeBalance(id);
    return { account, balance };
  }

  /** GET /financial/ledger — list ledger entries (admin or own account) */
  @Get('ledger')
  @Roles('admin', 'buyer_seller', 'agent')
  async getLedger(@Query() query: LedgerQueryDto) {
    return this.ledger.listForAccount(
      query.accountId ?? '',
      query.limit ?? 20,
      query.offset ?? 0,
    );
  }

  /** POST /financial/convert — currency conversion preview */
  @Post('convert')
  @Roles('admin', 'buyer_seller', 'agent', 'conveyancer')
  async convertCurrency(@Body() dto: ConvertCurrencyDto) {
    const converted = await this.fx.convert(dto.amount, dto.fromCurrency, dto.toCurrency);
    const rate = await this.fx.getRate(dto.fromCurrency, dto.toCurrency);
    return { original: dto.amount, from: dto.fromCurrency, to: dto.toCurrency, rate, converted };
  }

  /** POST /financial/commission/calculate — preview commission breakdown */
  @Post('commission/calculate')
  @Roles('admin', 'agent', 'conveyancer')
  async calculateCommission(@Body() dto: CalculateCommissionDto) {
    return this.commission.calculate(dto.saleAmount, dto.currency);
  }
}
