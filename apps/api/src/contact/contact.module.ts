import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from '../identity/notification.service';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [ConfigModule],
  controllers: [ContactController],
  providers: [ContactService, NotificationService],
})
export class ContactModule {}
