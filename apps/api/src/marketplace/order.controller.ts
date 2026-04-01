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
import { AuthRequest } from '../common/types';
import { OrderService } from './order.service';
import {
  ConfirmDeliveryDto,
  CreateOrderDto,
  OrderListQueryDto,
  ShipOrderDto,
} from './marketplace.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOrderDto, @Req() req: AuthRequest) {
    return this.orderService.create(dto, req.user.sub, req.ip);
  }

  @Get()
  findAll(@Query() query: OrderListQueryDto, @Req() req: AuthRequest) {
    return this.orderService.findAll(query, req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.findById(id);
  }

  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  confirmOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthRequest,
  ) {
    return this.orderService.confirmOrder(id, req.user.sub, req.ip);
  }

  @Patch(':id/ship')
  @HttpCode(HttpStatus.OK)
  shipOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ShipOrderDto,
    @Req() req: AuthRequest,
  ) {
    return this.orderService.shipOrder(id, dto, req.user.sub, req.ip);
  }

  @Post(':id/delivery-confirmation')
  @HttpCode(HttpStatus.CREATED)
  confirmDelivery(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmDeliveryDto,
    @Req() req: AuthRequest,
  ) {
    return this.orderService.confirmDelivery(id, dto, req.user.sub, req.ip);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthRequest,
  ) {
    return this.orderService.cancelOrder(id, req.user.sub, req.ip);
  }
}
