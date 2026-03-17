import { Module } from '@nestjs/common';
// PrismaService is provided globally by DatabaseModule
import { ConveyancingAuditService } from './conveyancing-audit.service';
import { FeeCalculatorService } from './fee-calculator.service';
import { ConveyancingService } from './conveyancing.service';
import { CaseTasksService } from './case-tasks.service';
import { TrustAccountService } from './trust-account.service';
import { InvoiceService } from './invoice.service';
import { DocumentWorkflowService } from './document-workflow.service';
import { ClientPortalService } from './client-portal.service';
import { GovernmentInteractionsService } from './government-interactions.service';
import { ReportsService } from './reports.service';
import {
  ConveyancingCasesController,
  FeeCalculatorController,
  DocumentTemplatesController,
  ClientPortalController,
} from './conveyancing.controller';
import { ReportsController } from './reports.controller';

@Module({
  imports: [],
  controllers: [
    ConveyancingCasesController,
    FeeCalculatorController,
    DocumentTemplatesController,
    ClientPortalController,
    ReportsController,
  ],
  providers: [
    ConveyancingAuditService,
    FeeCalculatorService,
    ConveyancingService,
    CaseTasksService,
    TrustAccountService,
    InvoiceService,
    DocumentWorkflowService,
    ClientPortalService,
    GovernmentInteractionsService,
    ReportsService,
  ],
  exports: [ConveyancingService, TrustAccountService],
})
export class ConveyancingModule {}
