import { Module } from '@nestjs/common';
import { MindsDBService } from './mindsdb.service';

/**
 * MindsDB Module — Sprint 11 Predictive ML Layer
 *
 * Exposes MindsDBService for use across the platform:
 *   - Risk scoring  (analytics module)
 *   - Property valuation predictions  (property module)
 *   - Material price forecasting  (marketplace / BOQ module)
 *   - Project delay risk  (construction module)
 *
 * The service degrades gracefully when MindsDB is unreachable.
 *
 * Import in any feature module:
 *   imports: [MindsDBModule]
 *   // then inject: constructor(private mindsdb: MindsDBService) {}
 */
@Module({
  providers: [MindsDBService],
  exports: [MindsDBService],
})
export class MindsDBModule {}
