import { Module } from '@nestjs/common';
import { MarketplaceAuditService } from './marketplace-audit.service';
import { ContractorService } from './contractor.service';
import { ContractorController } from './contractor.controller';
import { SupplierService } from './supplier.service';
import { SupplierController } from './supplier.controller';
import { RfqService } from './rfq.service';
import { RfqController } from './rfq.controller';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { JobService } from './job.service';
import { JobController, ContractorMatchController } from './job.controller';
import { ContractorMatchingService } from './contractor-matching.service';

@Module({
  controllers: [
    ContractorController,
    SupplierController,
    RfqController,
    OrderController,
    RatingController,
    MarketController,
    JobController,
    ContractorMatchController,
  ],
  providers: [
    MarketplaceAuditService,
    ContractorService,
    SupplierService,
    RfqService,
    OrderService,
    RatingService,
    MarketService,
    JobService,
    ContractorMatchingService,
  ],
  exports: [ContractorService, SupplierService, RfqService, OrderService, JobService],
})
export class MarketplaceModule {}
