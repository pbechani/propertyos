import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { RolesGuard } from '../identity/rbac/roles.guard';
import { Roles } from '../identity/rbac/roles.decorator';
import { AuthRequest } from '../common/types';
import { ContractorService } from './contractor.service';
import {
  AddPortfolioItemDto,
  ContractorListQueryDto,
  CreateContractorProfileDto,
  UpdateContractorProfileDto,
} from './marketplace.dto';

@Controller('contractors')
export class ContractorController {
  constructor(private readonly contractorService: ContractorService) {}

  @Post('profiles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('contractor', 'admin')
  @HttpCode(HttpStatus.CREATED)
  createProfile(
    @Body() dto: CreateContractorProfileDto,
    @Req() req: AuthRequest,
  ) {
    const ip = req.ip;
    return this.contractorService.createProfile(dto, req.user.sub, ip);
  }

  @Get('profiles')
  @UseGuards(JwtAuthGuard)
  listProfiles(@Query() query: ContractorListQueryDto) {
    return this.contractorService.findAll(query);
  }

  @Get('profiles/:id')
  @UseGuards(JwtAuthGuard)
  getProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractorService.findById(id);
  }

  @Patch('profiles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('contractor', 'admin')
  updateProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContractorProfileDto,
    @Req() req: AuthRequest,
  ) {
    return this.contractorService.updateProfile(id, dto, req.user.sub, req.ip);
  }

  @Post('profiles/:id/portfolio')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('contractor', 'admin')
  @HttpCode(HttpStatus.CREATED)
  addPortfolioItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddPortfolioItemDto,
    @Req() req: AuthRequest,
  ) {
    return this.contractorService.addPortfolioItem(
      id,
      dto,
      req.user.sub,
      req.ip,
    );
  }
}
