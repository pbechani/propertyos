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
import { RatingService } from './rating.service';
import { CreateRatingDto } from './marketplace.dto';

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRatingDto, @Req() req: AuthRequest) {
    return this.ratingService.create(dto, req.user.sub, req.ip);
  }

  @Get('contractors/:id')
  getContractorRatings(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ratingService.findByContractor(id, { page, limit });
  }

  @Get('suppliers/:id')
  getSupplierRatings(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ratingService.findBySupplier(id, { page, limit });
  }
}
