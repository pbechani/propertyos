import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { MarketService } from './market.service';
import { MaterialPricesQueryDto, PriceTrendQueryDto } from './marketplace.dto';

@Controller('market')
@UseGuards(JwtAuthGuard)
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('material-prices')
  getMaterialPrices(@Query() query: MaterialPricesQueryDto) {
    return this.marketService.getMaterialPrices(query);
  }

  @Get('price-trends')
  getPriceTrends(@Query() query: PriceTrendQueryDto) {
    return this.marketService.getPriceTrends(query);
  }
}
