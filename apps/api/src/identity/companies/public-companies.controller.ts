import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';

/**
 * Public read-only company endpoints — no auth required.
 * GET /api/v1/public/companies/:id
 * GET /api/v1/public/companies/:id/members
 * GET /api/v1/public/companies/:id/listings
 */
@ApiTags('Public')
@Controller('public')
export class PublicCompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('companies/:id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findByIdPublic(id);
  }

  @Get('companies/:id/members')
  listMembers(@Param('id') id: string) {
    return this.companiesService.findPublicMembers(id);
  }

  @Get('companies/:id/listings')
  listListings(@Param('id') id: string) {
    return this.companiesService.findPublicListings(id);
  }
}
