import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { StageService } from './stage.service';
import { StageDocumentService } from './stage-document.service';
import { GovernmentInteractionService } from './government-interaction.service';
import { SaleMessageService } from './sale-message.service';
import { SalesAuditService } from './sales-audit.service';
import { SalesController } from './sales.controller';
import {
  AgentSalesDashboardController,
  ConveyancerCasesDashboardController,
  AdminSalesDashboardController,
} from './dashboard.controller';

@Module({
  controllers: [
    // Dashboard controllers registered first to avoid route ambiguity
    AgentSalesDashboardController,
    ConveyancerCasesDashboardController,
    AdminSalesDashboardController,
    SalesController,
  ],
  providers: [
    SalesService,
    StageService,
    StageDocumentService,
    GovernmentInteractionService,
    SaleMessageService,
    SalesAuditService,
  ],
  exports: [SalesService, SalesAuditService],
})
export class SalesModule {}
