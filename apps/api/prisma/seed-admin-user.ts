/**
 * Seed script: creates the platform admin user.
 *
 * ⚠️  FOR DEVELOPMENT / LOCAL USE ONLY.
 *     Do NOT run against a staging or production database.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register prisma/seed-admin-user.ts
 *
 * What it creates:
 *   • identity.users          email = admin@pribec.local, status = active
 *   • identity.user_roles     role = 'admin'
 *   • identity.company_members enrolled in the Self system company
 *                              with is_admin = true so the JWT includes
 *                              active_company_is_admin = true on login
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@pribec.local';
  const password = 'admin123';
  const BCRYPT_ROUNDS = 12;

  console.log('⚙  Seeding platform admin user…');

  // ── 1. Hash password ─────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // ── 2. Upsert user ────────────────────────────────────────────────────────
  const existingUser = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM identity.users WHERE email = ${email}
  `;

  let userId: string;

  if (existingUser.length > 0) {
    userId = existingUser[0].id;
    await prisma.$executeRaw`
      UPDATE identity.users
      SET password_hash      = ${passwordHash},
          status             = 'active',
          email_verified_at  = COALESCE(email_verified_at, NOW()),
          updated_at         = NOW()
      WHERE id = ${userId}::uuid
    `;
    console.log(`✓ Updated existing user     → ${userId}`);
  } else {
    const created = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO identity.users
        (email, first_name, last_name, password_hash, status, email_verified_at)
      VALUES
        (${email}, 'Platform', 'Admin', ${passwordHash}, 'active', NOW())
      RETURNING id
    `;
    userId = created[0].id;
    console.log(`✓ Created user              → ${userId}`);
  }

  // ── 3. Assign admin role ─────────────────────────────────────────────────
  const roles = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM identity.roles WHERE name = 'admin'
  `;

  if (roles.length === 0) {
    console.error('✗ Role "admin" not found — have you run all migrations?');
    process.exit(1);
  }

  await prisma.$executeRaw`
    INSERT INTO identity.user_roles (user_id, role_id)
    VALUES (${userId}::uuid, ${roles[0].id}::uuid)
    ON CONFLICT (user_id, role_id) DO NOTHING
  `;
  console.log(`✓ Role assigned             → admin`);

  // ── 4. Enrol in the Self system company with is_admin = true ─────────────
  //    This makes active_company_is_admin = true in the JWT on login so the
  //    Platform Admin Cockpit is visible in the UI sidebar.
  const selfCompany = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM identity.companies WHERE slug = 'self' AND is_system = true
  `;

  if (selfCompany.length === 0) {
    console.warn('⚠  Self company not found — run migrations first');
  } else {
    await prisma.$executeRaw`
      INSERT INTO identity.company_members
        (company_id, user_id, role, is_admin, status, permissions)
      VALUES
        (${selfCompany[0].id}::uuid, ${userId}::uuid,
         'admin', true, 'active', '[]'::jsonb)
      ON CONFLICT (company_id, user_id)
      DO UPDATE SET
        role     = 'admin',
        is_admin = true,
        status   = 'active'
    `;
    console.log(`✓ Self company enrolled     → is_admin = true`);
  }

  console.log('');
  console.log('────────────────────────────────────────');
  console.log('  Platform admin credentials (dev only)');
  console.log('────────────────────────────────────────');
  console.log(`  Email    : ${email}`);
  console.log(`  Password : ${password}`);
  console.log('────────────────────────────────────────');
  console.log('');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
