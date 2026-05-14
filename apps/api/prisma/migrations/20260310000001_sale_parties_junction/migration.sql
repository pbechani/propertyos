-- ============================================================
-- sales.sale_buyers  (many-to-many: sale ↔ buyers)
-- A sale may have multiple co-buyers (e.g. joint purchasers,
-- investment consortiums).  The legacy buyer_id column on
-- property_sales is retained for backward-compat but the
-- junction table is the authoritative source going forward.
-- ============================================================
CREATE TABLE IF NOT EXISTS sales.sale_buyers (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id    UUID        NOT NULL REFERENCES sales.property_sales(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL,               -- app-layer ref: identity.users(id)
  added_by   UUID        NOT NULL,               -- user who performed the assignment
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(sale_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_sale_buyers_sale ON sales.sale_buyers (sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_buyers_user ON sales.sale_buyers (user_id);

-- ============================================================
-- sales.sale_sellers  (many-to-many: sale ↔ sellers)
-- A property may be co-owned and sold by multiple sellers.
-- ============================================================
CREATE TABLE IF NOT EXISTS sales.sale_sellers (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id    UUID        NOT NULL REFERENCES sales.property_sales(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL,               -- app-layer ref: identity.users(id)
  added_by   UUID        NOT NULL,               -- user who performed the assignment
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(sale_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_sale_sellers_sale ON sales.sale_sellers (sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_sellers_user ON sales.sale_sellers (user_id);

-- ============================================================
-- Backfill: seed the junction tables from the legacy FK columns
-- ============================================================
INSERT INTO sales.sale_sellers (sale_id, user_id, added_by)
  SELECT id, seller_id, seller_id
  FROM   sales.property_sales
ON CONFLICT (sale_id, user_id) DO NOTHING;

INSERT INTO sales.sale_buyers (sale_id, user_id, added_by)
  SELECT id, buyer_id, buyer_id
  FROM   sales.property_sales
  WHERE  buyer_id IS NOT NULL
ON CONFLICT (sale_id, user_id) DO NOTHING;
