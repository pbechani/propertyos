import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../rbac/jwt-auth.guard';
import { CompanyContextGuard } from './guards/company-context.guard';
import { CompanyAdminGuard } from './guards/company-admin.guard';
import { OrphanedTasksService, TaskStatus } from './orphaned-tasks.service';
import { AssignOrphanedTaskDto } from './dto/member.dto';
import { JwtPayload } from '../auth/auth.types';

type RequestWithUser = {
  ip: string;
  headers: Record<string, string>;
  user: JwtPayload;
};

@ApiTags('Orphaned Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyContextGuard, CompanyAdminGuard)
@Controller('companies/:id/orphaned-tasks')
export class OrphanedTasksController {
  constructor(private readonly orphanedTasksService: OrphanedTasksService) {}

  @Get()
  list(
    @Param('id') id: string,
    @Query('status') status?: TaskStatus,
  ) {
    return this.orphanedTasksService.list(id, status);
  }

  @Patch(':taskId/assign')
  assign(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() body: AssignOrphanedTaskDto,
  ) {
    return this.orphanedTasksService.assign(id, taskId, body.assignee_id, req.user.sub, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post(':taskId/close')
  close(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('taskId') taskId: string,
  ) {
    return this.orphanedTasksService.close(id, taskId, req.user.sub, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }
}
