-- Migration: Self system company
-- Adds a default "Self" company that every registered user automatically joins
-- as a buyer_seller. This company is immutable by users (is_system = true).

-- ============================================================
-- 1. Add is_system flag to identity.companies
-- ============================================================
ALTER TABLE identity.companies
  ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- 2. Make created_by nullable (system companies have no creator)
-- ============================================================
ALTER TABLE identity.companies
  ALTER COLUMN created_by DROP NOT NULL;

-- ============================================================
-- 3. Insert the Self system company
-- ============================================================
INSERT INTO identity.companies (
  name, slug, category, email, address,
  status, verification_status, is_system, created_by
) VALUES (
  'Self',
  'self',
  'personal',
  'system@pribec.internal',
  '{}'::jsonb,
  'active',
  'verified',
  true,
  NULL
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 4. Enrol all existing users in the Self company (buyer_seller)
-- ============================================================
INSERT INTO identity.company_members (
  company_id, user_id, role, is_admin, status, permissions
)
SELECT
  c.id,
  u.id,
  'buyer_seller',
  false,
  'active',
  '[]'::jsonb
FROM identity.users u
CROSS JOIN (
  SELECT id FROM identity.companies WHERE slug = 'self' AND is_system = true
) c
ON CONFLICT (company_id, user_id) DO NOTHING;
