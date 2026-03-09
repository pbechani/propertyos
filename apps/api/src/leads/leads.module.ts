import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadActivityService } from './lead-activity.service';
import { LeadTaskService } from './lead-task.service';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, LeadActivityService, LeadTaskService],
  exports: [LeadsService],
})
export class LeadsModule {}
