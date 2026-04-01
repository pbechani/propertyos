import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { AuthRequest } from '../common/types';
import { RfqService } from './rfq.service';
import { CreateRfqDto, RfqListQueryDto, SubmitQuoteDto } from './marketplace.dto';

@Controller('rfqs')
@UseGuards(JwtAuthGuard)
export class RfqController {
  constructor(private readonly rfqService: RfqService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRfqDto, @Req() req: AuthRequest) {
    return this.rfqService.create(dto, req.user.sub, req.ip);
  }

  @Get()
  findAll(@Query() query: RfqListQueryDto) {
    return this.rfqService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rfqService.findById(id);
  }

  @Post(':id/quotes')
  @HttpCode(HttpStatus.CREATED)
  submitQuote(
    @Param('id', ParseUUIDPipe) rfqId: string,
    @Body() dto: SubmitQuoteDto,
    @Req() req: AuthRequest,
  ) {
    return this.rfqService.submitQuote(rfqId, dto, req.user.sub, req.ip);
  }

  @Get(':id/quotes')
  listQuotes(@Param('id', ParseUUIDPipe) rfqId: string) {
    return this.rfqService.listQuotes(rfqId);
  }

  @Post(':id/quotes/:quoteId/accept')
  @HttpCode(HttpStatus.OK)
  acceptQuote(
    @Param('id', ParseUUIDPipe) rfqId: string,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @Req() req: AuthRequest,
  ) {
    return this.rfqService.acceptQuote(rfqId, quoteId, req.user.sub, req.ip);
  }

  @Post(':id/quotes/:quoteId/reject')
  @HttpCode(HttpStatus.OK)
  rejectQuote(
    @Param('id', ParseUUIDPipe) rfqId: string,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @Req() req: AuthRequest,
  ) {
    return this.rfqService.rejectQuote(rfqId, quoteId, req.user.sub, req.ip);
  }
}
