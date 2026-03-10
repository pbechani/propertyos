import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { IDENTITY_ROLES, PROFESSIONAL_ROLES, ROLE_EXCLUSION_PAIRS } from './identity.constants';

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
  company_name?: string | null;
  business_type?: string | null;
  license_number?: string | null;
  years_experience?: string | null;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string): Promise<UserRecord> {
    const users = await this.prisma.$queryRaw<UserRecord[]>`
      SELECT
        u.id,
        u.email,
        u.phone,
        u.first_name,
        u.last_name,
        u.avatar_url,
        u.status,
        u.email_verified_at,
        u.phone_verified_at,
        u.last_login_at,
        ubp.company_name,
        ubp.business_type,
        ubp.license_number,
        ubp.years_experience,
        u.created_at,
        u.updated_at
      FROM identity.users u
      LEFT JOIN identity.user_business_profiles ubp ON ubp.user_id = u.id
      WHERE u.id = ${userId}::uuid
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
      SELECT
        u.id,
        u.email,
        u.phone,
        u.first_name,
        u.last_name,
        u.avatar_url,
        u.status,
        u.email_verified_at,
        u.phone_verified_at,
        u.last_login_at,
        ubp.company_name,
        ubp.business_type,
        ubp.license_number,
        ubp.years_experience,
        u.created_at,
        u.updated_at,
        u.password_hash
      FROM identity.users u
      LEFT JOIN identity.user_business_profiles ubp ON ubp.user_id = u.id
      WHERE LOWER(u.email) = LOWER(${email})
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
    const created = await this.prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO identity.users (email, password_hash, first_name, last_name, phone)
      VALUES (LOWER(${params.email}), ${params.passwordHash}, ${params.firstName}, ${params.lastName}, ${params.phone ?? null})
      RETURNING id
    `;

    return this.findById(created[0].id);
  }

  async updateMe(
    userId: string,
    updates: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      avatarUrl: string;
      companyName: string;
      businessType: string;
      licenseNumber: string;
      yearsExperience: string;
    }>,
  ): Promise<UserRecord> {
    const current = await this.findById(userId);
    const nextFirstName = updates.firstName ?? current.first_name;
    const nextLastName = updates.lastName ?? current.last_name;
    const nextPhone = updates.phone ?? current.phone;
    const nextAvatarUrl = updates.avatarUrl ?? current.avatar_url;

    await this.prisma.$executeRaw`
      UPDATE identity.users
      SET first_name = ${nextFirstName},
          last_name = ${nextLastName},
          phone = ${nextPhone},
          avatar_url = ${nextAvatarUrl},
          updated_at = NOW()
      WHERE id = ${userId}::uuid
    `;

    const hasBusinessUpdates =
      updates.companyName !== undefined ||
      updates.businessType !== undefined ||
      updates.licenseNumber !== undefined ||
      updates.yearsExperience !== undefined;

    if (hasBusinessUpdates) {
      await this.prisma.$executeRaw`
        INSERT INTO identity.user_business_profiles (
          user_id,
          company_name,
          business_type,
          license_number,
          years_experience
        ) VALUES (
          ${userId}::uuid,
          ${updates.companyName ?? null},
          ${updates.businessType ?? null},
          ${updates.licenseNumber ?? null},
          ${updates.yearsExperience ?? null}
        )
        ON CONFLICT (user_id) DO UPDATE
        SET company_name = COALESCE(EXCLUDED.company_name, identity.user_business_profiles.company_name),
            business_type = COALESCE(EXCLUDED.business_type, identity.user_business_profiles.business_type),
            license_number = COALESCE(EXCLUDED.license_number, identity.user_business_profiles.license_number),
            years_experience = COALESCE(EXCLUDED.years_experience, identity.user_business_profiles.years_experience),
            updated_at = NOW()
      `;
    }

    return this.findById(userId);
  }

  async updateStatus(
    userId: string,
    status: 'active' | 'suspended' | 'deleted',
  ): Promise<UserRecord> {
    const updated = await this.prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE identity.users
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${userId}::uuid
      RETURNING id
    `;

    if (!updated[0]) {
      throw new NotFoundException('User not found');
    }

    return this.findById(updated[0].id);
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

  /**
   * Self-service role addition — users can add allowed roles to themselves.
   * Enforces role-exclusion constraints before inserting.
   * 'admin' can never be self-assigned.
   */
  async selfAddRole(userId: string, roleName: string): Promise<void> {
    if (roleName === 'admin') {
      throw new ForbiddenException('The admin role cannot be self-assigned.');
    }

    if (!(IDENTITY_ROLES as readonly string[]).includes(roleName)) {
      throw new BadRequestException('Invalid role');
    }

    const currentRoles = await this.getUserRoleNames(userId);

    // Check exclusions: if the user holds role_a, they cannot add role_b;
    // and if they already hold role_b, they cannot add role_a.
    for (const [roleA, roleB] of ROLE_EXCLUSION_PAIRS) {
      if (currentRoles.includes(roleA) && roleName === roleB) {
        throw new ForbiddenException(
          `Cannot add role '${roleName}' — conflicts with your existing '${roleA}' role.`,
        );
      }
      if (currentRoles.includes(roleB) && roleName === roleA) {
        throw new ForbiddenException(
          `Cannot add role '${roleName}' — conflicts with your existing '${roleB}' role.`,
        );
      }
    }

    if ((PROFESSIONAL_ROLES as readonly string[]).includes(roleName)) {
      const kycStatus = await this.getLatestKycStatus(userId);
      if (kycStatus !== 'approved') {
        throw new ForbiddenException(
          `The '${roleName}' role requires approved KYC (Identity tier). Please complete identity verification first.`,
        );
      }
    }

    await this.assignRole(userId, roleName, userId);
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

  async getUserPermissions(
    userId: string,
  ): Promise<Array<{ resource: string; action: string }>> {
    return this.prisma.$queryRaw<Array<{ resource: string; action: string }>>`
      SELECT DISTINCT p.resource, p.action
      FROM identity.user_roles ur
      JOIN identity.role_permissions rp ON rp.role_id = ur.role_id
      JOIN identity.permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = ${userId}::uuid
    `;
  }

  async getLatestKycStatus(userId: string): Promise<string | null> {
    const rows = await this.prisma.$queryRaw<Array<{ status: string }>>`
      SELECT status
      FROM identity.kyc_verifications
      WHERE user_id = ${userId}::uuid
      ORDER BY submitted_at DESC
      LIMIT 1
    `;

    return rows[0]?.status ?? null;
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

  async searchUsers(
    q: string,
    role?: string,
  ): Promise<Array<{ id: string; firstName: string; lastName: string; email: string }>> {
    const likePattern = `%${q.toLowerCase()}%`;
    type Row = { id: string; first_name: string; last_name: string; email: string };
    const rows: Row[] = role
      ? await this.prisma.$queryRaw<Row[]>`
          SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
          FROM identity.users u
          JOIN identity.user_roles ur ON ur.user_id = u.id
          JOIN identity.roles r ON r.id = ur.role_id
          WHERE (LOWER(u.email) LIKE ${likePattern}
             OR LOWER(u.first_name || ' ' || u.last_name) LIKE ${likePattern})
          AND r.name = ${role}
          AND u.status = 'active'
          ORDER BY u.first_name, u.last_name
          LIMIT 10
        `
      : await this.prisma.$queryRaw<Row[]>`
          SELECT u.id, u.first_name, u.last_name, u.email
          FROM identity.users u
          WHERE (LOWER(u.email) LIKE ${likePattern}
             OR LOWER(u.first_name || ' ' || u.last_name) LIKE ${likePattern})
          AND u.status = 'active'
          ORDER BY u.first_name, u.last_name
          LIMIT 10
        `;
    return rows.map(r => ({
      id:        r.id,
      firstName: r.first_name,
      lastName:  r.last_name,
      email:     r.email,
    }));
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
      companyName: user.company_name,
      businessType: user.business_type,
      licenseNumber: user.license_number,
      yearsExperience: user.years_experience,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }
}
