import { Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyController, AgentDashboardController, SellerDashboardController } from './property.controller';
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
import { MandateService } from './mandate.service';
import { MandateController, AgentMandateController } from './mandate.controller';
import { ValuationService } from './valuation.service';
import { ValuationController, ValuerController, ValuersController } from './valuation.controller';
import { ViewingService } from './viewing.service';
import { ViewingController, ViewingActionController, AgentViewingCalendarController, AgentOpenHouseController, OpenHouseController } from './viewing.controller';
import { NeighbourhoodService, SyndicationService } from './neighbourhood.service';
import {
  PropertyNeighbourhoodController,
  NeighbourhoodController,
  SyndicationController,
  SyndicationStatusController,
} from './neighbourhood.controller';
import { ComparisonService } from './comparison.service';
import { SellerDashboardService } from './seller-dashboard.service';

@Module({
  controllers: [
    // Static-route controllers must be registered BEFORE parameterised-route
    // controllers to avoid route interception (e.g. GET /properties/compare
    // being swallowed by GET /properties/:id).
    BuyerController,
    InquiryResponseController,
    SavedPropertiesController,
    PropertyController,
    AgentDashboardController,
    SellerDashboardController,
    VerificationController,
    AdminVerificationController,
    FraudController,
    AdminFraudController,
    MandateController,
    AgentMandateController,
    ValuationController,
    ValuerController,
    ValuersController,
    ViewingController,
    ViewingActionController,
    AgentViewingCalendarController,
    AgentOpenHouseController,
    OpenHouseController,
    PropertyNeighbourhoodController,
    NeighbourhoodController,
    SyndicationController,
    SyndicationStatusController,
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
    MandateService,
    ValuationService,
    ViewingService,
    NeighbourhoodService,
    SyndicationService,
    ComparisonService,
    SellerDashboardService,
  ],
  exports: [PropertyService, PropertyAuditService],
})
export class PropertyModule {}
