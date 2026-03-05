import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { RolesGuard } from '../identity/rbac/roles.guard';
import { Roles } from '../identity/rbac/roles.decorator';
import { NeighbourhoodService, SyndicationService } from './neighbourhood.service';

type AuthRequest = {
  user: { sub: string; email: string; roles: string[]; active_company_id?: string | null };
  ip: string;
  headers: { 'user-agent'?: string };
};

/**
 * Neighbourhood stats — accessible on listing detail.
 * GET /api/v1/properties/:id/neighbourhood
 * GET /api/v1/neighbourhood?suburb=&city=&country=
 */
@Controller('properties/:id/neighbourhood')
export class PropertyNeighbourhoodController {
  constructor(private readonly neighbourhoodService: NeighbourhoodService) {}

  @Get()
  async getForProperty(@Param('id', ParseUUIDPipe) id: string) {
    return this.neighbourhoodService.getByPropertyLocation(id);
  }
}

@Controller('neighbourhood')
export class NeighbourhoodController {
  constructor(private readonly neighbourhoodService: NeighbourhoodService) {}

  @Get()
  async getBySuburb(
    @Query('suburb') suburb: string,
    @Query('city') city: string,
    @Query('country') country: string,
  ) {
    return this.neighbourhoodService.getBySuburb(suburb, city, country);
  }
}

/**
 * Syndication
 * POST  /api/v1/properties/:id/syndicate           [agent]
 * PATCH /api/v1/properties/:id/syndicate/:portalId/pause  [agent]
 * GET   /api/v1/properties/:id/syndication-status  [agent]
 */
@Controller('properties/:id/syndicate')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SyndicationController {
  constructor(private readonly syndicationService: SyndicationService) {}

  @Roles('agent', 'admin')
  @Post()
  async syndicate(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.syndicationService.syndicateProperty(
      id,
      req.user.sub,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }

  @Roles('agent', 'admin')
  @Patch(':portalId/pause')
  async pause(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('portalId', ParseUUIDPipe) portalId: string,
    @Request() req: AuthRequest,
  ) {
    return this.syndicationService.pauseSyndication(
      id,
      portalId,
      req.user.sub,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }
}

@Controller('properties/:id/syndication-status')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SyndicationStatusController {
  constructor(private readonly syndicationService: SyndicationService) {}

  @Roles('agent', 'admin')
  @Get()
  async status(@Param('id', ParseUUIDPipe) id: string) {
    return this.syndicationService.getSyndicationStatus(id);
  }
}
