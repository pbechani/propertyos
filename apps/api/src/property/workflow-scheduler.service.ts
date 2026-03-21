import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { WorkflowEngineService } from './workflow-engine.service';

/**
 * Polls every 60 seconds to resume paused workflow enrollments
 * whose delay period has elapsed.
 */
@Injectable()
export class WorkflowSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkflowSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly engine: WorkflowEngineService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      this.engine.processScheduledEnrollments().catch((err: Error) =>
        this.logger.error(`Scheduler tick failed: ${err.message}`),
      );
    }, 60_000);

    this.logger.log('Workflow scheduler started (60 s interval)');
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
