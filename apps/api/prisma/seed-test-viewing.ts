/**
 * Seed script: creates a test property listing + confirmed and completed viewings
 * so the new Agent Viewings UI (LiveViewingCapture + LogOutcomeModal) is visible.
 *
 * Usage: npx ts-node -r tsconfig-paths/register apps/api/prisma/seed-test-viewing.ts
 * (run from monorepo root)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ── 1. Find the test agent user ──────────────────────────────────────────
  const agentEmail = 'test@test.com';
  const users = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM identity.users WHERE email = ${agentEmail}
  `;
  if (users.length === 0) {
    throw new Error(`User ${agentEmail} not found — run seed-test-user.ts first`);
  }
  const agentId = users[0].id;
  console.log(`✓ Agent user             → ${agentId}`);

  // ── 2. Ensure agent has the 'agent' role ─────────────────────────────────
  const agentRole = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM identity.roles WHERE name = 'agent'
  `;
  if (agentRole.length > 0) {
    await prisma.$executeRaw`
      INSERT INTO identity.user_roles (user_id, role_id)
      VALUES (${agentId}::uuid, ${agentRole[0].id}::uuid)
      ON CONFLICT (user_id, role_id) DO NOTHING
    `;
    console.log(`✓ Agent role assigned    → agent`);
  }

  // ── 3. Find / create Acme Real Estate Agency company ────────────────────
  const companies = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM identity.companies WHERE slug = 'acme-real-estate-agency'
  `;
  let companyId: string;
  if (companies.length > 0) {
    companyId = companies[0].id;
    console.log(`✓ Found company          → Acme Real Estate Agency (${companyId})`);
  } else {
    const created = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO identity.companies
        (name, slug, category, email, logo_url, address, status, verification_status, created_by)
      VALUES
        ('Acme Real Estate Agency', 'acme-real-estate-agency', 'agent',
         'info@acme-agency.test',
         'https://ui-avatars.com/api/?name=Acme+Real+Estate&size=256&background=1a5276&color=ffffff&bold=true&format=png',
         '{"city":"Johannesburg","country":"ZA"}'::jsonb,
         'active', 'verified', ${agentId}::uuid)
      RETURNING id
    `;
    companyId = created[0].id;
    console.log(`✓ Created company        → Acme Real Estate Agency (${companyId})`);
  }

  // Ensure agent is a member of this company
  await prisma.$executeRaw`
    INSERT INTO identity.company_members
      (company_id, user_id, role, is_admin, status, permissions)
    VALUES
      (${companyId}::uuid, ${agentId}::uuid, 'admin', true, 'active', '[]'::jsonb)
    ON CONFLICT (company_id, user_id) DO NOTHING
  `;

  // ── 4. Create / find a test buyer user ───────────────────────────────────
  const buyerEmail = 'buyer@test.com';
  const buyers = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM identity.users WHERE email = ${buyerEmail}
  `;
  let buyerId: string;
  if (buyers.length > 0) {
    buyerId = buyers[0].id;
    console.log(`✓ Found buyer user       → ${buyerId}`);
  } else {
    const created = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO identity.users
        (email, first_name, last_name, password_hash, status, email_verified_at)
      VALUES
        (${buyerEmail}, 'Jane', 'Buyer',
         '$2b$12$placeholder_hash_not_for_login',
         'active', NOW())
      RETURNING id
    `;
    buyerId = created[0].id;
    console.log(`✓ Created buyer user     → ${buyerId}`);
  }

  // ── 5. Find or create a test property listing ────────────────────────────
  const existingProps = await prisma.$queryRaw<{ id: string; title: string }[]>`
    SELECT id, title FROM property.properties
    WHERE agent_id = ${agentId}::uuid AND status != 'archived'
    LIMIT 1
  `;

  let propertyId: string;
  if (existingProps.length > 0) {
    propertyId = existingProps[0].id;
    console.log(`✓ Found property         → "${existingProps[0].title}" (${propertyId})`);
  } else {
    const createdProp = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO property.properties
        (title, description, property_type, status, price, currency,
         area_sqm, bedrooms, bathrooms, parking_spaces,
         agent_id, company_id, listing_type, verification_status,
         features)
      VALUES
        ('Beautiful 3-Bedroom Family Home in Sandton', 
         'A stunning modern home nestled in a quiet cul-de-sac. Features an open-plan kitchen, spacious living areas, landscaped garden, and a sparkling pool. Perfect for families looking for space and comfort.',
         'residential', 'active', 2850000.00, 'ZAR',
         210.00, 3, 2, 2,
         ${agentId}::uuid, ${companyId}::uuid, 'sale', 'verified',
         '["pool","garden","double_garage","security_estate","fibre"]'::jsonb)
      RETURNING id
    `;
    propertyId = createdProp[0].id;
    console.log(`✓ Created property       → "${propertyId}"`);

    // Insert property location
    await prisma.$executeRaw`
      INSERT INTO property.property_locations
        (property_id, address_line1, city, region, country, postal_code, latitude, longitude)
      VALUES
        (${propertyId}::uuid,
         '14 Sandton Drive', 'Sandton', 'Gauteng', 'ZA', '2196',
         -26.107567, 28.056702)
    `;
    console.log(`✓ Location inserted`);
  }

  // ── 6. Remove any stale test viewings for this property ──────────────────
  const deletedCount = await prisma.$queryRaw<{ count: string }[]>`
    SELECT COUNT(*) as count FROM property.viewings
    WHERE property_id = ${propertyId}::uuid
      AND agent_id = ${agentId}::uuid
      AND buyer_id = ${buyerId}::uuid
  `;
  if (parseInt(deletedCount[0].count) > 0) {
    await prisma.$executeRaw`
      DELETE FROM property.viewings
      WHERE property_id = ${propertyId}::uuid
        AND agent_id = ${agentId}::uuid
        AND buyer_id = ${buyerId}::uuid
    `;
    console.log(`✓ Cleared old test viewings`);
  }

  // ── 7. Insert a CONFIRMED viewing (future — shows "Capture" button) ───────
  const confirmedViewing = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO property.viewings
      (property_id, agent_id, buyer_id, viewing_type, scheduled_at,
       duration_minutes, status, confirmed_at, agent_notes)
    VALUES
      (${propertyId}::uuid, ${agentId}::uuid, ${buyerId}::uuid,
       'physical', NOW() + interval '2 hours',
       45, 'confirmed', NOW(),
       'Buyer is pre-qualified. Interested in the pool and garden area.')
    RETURNING id
  `;
  const confirmedId = confirmedViewing[0].id;
  console.log(`✓ Confirmed viewing      → ${confirmedId} (in 2 hours)`);

  // ── 8. Insert a COMPLETED viewing with no agent_feedback ─────────────────
  // This shows the "Log Outcome" button and the nudge banner
  const completedViewing = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO property.viewings
      (property_id, agent_id, buyer_id, viewing_type, scheduled_at,
       duration_minutes, status, confirmed_at, completed_at, agent_notes)
    VALUES
      (${propertyId}::uuid, ${agentId}::uuid, ${buyerId}::uuid,
       'physical', NOW() - interval '3 hours',
       30, 'completed', NOW() - interval '4 hours', NOW() - interval '2 hours',
       'Buyer seemed very interested. Asked many questions about the school district.')
    RETURNING id
  `;
  const completedId = completedViewing[0].id;
  console.log(`✓ Completed viewing      → ${completedId} (3 hours ago, no feedback)`);

  // ── 9. Done ──────────────────────────────────────────────────────────────
  console.log('\n✅ Test data ready!');
  console.log('   Login credentials:');
  console.log('     email    : test@test.com');
  console.log('     password : N@than123');
  console.log('\n   View the new UI at:');
  console.log(`     → Viewings tab : http://localhost:3000/app/my-listings/${propertyId}?tab=viewings`);
  console.log(`     → Showings tab : http://localhost:3000/app/my-listings/${propertyId}?tab=showings`);
  console.log('\n   What to look for:');
  console.log('     • Confirmed viewing (in 2 hours) → green "Capture" button');
  console.log('     • Completed viewing (3 hrs ago)  → "Log Outcome" button');
  console.log('     • Yellow nudge banner             → "Log Now" button');
  console.log('     • Showings tab                   → Feedback Intelligence section (empty analytics)');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
