import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService as DatabaseService } from '../database';
import { MarketplaceAuditService } from './marketplace-audit.service';
import { MARKETPLACE_AUDIT_ACTIONS } from './marketplace.constants';
import {
  CreateSupplierProductDto,
  CreateSupplierProfileDto,
  ProductListQueryDto,
  UpdateSupplierProductDto,
  UpdateSupplierProfileDto,
} from './marketplace.dto';

@Injectable()
export class SupplierService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly audit: MarketplaceAuditService,
  ) {}

  async createProfile(
    dto: CreateSupplierProfileDto,
    actorId: string,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.supplierProfile.findFirst({
      where: dto.userId
        ? { userId: dto.userId }
        : { companyId: dto.companyId },
    });
    if (existing) {
      throw new ConflictException(
        'A supplier profile already exists for this user or company.',
      );
    }

    const profile = await this.prisma.supplierProfile.create({
      data: {
        userId: dto.userId,
        companyId: dto.companyId,
        businessName: dto.businessName,
        registrationNumber: dto.registrationNumber,
        businessType: dto.businessType,
        deliveryAreas: (dto.deliveryAreas as never) ?? [],
        minimumOrderValue: dto.minimumOrderValue,
        paymentTerms: dto.paymentTerms,
      },
    });

    await this.audit.log({
      actorId,
      action: MARKETPLACE_AUDIT_ACTIONS.SUPPLIER_PROFILE_CREATED,
      resourceType: 'supplier_profile',
      resourceId: profile.id,
      payload: { businessName: profile.businessName },
      ipAddress,
    });

    return profile;
  }

  async findAll(query: { verificationStatus?: string; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.verificationStatus) {
      where['verificationStatus'] = query.verificationStatus;
    }

    const [data, total] = await Promise.all([
      this.prisma.supplierProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reputationScore: 'desc' },
      }),
      this.prisma.supplierProfile.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const profile = await this.prisma.supplierProfile.findUnique({
      where: { id },
      include: { products: { where: { isAvailable: true }, take: 20 } },
    });
    if (!profile) throw new NotFoundException('Supplier profile not found.');
    return profile;
  }

  async updateProfile(
    id: string,
    dto: UpdateSupplierProfileDto,
    actorId: string,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.supplierProfile.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Supplier profile not found.');

    const updated = await this.prisma.supplierProfile.update({
      where: { id },
      data: {
        businessName: dto.businessName ?? existing.businessName,
        registrationNumber:
          dto.registrationNumber ?? existing.registrationNumber,
        businessType: dto.businessType ?? existing.businessType,
        deliveryAreas: dto.deliveryAreas
          ? (dto.deliveryAreas as never)
          : (existing.deliveryAreas as never),
        minimumOrderValue: dto.minimumOrderValue ?? existing.minimumOrderValue,
        paymentTerms: dto.paymentTerms ?? existing.paymentTerms,
      },
    });

    await this.audit.log({
      actorId,
      action: MARKETPLACE_AUDIT_ACTIONS.SUPPLIER_PROFILE_UPDATED,
      resourceType: 'supplier_profile',
      resourceId: id,
      ipAddress,
    });

    return updated;
  }

  async createProduct(
    supplierId: string,
    dto: CreateSupplierProductDto,
    actorId: string,
    ipAddress?: string,
  ) {
    const supplier = await this.prisma.supplierProfile.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new NotFoundException('Supplier profile not found.');

    const product = await this.prisma.supplierProduct.create({
      data: {
        supplierId,
        sku: dto.sku,
        productName: dto.productName,
        category: dto.category,
        subcategory: dto.subcategory,
        description: dto.description,
        unit: dto.unit,
        unitPrice: dto.unitPrice,
        currency: dto.currency,
        stockQuantity: dto.stockQuantity,
        minOrderQty: dto.minOrderQty ?? 1,
        leadTimeDays: dto.leadTimeDays,
        isAvailable: dto.isAvailable ?? true,
        mediaUrls: (dto.mediaUrls as never) ?? [],
        specifications: dto.specifications as never,
      },
    });

    await this.audit.log({
      actorId,
      action: MARKETPLACE_AUDIT_ACTIONS.SUPPLIER_PRODUCT_CREATED,
      resourceType: 'supplier_product',
      resourceId: product.id,
      payload: { supplierId, productName: dto.productName },
      ipAddress,
    });

    return product;
  }

  async updateProduct(
    productId: string,
    dto: UpdateSupplierProductDto,
    actorId: string,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.supplierProduct.findUnique({
      where: { id: productId },
    });
    if (!existing) throw new NotFoundException('Product not found.');

    const updated = await this.prisma.supplierProduct.update({
      where: { id: productId },
      data: {
        productName: dto.productName ?? existing.productName,
        category: dto.category ?? existing.category,
        subcategory: dto.subcategory ?? existing.subcategory,
        description: dto.description ?? existing.description,
        unit: dto.unit ?? existing.unit,
        unitPrice: dto.unitPrice ?? existing.unitPrice,
        stockQuantity: dto.stockQuantity ?? existing.stockQuantity,
        isAvailable: dto.isAvailable ?? existing.isAvailable,
        mediaUrls: dto.mediaUrls ? (dto.mediaUrls as never) : (existing.mediaUrls as never),
      },
    });

    await this.audit.log({
      actorId,
      action: MARKETPLACE_AUDIT_ACTIONS.SUPPLIER_PRODUCT_UPDATED,
      resourceType: 'supplier_product',
      resourceId: productId,
      ipAddress,
    });

    return updated;
  }

  async findProducts(query: ProductListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isAvailable: true };
    if (query.category) where['category'] = query.category;
    if (query.search) {
      where['productName'] = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.supplierProduct.findMany({
        where,
        skip,
        take: limit,
        orderBy: { productName: 'asc' },
        include: { supplier: { select: { id: true, businessName: true } } },
      }),
      this.prisma.supplierProduct.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
