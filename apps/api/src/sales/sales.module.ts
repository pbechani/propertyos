import { Module, forwardRef } from '@nestjs/common';
import { EsignModule } from '../esign/esign.module';
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
// ── Sprint 04 Enhanced ────────────────────────────────────────────────────────
import { OtpService } from './otp.service';
import { DealRoomService } from './deal-room.service';
import { BondApplicationService } from './bond-application.service';
import { ComplianceService } from './compliance.service';
import { DisbursementService } from './disbursement.service';
import { SellerDisclosureService } from './seller-disclosure.service';
import { PostSaleChecklistService } from './post-sale-checklist.service';
import { SalesEnhancedController } from './sales-enhanced.controller';

@Module({
  imports: [forwardRef(() => EsignModule)],
  controllers: [
    // Dashboard controllers registered first to avoid route ambiguity
    AgentSalesDashboardController,
    ConveyancerCasesDashboardController,
    AdminSalesDashboardController,
    SalesController,
    SalesEnhancedController,
  ],
  providers: [
    SalesService,
    StageService,
    StageDocumentService,
    GovernmentInteractionService,
    SaleMessageService,
    SalesAuditService,
    // Sprint 04 Enhanced
    OtpService,
    DealRoomService,
    BondApplicationService,
    ComplianceService,
    DisbursementService,
    SellerDisclosureService,
    PostSaleChecklistService,
  ],
  exports: [SalesService, SalesAuditService, OtpService],
})
export class SalesModule {}
