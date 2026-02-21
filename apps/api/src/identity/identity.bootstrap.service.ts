import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database';
import { IDENTITY_PERMISSIONS, IDENTITY_ROLES } from './identity.constants';

@Injectable()
export class IdentityBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(IdentityBootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.seedRoles();
      await this.seedPermissions();
      await this.seedRolePermissions();
    } catch {
      this.logger.warn(
        'Identity seed skipped. Run database migrations for Sprint 02 tables.',
      );
    }
  }

  private async seedRoles(): Promise<void> {
    const displayNames: Record<string, string> = {
      buyer_seller: 'Buyer / Seller',
      investor: 'Investor',
      contractor: 'Contractor',
      supplier: 'Supplier',
      agent: 'Agent',
      conveyancer: 'Conveyancer',
      inspector: 'Inspector',
      admin: 'Admin',
      truck_operator: 'Truck Operator',
    };

    for (const role of IDENTITY_ROLES) {
      await this.prisma.$executeRaw`
        INSERT INTO identity.roles (name, display_name, description)
        VALUES (${role}, ${displayNames[role]}, ${`${displayNames[role]} role`})
        ON CONFLICT (name) DO NOTHING
      `;
    }
  }

  private async seedPermissions(): Promise<void> {
    for (const permission of IDENTITY_PERMISSIONS) {
      await this.prisma.$executeRaw`
        INSERT INTO identity.permissions (resource, action)
        VALUES (${permission.resource}, ${permission.action})
        ON CONFLICT (resource, action) DO NOTHING
      `;
    }
  }

  private async seedRolePermissions(): Promise<void> {
    const mappings: Record<
      string,
      Array<{ resource: string; action: string }>
    > = {
      buyer_seller: [
        { resource: 'property', action: 'read' },
        { resource: 'project', action: 'read' },
        { resource: 'escrow', action: 'deposit' },
        { resource: 'users', action: 'self' },
        { resource: 'kyc', action: 'submit' },
      ],
      agent: [
        { resource: 'property', action: 'create' },
        { resource: 'property', action: 'read' },
        { resource: 'property', action: 'update' },
        { resource: 'kyc', action: 'submit' },
      ],
      contractor: [
        { resource: 'property', action: 'read' },
        { resource: 'project', action: 'create' },
        { resource: 'project', action: 'update' },
        { resource: 'kyc', action: 'submit' },
      ],
      supplier: [
        { resource: 'property', action: 'read' },
        { resource: 'project', action: 'read' },
        { resource: 'kyc', action: 'submit' },
      ],
      conveyancer: [
        { resource: 'property', action: 'read' },
        { resource: 'escrow', action: 'read' },
        { resource: 'kyc', action: 'submit' },
      ],
      inspector: [
        { resource: 'property', action: 'read' },
        { resource: 'project', action: 'read' },
        { resource: 'kyc', action: 'submit' },
      ],
      investor: [
        { resource: 'property', action: 'read' },
        { resource: 'project', action: 'read' },
        { resource: 'escrow', action: 'read' },
        { resource: 'kyc', action: 'submit' },
      ],
      truck_operator: [{ resource: 'kyc', action: 'submit' }],
      admin: [
        { resource: 'property', action: 'full' },
        { resource: 'project', action: 'full' },
        { resource: 'escrow', action: 'full' },
        { resource: 'users', action: 'full' },
        { resource: 'kyc', action: 'approve' },
      ],
    };

    for (const [role, permissions] of Object.entries(mappings)) {
      const roleRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM identity.roles WHERE name = ${role} LIMIT 1
      `;

      const roleId = roleRows[0]?.id;
      if (!roleId) {
        continue;
      }

      for (const permission of permissions) {
        const permissionRows = await this.prisma.$queryRaw<
          Array<{ id: string }>
        >`
          SELECT id FROM identity.permissions
          WHERE resource = ${permission.resource} AND action = ${permission.action}
          LIMIT 1
        `;

        const permissionId = permissionRows[0]?.id;
        if (!permissionId) {
          continue;
        }

        await this.prisma.$executeRaw`
          INSERT INTO identity.role_permissions (role_id, permission_id)
          VALUES (${roleId}::uuid, ${permissionId}::uuid)
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `;
      }
    }
  }
}
