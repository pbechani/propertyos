import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { IDENTITY_ROLES } from './identity.constants';

type UserRecord = {
  id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  status: string;
  email_verified_at: Date | null;
  phone_verified_at: Date | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string): Promise<UserRecord> {
    const users = await this.prisma.$queryRaw<UserRecord[]>`
      SELECT id, email, phone, first_name, last_name, avatar_url, status, email_verified_at, phone_verified_at, last_login_at, created_at, updated_at
      FROM identity.users
      WHERE id = ${userId}::uuid
      LIMIT 1
    `;

    if (!users[0]) {
      throw new NotFoundException('User not found');
    }

    return users[0];
  }

  async findByEmail(
    email: string,
  ): Promise<(UserRecord & { password_hash: string | null }) | null> {
    const users = await this.prisma.$queryRaw<
      (UserRecord & { password_hash: string | null })[]
    >`
      SELECT id, email, phone, first_name, last_name, avatar_url, status, email_verified_at, phone_verified_at, last_login_at, created_at, updated_at, password_hash
      FROM identity.users
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1
    `;

    return users[0] ?? null;
  }

  async create(params: {
    email: string;
    passwordHash: string | null;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<UserRecord> {
    const created = await this.prisma.$queryRaw<UserRecord[]>`
      INSERT INTO identity.users (email, password_hash, first_name, last_name, phone)
      VALUES (LOWER(${params.email}), ${params.passwordHash}, ${params.firstName}, ${params.lastName}, ${params.phone ?? null})
      RETURNING id, email, phone, first_name, last_name, avatar_url, status, email_verified_at, phone_verified_at, last_login_at, created_at, updated_at
    `;

    return created[0];
  }

  async updateMe(
    userId: string,
    updates: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      avatarUrl: string;
    }>,
  ): Promise<UserRecord> {
    const current = await this.findById(userId);
    const nextFirstName = updates.firstName ?? current.first_name;
    const nextLastName = updates.lastName ?? current.last_name;
    const nextPhone = updates.phone ?? current.phone;
    const nextAvatarUrl = updates.avatarUrl ?? current.avatar_url;

    const updated = await this.prisma.$queryRaw<UserRecord[]>`
      UPDATE identity.users
      SET first_name = ${nextFirstName},
          last_name = ${nextLastName},
          phone = ${nextPhone},
          avatar_url = ${nextAvatarUrl},
          updated_at = NOW()
      WHERE id = ${userId}::uuid
      RETURNING id, email, phone, first_name, last_name, avatar_url, status, email_verified_at, phone_verified_at, last_login_at, created_at, updated_at
    `;

    return updated[0];
  }

  async updateStatus(
    userId: string,
    status: 'active' | 'suspended' | 'deleted',
  ): Promise<UserRecord> {
    const updated = await this.prisma.$queryRaw<UserRecord[]>`
      UPDATE identity.users
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${userId}::uuid
      RETURNING id, email, phone, first_name, last_name, avatar_url, status, email_verified_at, phone_verified_at, last_login_at, created_at, updated_at
    `;

    if (!updated[0]) {
      throw new NotFoundException('User not found');
    }

    return updated[0];
  }

  async listUserRoles(
    userId: string,
  ): Promise<Array<{ id: string; name: string; display_name: string }>> {
    return this.prisma.$queryRaw`
      SELECT r.id, r.name, r.display_name
      FROM identity.user_roles ur
      JOIN identity.roles r ON r.id = ur.role_id
      WHERE ur.user_id = ${userId}::uuid
      ORDER BY r.name
    `;
  }

  async assignRole(
    userId: string,
    roleName: string,
    assignedBy: string,
  ): Promise<void> {
    if (!(IDENTITY_ROLES as readonly string[]).includes(roleName)) {
      throw new BadRequestException('Invalid role');
    }

    const roleRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM identity.roles WHERE name = ${roleName} LIMIT 1
    `;

    if (!roleRows[0]) {
      throw new NotFoundException('Role not found');
    }

    await this.prisma.$executeRaw`
      INSERT INTO identity.user_roles (user_id, role_id, assigned_by)
      VALUES (${userId}::uuid, ${roleRows[0].id}::uuid, ${assignedBy}::uuid)
      ON CONFLICT (user_id, role_id) DO NOTHING
    `;
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM identity.user_roles
      WHERE user_id = ${userId}::uuid AND role_id = ${roleId}::uuid
    `;
  }

  async getUserRoleNames(userId: string): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<Array<{ name: string }>>`
      SELECT r.name
      FROM identity.user_roles ur
      JOIN identity.roles r ON r.id = ur.role_id
      WHERE ur.user_id = ${userId}::uuid
    `;

    return rows.map((row) => row.name);
  }

  async getLatestKycStatus(userId: string): Promise<string> {
    const rows = await this.prisma.$queryRaw<Array<{ status: string }>>`
      SELECT status
      FROM identity.kyc_verifications
      WHERE user_id = ${userId}::uuid
      ORDER BY submitted_at DESC
      LIMIT 1
    `;

    return rows[0]?.status ?? 'pending';
  }

  async markLastLogin(userId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE identity.users
      SET last_login_at = NOW(), updated_at = NOW()
      WHERE id = ${userId}::uuid
    `;
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE identity.users
      SET email_verified_at = NOW(), updated_at = NOW()
      WHERE id = ${userId}::uuid
    `;
  }

  sanitizeUser(user: UserRecord): Record<string, unknown> {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
      status: user.status,
      emailVerifiedAt: user.email_verified_at,
      phoneVerifiedAt: user.phone_verified_at,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }
}
