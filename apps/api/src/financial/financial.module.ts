import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountService } from './account.service';
import { AdminFinanceController } from './admin-finance.controller';
import { CommissionService } from './commission.service';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { ExchangeRateService } from './exchange-rate.service';
import { FinancialAuditService } from './financial-audit.service';
import { FinancialController } from './financial.controller';
import { LedgerService } from './ledger.service';
import { PaymentGatewayService } from './payment-gateway.service';

@Module({
  imports: [ConfigModule],
  controllers: [AdminFinanceController, EscrowController, FinancialController],
  providers: [
    FinancialAuditService,
    ExchangeRateService,
    AccountService,
    LedgerService,
    PaymentGatewayService,
    EscrowService,
    CommissionService,
  ],
  exports: [AccountService, EscrowService, LedgerService, CommissionService, ExchangeRateService],
})
export class FinancialModule {}
