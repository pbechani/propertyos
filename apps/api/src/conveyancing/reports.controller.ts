import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { RolesGuard } from '../identity/rbac/roles.guard';
import { Roles } from '../identity/rbac/roles.decorator';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './conveyancing.dto';
import { AuthRequest } from '../common/types';

// ──────────────────────────────────────────────────────────────────────────────
// Conveyancing Reports  /api/v1/conveyancing/reports
// ──────────────────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('conveyancer', 'admin')
@Controller('conveyancing/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('turnaround')
  async turnaround(@Request() req: AuthRequest, @Query() query: ReportQueryDto) {
    const firmId = req.user.active_company_id ?? req.user.sub;
    return this.reportsService.getTurnaroundReport(firmId, query.fromDate, query.toDate);
  }

  @Get('outstanding-tasks')
  async outstandingTasks(@Request() req: AuthRequest, @Query() query: ReportQueryDto) {
    const firmId = req.user.active_company_id ?? req.user.sub;
    return this.reportsService.getOutstandingTasksReport(firmId, query.fromDate, query.toDate);
  }

  @Get('fee-collection')
  async feeCollection(@Request() req: AuthRequest, @Query() query: ReportQueryDto) {
    const firmId = req.user.active_company_id ?? req.user.sub;
    return this.reportsService.getFeeCollectionReport(firmId, query.fromDate, query.toDate);
  }

  @Get('caseload')
  async caseload(@Request() req: AuthRequest) {
    const firmId = req.user.active_company_id ?? req.user.sub;
    return this.reportsService.getCaseloadReport(firmId);
  }
}
