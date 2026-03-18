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
import { DocumentStorageService } from '../identity/document-storage.service';
import { ValuationService } from './valuation.service';
import { ValuationController, ValuerController, ValuersController } from './valuation.controller';
import { ViewingService } from './viewing.service';
import {
  ViewingController,
  ViewingActionController,
  AgentViewingCalendarController,
  AgentOpenHouseController,
  OpenHouseController,
  BuyerOpenHouseController,
  BuyerViewingController,
  NotificationsController,
} from './viewing.controller';
import { NotificationService } from '../identity/notification.service';
import { NeighbourhoodService, SyndicationService } from './neighbourhood.service';
import {
  PropertyNeighbourhoodController,
  NeighbourhoodController,
  SyndicationController,
  SyndicationStatusController,
} from './neighbourhood.controller';
import { ComparisonService } from './comparison.service';
import { SellerDashboardService } from './seller-dashboard.service';
import { PropertyDocumentService } from './property-document.service';
import { InspectionRequestService } from './inspection-request.service';
import { SellingPointService } from './selling-point.service';
import { NoteService } from './note.service';
import { CommunicationLogService } from './communication-log.service';
import { PropertyConditionService } from './property-condition.service';

@Module({
  controllers: [
    // Static-route controllers must be registered BEFORE parameterised-route
    // controllers to avoid route interception (e.g. GET /properties/compare
    // being swallowed by GET /properties/:id).
    BuyerController,
    InquiryResponseController,
    SavedPropertiesController,
    NotificationsController,
    BuyerViewingController,
    BuyerOpenHouseController,
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
    DocumentStorageService,
    ValuationService,
    ViewingService,
    NeighbourhoodService,
    SyndicationService,
    ComparisonService,
    SellerDashboardService,
    NotificationService,
    PropertyDocumentService,
    PropertyConditionService,
    InspectionRequestService,
    SellingPointService,
    NoteService,
    CommunicationLogService,
  ],
  exports: [PropertyService, PropertyAuditService],
})
export class PropertyModule {}
