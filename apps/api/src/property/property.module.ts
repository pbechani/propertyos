import { Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyController, AgentDashboardController } from './property.controller';
import { VerificationService } from './verification.service';
import { VerificationController, AdminVerificationController } from './verification.controller';
import { InquiryService } from './inquiry.service';
import { FraudService } from './fraud.service';
import { FraudController, AdminFraudController } from './fraud.controller';
import { BuyerController, InquiryResponseController, SavedPropertiesController } from './buyer.controller';
import { SavedPropertiesService } from './saved-properties.service';
import { MediaStorageService } from './media-storage.service';
import { PropertyAuditService } from './property-audit.service';
import { VerificationStorageService } from './verification-storage.service';

@Module({
  controllers: [
    PropertyController,
    AgentDashboardController,
    VerificationController,
    AdminVerificationController,
    BuyerController,
    InquiryResponseController,
    SavedPropertiesController,
    FraudController,
    AdminFraudController,
  ],
  providers: [
    PropertyService,
    VerificationService,
    InquiryService,
    FraudService,
    SavedPropertiesService,
    MediaStorageService,
    PropertyAuditService,
    VerificationStorageService,
  ],
  exports: [PropertyService, PropertyAuditService],
})
export class PropertyModule {}
