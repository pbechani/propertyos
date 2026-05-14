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
import { SupplierService } from './supplier.service';
import {
  CreateSupplierProductDto,
  CreateSupplierProfileDto,
  ProductListQueryDto,
  UpdateSupplierProductDto,
  UpdateSupplierProfileDto,
} from './marketplace.dto';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post('profiles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier', 'admin')
  @HttpCode(HttpStatus.CREATED)
  createProfile(
    @Body() dto: CreateSupplierProfileDto,
    @Req() req: AuthRequest,
  ) {
    return this.supplierService.createProfile(dto, req.user.sub, req.ip);
  }

  @Get('profiles')
  @UseGuards(JwtAuthGuard)
  listProfiles(
    @Query('verificationStatus') verificationStatus?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.supplierService.findAll({ verificationStatus, page, limit });
  }

  @Get('profiles/:id')
  @UseGuards(JwtAuthGuard)
  getProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.supplierService.findById(id);
  }

  @Patch('profiles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier', 'admin')
  updateProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierProfileDto,
    @Req() req: AuthRequest,
  ) {
    return this.supplierService.updateProfile(id, dto, req.user.sub, req.ip);
  }

  @Post('profiles/:id/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier', 'admin')
  @HttpCode(HttpStatus.CREATED)
  createProduct(
    @Param('id', ParseUUIDPipe) supplierId: string,
    @Body() dto: CreateSupplierProductDto,
    @Req() req: AuthRequest,
  ) {
    return this.supplierService.createProduct(
      supplierId,
      dto,
      req.user.sub,
      req.ip,
    );
  }

  @Patch('products/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('supplier', 'admin')
  updateProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateSupplierProductDto,
    @Req() req: AuthRequest,
  ) {
    return this.supplierService.updateProduct(
      productId,
      dto,
      req.user.sub,
      req.ip,
    );
  }

  @Get('products')
  @UseGuards(JwtAuthGuard)
  listProducts(@Query() query: ProductListQueryDto) {
    return this.supplierService.findProducts(query);
  }
}
