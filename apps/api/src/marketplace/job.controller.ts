import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { AuthRequest } from '../common/types';
import { JobService } from './job.service';
import { ContractorMatchingService } from './contractor-matching.service';
import {
  CreateJobDto,
  CreateJobQuoteDto,
  CreateMilestoneDto,
  FindContractorsDto,
  JobListQueryDto,
  MarkReadDto,
  RespondToQuoteDto,
  SendMessageDto,
  UpdateJobDto,
  UpdateMilestoneStatusDto,
} from './job.dto';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly matchingService: ContractorMatchingService,
  ) {}

  // ─── Job CRUD ─────────────────────────────────────────────────────────────

  /** POST /jobs — client creates a new job (starts as DRAFT) */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createJob(@Body() dto: CreateJobDto, @Req() req: AuthRequest) {
    return this.jobService.createJob(dto, req.user.sub, req.ip);
  }

  /** GET /jobs — public feed of OPEN jobs (contractor job feed) */
  @Get()
  listJobs(@Query() query: JobListQueryDto) {
    return this.jobService.listJobs(query);
  }

  /** GET /jobs/my — client's own jobs */
  @Get('my')
  myJobs(@Query('status') status: string | undefined, @Req() req: AuthRequest) {
    return this.jobService.listClientJobs(req.user.sub, status);
  }

  /** GET /jobs/assigned — contractor's assigned jobs */
  @Get('assigned')
  assignedJobs(
    @Query('status') status: string | undefined,
    @Req() req: AuthRequest,
  ) {
    return this.jobService.listContractorJobs(req.user.sub, status);
  }

  /** GET /jobs/feed — smart contractor job feed with geo + exclusion */
  @Get('feed')
  jobFeed(
    @Req() req: AuthRequest,
    @Query('category') category: string | undefined,
    @Query('lat') lat: string | undefined,
    @Query('lng') lng: string | undefined,
    @Query('radiusKm') radiusKm: string | undefined,
    @Query('limit') limit: string | undefined,
    @Query('offset') offset: string | undefined,
  ) {
    return this.matchingService.getJobFeed(
      req.user.sub,
      category,
      lat ? parseFloat(lat) : undefined,
      lng ? parseFloat(lng) : undefined,
      radiusKm ? parseFloat(radiusKm) : 50,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  /** GET /jobs/:id — single job with quotes, milestones, conversation */
  @Get(':id')
  getJob(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobService.getJobById(id);
  }

  /** PATCH /jobs/:id — client updates job (DRAFT or OPEN only) */
  @Patch(':id')
  updateJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobDto,
    @Req() req: AuthRequest,
  ) {
    return this.jobService.updateJob(id, dto, req.user.sub);
  }

  /** POST /jobs/:id/publish — client publishes DRAFT → OPEN */
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  publishJob(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) {
    return this.jobService.publishJob(id, req.user.sub, req.ip);
  }

  /** POST /jobs/:id/start — contractor starts ASSIGNED job → IN_PROGRESS */
  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  startJob(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) {
    return this.jobService.startJob(id, req.user.sub, req.ip);
  }

  /** POST /jobs/:id/complete — client marks job as COMPLETED */
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  completeJob(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) {
    return this.jobService.completeJob(id, req.user.sub, req.ip);
  }

  /** POST /jobs/:id/cancel — client cancels job */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelJob(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthRequest) {
    return this.jobService.cancelJob(id, req.user.sub, req.ip);
  }

  // ─── Quotes ───────────────────────────────────────────────────────────────

  /** POST /jobs/:id/quotes — contractor submits a quote */
  @Post(':id/quotes')
  @HttpCode(HttpStatus.CREATED)
  submitQuote(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Body() dto: CreateJobQuoteDto,
    @Req() req: AuthRequest,
  ) {
    return this.jobService.submitQuote(jobId, dto, req.user.sub, req.ip);
  }

  /** GET /jobs/:id/quotes — list quotes (client sees all, contractor sees own) */
  @Get(':id/quotes')
  listQuotes(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Req() req: AuthRequest,
  ) {
    return this.jobService.listJobQuotes(jobId, req.user.sub);
  }

  /** POST /jobs/:id/quotes/:quoteId/respond — client accepts/rejects a quote */
  @Post(':id/quotes/:quoteId/respond')
  @HttpCode(HttpStatus.OK)
  respondToQuote(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @Body() dto: RespondToQuoteDto,
    @Req() req: AuthRequest,
  ) {
    return this.jobService.respondToQuote(jobId, quoteId, dto, req.user.sub, req.ip);
  }

  // ─── Milestones ───────────────────────────────────────────────────────────

  /** POST /jobs/:id/milestones — client adds a milestone */
  @Post(':id/milestones')
  @HttpCode(HttpStatus.CREATED)
  createMilestone(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Body() dto: CreateMilestoneDto,
    @Req() req: AuthRequest,
  ) {
    return this.jobService.createMilestone(jobId, dto, req.user.sub);
  }

  /** GET /jobs/:id/milestones */
  @Get(':id/milestones')
  listMilestones(@Param('id', ParseUUIDPipe) jobId: string) {
    return this.jobService.listMilestones(jobId);
  }

  /** PATCH /jobs/:id/milestones/:milestoneId/status — contractor or client updates status */
  @Patch(':id/milestones/:milestoneId/status')
  updateMilestoneStatus(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
    @Body() dto: UpdateMilestoneStatusDto,
    @Req() req: AuthRequest,
  ) {
    return this.jobService.updateMilestoneStatus(
      jobId,
      milestoneId,
      dto,
      req.user.sub,
      req.ip,
    );
  }

  // ─── Messaging ────────────────────────────────────────────────────────────

  /** POST /jobs/:id/messages */
  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  sendMessage(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Body() dto: SendMessageDto,
    @Req() req: AuthRequest,
  ) {
    return this.jobService.sendMessage(jobId, dto, req.user.sub, req.ip);
  }

  /** GET /jobs/:id/messages?limit=50&before=<iso> */
  @Get(':id/messages')
  getMessages(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Req() req: AuthRequest,
    @Query('limit') limit: string | undefined,
    @Query('before') before: string | undefined,
  ) {
    return this.jobService.getMessages(
      jobId,
      req.user.sub,
      limit ? parseInt(limit, 10) : 50,
      before,
    );
  }

  /** POST /jobs/:id/messages/read — mark messages as read */
  @Post(':id/messages/read')
  @HttpCode(HttpStatus.OK)
  markRead(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Body() dto: MarkReadDto,
    @Req() req: AuthRequest,
  ) {
    return this.jobService.markMessagesRead(jobId, dto, req.user.sub);
  }
}

// ─── Contractor Matching (separate route) ─────────────────────────────────────

@Controller('contractors/match')
@UseGuards(JwtAuthGuard)
export class ContractorMatchController {
  constructor(private readonly matchingService: ContractorMatchingService) {}

  /** POST /contractors/match — find matching contractors for a job */
  @Post()
  @HttpCode(HttpStatus.OK)
  findContractors(@Body() dto: FindContractorsDto) {
    return this.matchingService.findMatchingContractors(dto);
  }
}
