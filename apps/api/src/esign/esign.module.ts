import { Module, forwardRef } from '@nestjs/common';
import { EsignService } from './esign.service';
import { EsignWebhookController } from './esign-webhook.controller';
import { EsignWebhookDispatcher } from './esign-webhook.dispatcher';
import { PropertyModule } from '../property/property.module';
import { SalesModule } from '../sales/sales.module';
import { ConveyancingModule } from '../conveyancing/conveyancing.module';

@Module({
  imports: [
    forwardRef(() => PropertyModule),
    forwardRef(() => SalesModule),
    forwardRef(() => ConveyancingModule),
  ],
  controllers: [EsignWebhookController],
  providers: [EsignService, EsignWebhookDispatcher],
  exports: [EsignService],
})
export class EsignModule {}
