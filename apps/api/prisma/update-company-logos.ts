import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LOGOS: Record<string, string> = {
  'acme-real-estate-agency':
    'https://ui-avatars.com/api/?name=Acme+Real+Estate&size=256&background=1a5276&color=ffffff&bold=true&format=png',
  'buildright-contractors':
    'https://ui-avatars.com/api/?name=BuildRight+Contractors&size=256&background=1e8449&color=ffffff&bold=true&format=png',
  'bechani-enterprises':
    'https://ui-avatars.com/api/?name=Bechani+Enterprises&size=256&background=7c3aed&color=ffffff&bold=true&format=png',
  'bechani-enterprises-1':
    'https://ui-avatars.com/api/?name=Bechani+Enterprises&size=256&background=7c3aed&color=ffffff&bold=true&format=png',
};

async function main() {
  for (const [slug, logoUrl] of Object.entries(LOGOS)) {
    const result = await prisma.$executeRaw`
      UPDATE identity.companies
      SET    logo_url   = ${logoUrl},
             updated_at = NOW()
      WHERE  slug = ${slug}
    `;
    console.log(`✓ ${slug}  (${result} row updated)  →  ${logoUrl}`);
  }

  const rows = await prisma.$queryRaw<{ name: string; slug: string; logo_url: string }[]>`
    SELECT name, slug, logo_url
    FROM   identity.companies
    WHERE  slug IN ('acme-real-estate-agency', 'buildright-contractors')
  `;

  console.log('\nCurrent state:');
  for (const r of rows) {
    console.log(`  ${r.name}`);
    console.log(`    logo_url : ${r.logo_url ?? '(null)'}`);
  }
}

main()
  .catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
