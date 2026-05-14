import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService as DatabaseService } from '../database';
import { MarketplaceAuditService } from './marketplace-audit.service';
import {
  MARKETPLACE_AUDIT_ACTIONS,
  ORDER_STATUS,
} from './marketplace.constants';
import {
  ConfirmDeliveryDto,
  CreateOrderDto,
  OrderListQueryDto,
  ShipOrderDto,
} from './marketplace.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly audit: MarketplaceAuditService,
  ) {}

  private generateOrderReference(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `ORD-${year}-${random}`;
  }

  async create(dto: CreateOrderDto, buyerId: string, ipAddress?: string) {
    const supplier = await this.prisma.supplierProfile.findUnique({
      where: { id: dto.supplierId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const order = await this.prisma.marketplaceOrder.create({
      data: {
        orderReference: this.generateOrderReference(),
        quoteId: dto.quoteId,
        projectId: dto.projectId,
        buyerId,
        supplierId: dto.supplierId,
        totalAmount: dto.totalAmount,
        currency: dto.currency,
        deliveryAddress: dto.deliveryAddress,
        deliveryLat: dto.deliveryLat,
        deliveryLng: dto.deliveryLng,
        requestedDeliveryDate: dto.requestedDeliveryDate
          ? new Date(dto.requestedDeliveryDate)
          : undefined,
      },
    });

    await this.audit.log({
      actorId: buyerId,
      action: MARKETPLACE_AUDIT_ACTIONS.ORDER_PLACED,
      resourceType: 'order',
      resourceId: order.id,
      payload: { orderReference: order.orderReference, supplierId: dto.supplierId },
      ipAddress,
    });

    return order;
  }

  async findAll(query: OrderListQueryDto, actorId: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      OR: [{ buyerId: actorId }, { supplierId: actorId }],
    };
    if (query.status) where['status'] = query.status;

    const [data, total] = await Promise.all([
      this.prisma.marketplaceOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { placedAt: 'desc' },
        include: { deliveryConfirmation: true },
      }),
      this.prisma.marketplaceOrder.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const order = await this.prisma.marketplaceOrder.findUnique({
      where: { id },
      include: { deliveryConfirmation: true },
    });
    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  async confirmOrder(id: string, actorId: string, ipAddress?: string) {
    const order = await this.prisma.marketplaceOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.status !== ORDER_STATUS.PLACED) {
      throw new BadRequestException('Order cannot be confirmed in its current state.');
    }

    const updated = await this.prisma.marketplaceOrder.update({
      where: { id },
      data: { status: ORDER_STATUS.CONFIRMED, confirmedAt: new Date() },
    });

    await this.audit.log({
      actorId,
      action: MARKETPLACE_AUDIT_ACTIONS.ORDER_CONFIRMED,
      resourceType: 'order',
      resourceId: id,
      ipAddress,
    });

    return updated;
  }

  async shipOrder(
    id: string,
    dto: ShipOrderDto,
    actorId: string,
    ipAddress?: string,
  ) {
    const order = await this.prisma.marketplaceOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found.');
    if (
      order.status !== ORDER_STATUS.CONFIRMED &&
      order.status !== ORDER_STATUS.PREPARING
    ) {
      throw new BadRequestException('Order cannot be shipped in its current state.');
    }

    const updated = await this.prisma.marketplaceOrder.update({
      where: { id },
      data: { status: ORDER_STATUS.SHIPPED, shippedAt: new Date() },
    });

    await this.audit.log({
      actorId,
      action: MARKETPLACE_AUDIT_ACTIONS.ORDER_SHIPPED,
      resourceType: 'order',
      resourceId: id,
      payload: dto as Record<string, unknown>,
      ipAddress,
    });

    return updated;
  }

  async confirmDelivery(
    id: string,
    dto: ConfirmDeliveryDto,
    confirmedBy: string,
    ipAddress?: string,
  ) {
    const order = await this.prisma.marketplaceOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.status !== ORDER_STATUS.SHIPPED) {
      throw new BadRequestException('Order has not been shipped yet.');
    }

    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.marketplaceOrder.update({
        where: { id },
        data: { status: ORDER_STATUS.DELIVERED, deliveredAt: new Date() },
      }),
      this.prisma.deliveryConfirmation.create({
        data: {
          orderId: id,
          confirmedBy,
          proofPhotoUrl: dto.proofPhotoUrl,
          proofPhotoLat: dto.proofPhotoLat,
          proofPhotoLng: dto.proofPhotoLng,
          condition: dto.condition,
          damageNotes: dto.damageNotes,
          recipientSignatureUrl: dto.recipientSignatureUrl,
        },
      }),
    ]);

    await this.audit.log({
      actorId: confirmedBy,
      action: MARKETPLACE_AUDIT_ACTIONS.ORDER_DELIVERED,
      resourceType: 'order',
      resourceId: id,
      ipAddress,
    });

    return updatedOrder;
  }

  async cancelOrder(id: string, actorId: string, ipAddress?: string) {
    const order = await this.prisma.marketplaceOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found.');

    const cancellableStates: string[] = [ORDER_STATUS.PLACED, ORDER_STATUS.CONFIRMED];
    if (!cancellableStates.includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled in its current state.');
    }

    const updated = await this.prisma.marketplaceOrder.update({
      where: { id },
      data: { status: ORDER_STATUS.CANCELLED },
    });

    await this.audit.log({
      actorId,
      action: MARKETPLACE_AUDIT_ACTIONS.ORDER_CANCELLED,
      resourceType: 'order',
      resourceId: id,
      ipAddress,
    });

    return updated;
  }
}
