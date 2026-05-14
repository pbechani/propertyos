/**
 * Seed script: creates test@test.com with 2 company memberships.
 * Usage: npx ts-node prisma/seed-test-user.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'test@test.com';
  const password = 'N@than123';
  const BCRYPT_ROUNDS = 12;

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
      SET password_hash = ${passwordHash},
          updated_at    = NOW()
      WHERE id = ${userId}::uuid
    `;
    console.log(`✓ Updated existing user  → ${userId}`);
  } else {
    const created = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO identity.users
        (email, first_name, last_name, password_hash, status, email_verified_at)
      VALUES
        (${email}, 'Test', 'User', ${passwordHash}, 'active', NOW())
      RETURNING id
    `;
    userId = created[0].id;
    console.log(`✓ Created user           → ${userId}`);
  }

  // ── 3. Assign default role (buyer_seller) ────────────────────────────────
  const roles = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM identity.roles WHERE name = 'buyer_seller'
  `;
  if (roles.length > 0) {
    await prisma.$executeRaw`
      INSERT INTO identity.user_roles (user_id, role_id)
      VALUES (${userId}::uuid, ${roles[0].id}::uuid)
      ON CONFLICT (user_id, role_id) DO NOTHING
    `;
    console.log(`✓ Role assigned          → buyer_seller`);
  }

  // ── 4. Enrol in the Self system company (created by migration) ───────────
  const selfCompany = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM identity.companies WHERE slug = 'self' AND is_system = true
  `;
  if (selfCompany.length > 0) {
    await prisma.$executeRaw`
      INSERT INTO identity.company_members
        (company_id, user_id, role, is_admin, status, permissions)
      VALUES
        (${selfCompany[0].id}::uuid, ${userId}::uuid,
         'buyer_seller', false, 'active', '[]'::jsonb)
      ON CONFLICT (company_id, user_id) DO NOTHING
    `;
    console.log(`✓ Self company enrolled  → buyer_seller`);
  } else {
    console.warn(`⚠ Self company not found — run migrations first`);
  }

  // ── 5. Create / find two business companies ───────────────────────────────
  const companies = [
    {
      name: 'Acme Real Estate Agency',
      slug: 'acme-real-estate-agency',
      category: 'agent',
      email: 'info@acme-agency.test',
      logoUrl: 'https://ui-avatars.com/api/?name=Acme+Real+Estate&size=256&background=1a5276&color=ffffff&bold=true&format=png',
      isAdmin: true,
      role: 'admin',
    },
    {
      name: 'BuildRight Contractors',
      slug: 'buildright-contractors',
      category: 'contractor',
      email: 'info@buildright.test',
      logoUrl: 'https://ui-avatars.com/api/?name=BuildRight+Contractors&size=256&background=1e8449&color=ffffff&bold=true&format=png',
      isAdmin: false,
      role: 'member',
    },
  ] as const;

  for (const co of companies) {
    // Upsert company (by slug)
    const existingCo = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM identity.companies WHERE slug = ${co.slug}
    `;

    let companyId: string;
    if (existingCo.length > 0) {
      companyId = existingCo[0].id;
      console.log(`✓ Found company          → ${co.name} (${companyId})`);
    } else {
      const created = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO identity.companies
          (name, slug, category, email, logo_url, address, status, verification_status, created_by)
        VALUES
          (${co.name}, ${co.slug}, ${co.category}, ${co.email}, ${co.logoUrl},
           '{"city":"Johannesburg","country":"ZA"}'::jsonb,
           'active', 'verified', ${userId}::uuid)
        RETURNING id
      `;
      companyId = created[0].id;
      console.log(`✓ Created company        → ${co.name} (${companyId})`);
    }

    // Upsert membership
    const existingMember = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM identity.company_members
      WHERE company_id = ${companyId}::uuid AND user_id = ${userId}::uuid
    `;

    if (existingMember.length > 0) {
      await prisma.$executeRaw`
        UPDATE identity.company_members
        SET role     = ${co.role},
            is_admin = ${co.isAdmin},
            status   = 'active',
            updated_at = NOW()
        WHERE company_id = ${companyId}::uuid AND user_id = ${userId}::uuid
      `;
      console.log(`✓ Updated membership     → ${co.name} | role=${co.role} | admin=${co.isAdmin}`);
    } else {
      await prisma.$executeRaw`
        INSERT INTO identity.company_members
          (company_id, user_id, role, is_admin, status, permissions)
        VALUES
          (${companyId}::uuid, ${userId}::uuid, ${co.role}, ${co.isAdmin}, 'active', '[]'::jsonb)
      `;
      console.log(`✓ Created membership     → ${co.name} | role=${co.role} | admin=${co.isAdmin}`);
    }
  }

  console.log('\n✅ Seed complete.');
  console.log(`   email    : ${email}`);
  console.log(`   password : ${password}`);
  console.log(`   userId   : ${userId}`);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
