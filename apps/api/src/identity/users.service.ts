import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { IDENTITY_ROLES, PROFESSIONAL_ROLES, ROLE_EXCLUSION_PAIRS, SELF_COMPANY_SLUG } from './identity.constants';
import { NotificationService } from './notification.service';

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
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

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
    status: 'active' | 'suspended' | 'under_investigation' | 'deleted',
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

  async investigateUser(userId: string, reason?: string): Promise<UserRecord> {
    const user = await this.updateStatus(userId, 'under_investigation');
    const displayName = `${user.first_name} ${user.last_name}`.trim() || user.email;
    const reasonText = reason ? ` Reason: ${reason}.` : '';
    void this.notifyUserCompanyAdmins(
      userId,
      `Platform Notice: User placed under investigation`,
      `Team member ${displayName} (${user.email}) on your company has been placed under investigation by platform administrators.${reasonText} The investigation does not affect their ability to log in, but please be aware of this status change. Contact support if you have questions.`,
    );
    return user;
  }

  async suspendUser(userId: string, reason?: string): Promise<UserRecord> {
    const user = await this.updateStatus(userId, 'suspended');
    const displayName = `${user.first_name} ${user.last_name}`.trim() || user.email;
    const reasonText = reason ? ` Reason: ${reason}.` : '';
    // Notify the user themselves
    void this.notificationService.sendEmail(
      user.email,
      'Your account has been suspended',
      `Your PropertyOS account has been suspended by platform administrators.${reasonText} You will not be able to log in until your account is reinstated. Please contact support for assistance.`,
    );
    void this.notifyUserCompanyAdmins(
      userId,
      `Platform Notice: Team member account suspended`,
      `Team member ${displayName} (${user.email}) on your company has had their account suspended by platform administrators.${reasonText} They will not be able to log in until reinstated. Please contact support if you have questions.`,
    );

    // --- Side-effects: revoke company memberships + manage listings ---
    // Find the user's self (system) company so we can exclude it from revocation
    // and treat its listings differently (deactivate vs. just flag).
    const selfCompanyRows = await this.prisma.$queryRaw<Array<{ company_id: string }>>`
      SELECT cm.company_id
      FROM identity.company_members cm
      JOIN identity.companies c ON c.id = cm.company_id
      WHERE cm.user_id = ${userId}::uuid
        AND c.is_system = true
        AND c.slug = ${SELF_COMPANY_SLUG}
        AND cm.status = 'active'
      LIMIT 1
    `;
    const selfCompanyId = selfCompanyRows[0]?.company_id ?? null;

    // Revoke all non-self company memberships so company admins can reassign work.
    // revoked_by = NULL signals a system-initiated revocation.
    if (selfCompanyId) {
      await this.prisma.$executeRaw`
        UPDATE identity.company_members
        SET status = 'revoked', revoked_at = NOW(), revoked_by = NULL, updated_at = NOW()
        WHERE user_id = ${userId}::uuid
          AND status = 'active'
          AND company_id != ${selfCompanyId}::uuid
      `;
    } else {
      await this.prisma.$executeRaw`
        UPDATE identity.company_members
        SET status = 'revoked', revoked_at = NOW(), revoked_by = NULL, updated_at = NOW()
        WHERE user_id = ${userId}::uuid AND status = 'active'
      `;
    }

    // Flag ALL of the user's listings as agent_suspended so the frontend can
    // disable contact/interaction widgets on non-self-company listings.
    await this.prisma.$executeRaw`
      UPDATE property.properties
      SET agent_suspended = true, updated_at = NOW()
      WHERE agent_id = ${userId}::uuid
    `;

    // Additionally deactivate active self-company listings so they are hidden
    // from search (buyers won't see them at all).
    if (selfCompanyId) {
      await this.prisma.$executeRaw`
        UPDATE property.properties
        SET status = 'inactive', updated_at = NOW()
        WHERE agent_id     = ${userId}::uuid
          AND company_id   = ${selfCompanyId}::uuid
          AND status       = 'active'
      `;
    } else {
      // No self company found → deactivate all active listings.
      await this.prisma.$executeRaw`
        UPDATE property.properties
        SET status = 'inactive', updated_at = NOW()
        WHERE agent_id = ${userId}::uuid AND status = 'active'
      `;
    }

    return user;
  }

  async reinstateUser(userId: string): Promise<UserRecord> {
    // Restore self-company listings that were deactivated because of the suspension.
    // Only touch listings where agent_suspended = true AND status = 'inactive' so we
    // don't accidentally reactivate listings that were already inactive for other reasons.
    await this.prisma.$executeRaw`
      UPDATE property.properties p
      SET    status = 'active', updated_at = NOW()
      FROM   identity.companies c
      WHERE  p.company_id = c.id
        AND  c.is_system  = true
        AND  c.slug       = ${SELF_COMPANY_SLUG}
        AND  p.agent_id   = ${userId}::uuid
        AND  p.agent_suspended = true
        AND  p.status     = 'inactive'
    `;

    // Clear the agent_suspended flag on all of the user's listings.
    await this.prisma.$executeRaw`
      UPDATE property.properties
      SET    agent_suspended = false, updated_at = NOW()
      WHERE  agent_id = ${userId}::uuid AND agent_suspended = true
    `;

    const user = await this.updateStatus(userId, 'active');
    const displayName = `${user.first_name} ${user.last_name}`.trim() || user.email;
    void this.notificationService.sendEmail(
      user.email,
      'Your account has been reinstated',
      `Good news — your PropertyOS account has been reinstated by platform administrators. You can now log in as normal.`,
    );
    void this.notifyUserCompanyAdmins(
      userId,
      `Platform Notice: Team member account reinstated`,
      `Team member ${displayName} (${user.email}) on your company has had their account reinstated. They can now log in as normal.`,
    );
    return user;
  }

  private async notifyUserCompanyAdmins(
    userId: string,
    subject: string,
    body: string,
  ): Promise<void> {
    try {
      const companyAdmins = await this.prisma.$queryRaw<
        Array<{ email: string; phone: string | null; company_name: string }>
      >`
        SELECT u.email, u.phone, c.name AS company_name
        FROM identity.company_members cm
        JOIN identity.users u ON u.id = cm.user_id
        JOIN identity.companies c ON c.id = cm.company_id
        WHERE cm.company_id IN (
          SELECT company_id FROM identity.company_members
          WHERE user_id = ${userId}::uuid AND status = 'active'
        )
          AND cm.is_admin = true
          AND cm.status = 'active'
          AND cm.user_id != ${userId}::uuid
      `;
      for (const admin of companyAdmins) {
        void this.notificationService.sendEmail(admin.email, subject, body);
      }
    } catch (err) {
      this.logger.error(`Failed to notify company admins for user ${userId}`, err);
    }
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

  async listUsers(params: {
    limit?: number;
    offset?: number;
    role?: string;
    status?: string;
    search?: string;
  } = {}): Promise<{
    data: Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string | null;
      role: string | null;
      kycStatus: string | null;
      status: string;
      companyCount: number;
      createdAt: string;
    }>;
    total: number;
  }> {
    const limit = Math.min(params.limit ?? 100, 500);
    const offset = params.offset ?? 0;

    type AdminUserRow = {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      phone: string | null;
      status: string;
      created_at: Date;
      primary_role: string | null;
      kyc_status: string | null;
      company_count: bigint;
      total: bigint;
    };

    const conditions: string[] = ["u.status != 'deleted'"];
    if (params.status) conditions.push(`u.status = '${params.status}'`);
    if (params.search) {
      const s = params.search.replace(/'/g, "''");
      conditions.push(
        `(u.email ILIKE '%${s}%' OR u.first_name ILIKE '%${s}%' OR u.last_name ILIKE '%${s}%')`,
      );
    }

    const whereClause = conditions.join(' AND ');
    const roleJoin = params.role
      ? `INNER JOIN identity.user_roles ur_f ON ur_f.user_id = u.id
         INNER JOIN identity.roles r_f ON r_f.id = ur_f.role_id AND r_f.name = '${params.role}'`
      : '';

    const rows = await this.prisma.$queryRawUnsafe<AdminUserRow[]>(`
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.status,
        u.created_at,
        (
          SELECT r.name FROM identity.roles r
          INNER JOIN identity.user_roles ur ON ur.role_id = r.id
          WHERE ur.user_id = u.id
          ORDER BY r.name
          LIMIT 1
        ) AS primary_role,
        (
          SELECT kv.status FROM identity.kyc_verifications kv
          WHERE kv.user_id = u.id
          ORDER BY kv.submitted_at DESC NULLS LAST
          LIMIT 1
        ) AS kyc_status,
        (
          SELECT COUNT(*) FROM identity.company_members cm
          WHERE cm.user_id = u.id
        ) AS company_count,
        COUNT(*) OVER() AS total
      FROM identity.users u
      ${roleJoin}
      WHERE ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const total = rows.length > 0 ? Number(rows[0].total) : 0;

    return {
      total,
      data: rows.map((r) => ({
        id: r.id,
        email: r.email,
        firstName: r.first_name,
        lastName: r.last_name,
        phone: r.phone,
        role: r.primary_role,
        kycStatus: r.kyc_status,
        status: r.status,
        companyCount: Number(r.company_count),
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      })),
    };
  }

  async getPlatformStats(): Promise<{
    totalUsers: number;
    activeCompanies: number;
    pendingCompanies: number;
    kycPendingCount: number;
    activeListings: number;
    activeSales: number;
  }> {
    const safeCount = async (query: Promise<Array<{ count: bigint }>>) => {
      try {
        const rows = await query;
        return Number(rows[0]?.count ?? 0);
      } catch {
        return 0;
      }
    };

    const [
      totalUsers,
      activeCompanies,
      pendingCompanies,
      kycPendingCount,
      activeListings,
      activeSales,
    ] = await Promise.all([
      safeCount(
        this.prisma.$queryRaw`SELECT COUNT(*) AS count FROM identity.users WHERE status != 'deleted'`,
      ),
      safeCount(
        this.prisma.$queryRaw`SELECT COUNT(*) AS count FROM identity.companies WHERE status = 'active'`,
      ),
      safeCount(
        this.prisma.$queryRaw`SELECT COUNT(*) AS count FROM identity.companies WHERE verification_status = 'pending'`,
      ),
      safeCount(
        this.prisma.$queryRaw`SELECT COUNT(*) AS count FROM identity.kyc_verifications WHERE status IN ('pending', 'under_review')`,
      ),
      safeCount(
        this.prisma.$queryRaw`SELECT COUNT(*) AS count FROM property.properties WHERE status = 'active'`,
      ),
      safeCount(
        this.prisma.$queryRaw`SELECT COUNT(*) AS count FROM sales.property_sales WHERE status NOT IN ('completed', 'cancelled')`,
      ),
    ]);

    return {
      totalUsers,
      activeCompanies,
      pendingCompanies,
      kycPendingCount,
      activeListings,
      activeSales,
    };
  }
}
