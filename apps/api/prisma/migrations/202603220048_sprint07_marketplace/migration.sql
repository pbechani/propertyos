-- Sprint 07: Contractor & Supplier Marketplaces
-- Creates all tables in the marketplace schema

CREATE TABLE "marketplace"."contractor_profiles" (
    "id"                       UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id"                  UUID,
    "company_id"               UUID,
    "business_name"            VARCHAR(255),
    "registration_number"      VARCHAR(100),
    "specializations"          JSONB NOT NULL DEFAULT '[]',
    "experience_years"         SMALLINT,
    "max_project_value"        DECIMAL(18,2),
    "service_areas"            JSONB NOT NULL DEFAULT '[]',
    "certifications"           JSONB NOT NULL DEFAULT '[]',
    "insurance_certificate_url" TEXT,
    "insurance_expiry"         DATE,
    "bio"                      TEXT,
    "verification_status"      VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reputation_score"         DECIMAL(4,2) NOT NULL DEFAULT 0,
    "created_at"               TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at"               TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "contractor_profiles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_contractor_profiles_status" ON "marketplace"."contractor_profiles"("verification_status");
CREATE INDEX "idx_contractor_profiles_company" ON "marketplace"."contractor_profiles"("company_id");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "marketplace"."contractor_portfolio" (
    "id"                    UUID NOT NULL DEFAULT gen_random_uuid(),
    "contractor_profile_id" UUID NOT NULL,
    "project_title"         VARCHAR(255) NOT NULL,
    "project_type"          VARCHAR(50),
    "project_value"         DECIMAL(18,2),
    "completion_date"       DATE,
    "description"           TEXT,
    "media_urls"            JSONB NOT NULL DEFAULT '[]',
    "is_verified"           BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at"            TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "contractor_portfolio_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "contractor_portfolio_contractor_profile_id_fkey"
        FOREIGN KEY ("contractor_profile_id")
        REFERENCES "marketplace"."contractor_profiles"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_contractor_portfolio_contractor" ON "marketplace"."contractor_portfolio"("contractor_profile_id");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "marketplace"."supplier_profiles" (
    "id"                   UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id"              UUID,
    "company_id"           UUID,
    "business_name"        VARCHAR(255) NOT NULL,
    "registration_number"  VARCHAR(100),
    "business_type"        VARCHAR(50),
    "delivery_areas"       JSONB NOT NULL DEFAULT '[]',
    "minimum_order_value"  DECIMAL(18,2),
    "payment_terms"        TEXT,
    "verification_status"  VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reputation_score"     DECIMAL(4,2) NOT NULL DEFAULT 0,
    "created_at"           TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "supplier_profiles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_supplier_profiles_status"  ON "marketplace"."supplier_profiles"("verification_status");
CREATE INDEX "idx_supplier_profiles_company" ON "marketplace"."supplier_profiles"("company_id");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "marketplace"."supplier_products" (
    "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
    "supplier_id"    UUID NOT NULL,
    "sku"            VARCHAR(100),
    "product_name"   VARCHAR(255) NOT NULL,
    "category"       VARCHAR(100) NOT NULL,
    "subcategory"    VARCHAR(100),
    "description"    TEXT,
    "unit"           VARCHAR(30) NOT NULL,
    "unit_price"     DECIMAL(18,2) NOT NULL,
    "currency"       CHAR(3) NOT NULL,
    "stock_quantity" DECIMAL(10,2),
    "min_order_qty"  DECIMAL(10,2) NOT NULL DEFAULT 1,
    "lead_time_days" SMALLINT,
    "is_available"   BOOLEAN NOT NULL DEFAULT TRUE,
    "media_urls"     JSONB NOT NULL DEFAULT '[]',
    "specifications" JSONB,
    "created_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "supplier_products_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "supplier_products_supplier_id_fkey"
        FOREIGN KEY ("supplier_id")
        REFERENCES "marketplace"."supplier_profiles"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_supplier_products_category" ON "marketplace"."supplier_products"("category", "is_available");
CREATE INDEX "idx_supplier_products_supplier" ON "marketplace"."supplier_products"("supplier_id");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "marketplace"."rfqs" (
    "id"                  UUID NOT NULL DEFAULT gen_random_uuid(),
    "rfq_reference"       VARCHAR(50) NOT NULL,
    "rfq_type"            VARCHAR(20) NOT NULL,
    "project_id"          UUID,
    "requester_id"        UUID NOT NULL,
    "company_id"          UUID,
    "title"               VARCHAR(255) NOT NULL,
    "description"         TEXT,
    "scope_of_work"       TEXT,
    "required_skills"     JSONB NOT NULL DEFAULT '[]',
    "site_location"       JSONB,
    "start_date"          DATE,
    "end_date"            DATE,
    "budget_estimate"     DECIMAL(18,2),
    "currency"            CHAR(3) NOT NULL DEFAULT 'USD',
    "deadline_for_quotes" DATE NOT NULL,
    "status"              VARCHAR(20) NOT NULL DEFAULT 'open',
    "awarded_to"          UUID,
    "created_at"          TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "rfqs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "rfqs_rfq_reference_key" UNIQUE ("rfq_reference")
);

CREATE INDEX "idx_rfqs_requester_status" ON "marketplace"."rfqs"("requester_id", "status");
CREATE INDEX "idx_rfqs_type_status"      ON "marketplace"."rfqs"("rfq_type", "status");
CREATE INDEX "idx_rfqs_company"          ON "marketplace"."rfqs"("company_id");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "marketplace"."quotes" (
    "id"                  UUID NOT NULL DEFAULT gen_random_uuid(),
    "rfq_id"              UUID NOT NULL,
    "quoter_id"           UUID NOT NULL,
    "company_id"          UUID,
    "total_amount"        DECIMAL(18,2) NOT NULL,
    "currency"            CHAR(3) NOT NULL,
    "labor_amount"        DECIMAL(18,2),
    "materials_amount"    DECIMAL(18,2),
    "overhead_amount"     DECIMAL(18,2),
    "line_items"          JSONB NOT NULL DEFAULT '[]',
    "timeline_days"       INTEGER,
    "validity_days"       SMALLINT DEFAULT 30,
    "terms_and_conditions" TEXT,
    "notes"               TEXT,
    "documents"           JSONB NOT NULL DEFAULT '[]',
    "status"              VARCHAR(20) NOT NULL DEFAULT 'submitted',
    "submitted_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "expires_at"          TIMESTAMPTZ(6),

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "quotes_rfq_id_fkey"
        FOREIGN KEY ("rfq_id") REFERENCES "marketplace"."rfqs"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_quotes_rfq_status"    ON "marketplace"."quotes"("rfq_id", "status");
CREATE INDEX "idx_quotes_quoter_status" ON "marketplace"."quotes"("quoter_id", "status");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "marketplace"."contracts" (
    "id"                   UUID NOT NULL DEFAULT gen_random_uuid(),
    "contract_reference"   VARCHAR(50) NOT NULL,
    "quote_id"             UUID NOT NULL,
    "project_id"           UUID,
    "client_id"            UUID NOT NULL,
    "contractor_id"        UUID NOT NULL,
    "company_id"           UUID,
    "contract_value"       DECIMAL(18,2) NOT NULL,
    "currency"             CHAR(3) NOT NULL,
    "start_date"           DATE,
    "end_date"             DATE,
    "payment_terms"        TEXT,
    "contract_document_url" TEXT,
    "status"               VARCHAR(30) NOT NULL DEFAULT 'draft',
    "client_signed_at"     TIMESTAMPTZ(6),
    "contractor_signed_at" TIMESTAMPTZ(6),
    "created_at"           TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "contracts_contract_reference_key" UNIQUE ("contract_reference"),
    CONSTRAINT "contracts_quote_id_key" UNIQUE ("quote_id"),
    CONSTRAINT "contracts_quote_id_fkey"
        FOREIGN KEY ("quote_id") REFERENCES "marketplace"."quotes"("id")
);

CREATE INDEX "idx_contracts_client_status"     ON "marketplace"."contracts"("client_id", "status");
CREATE INDEX "idx_contracts_contractor_status" ON "marketplace"."contracts"("contractor_id", "status");
CREATE INDEX "idx_contracts_company"           ON "marketplace"."contracts"("company_id");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "marketplace"."orders" (
    "id"                      UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_reference"         VARCHAR(50) NOT NULL,
    "quote_id"                UUID,
    "project_id"              UUID,
    "buyer_id"                UUID NOT NULL,
    "supplier_id"             UUID NOT NULL,
    "company_id"              UUID,
    "total_amount"            DECIMAL(18,2) NOT NULL,
    "currency"                CHAR(3) NOT NULL,
    "delivery_address"        TEXT,
    "delivery_lat"            DECIMAL(9,6),
    "delivery_lng"            DECIMAL(9,6),
    "requested_delivery_date" DATE,
    "status"                  VARCHAR(30) NOT NULL DEFAULT 'placed',
    "escrow_account_id"       UUID,
    "placed_at"               TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "confirmed_at"            TIMESTAMPTZ(6),
    "shipped_at"              TIMESTAMPTZ(6),
    "delivered_at"            TIMESTAMPTZ(6),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "orders_order_reference_key" UNIQUE ("order_reference")
);

CREATE INDEX "idx_orders_buyer_status"    ON "marketplace"."orders"("buyer_id", "status");
CREATE INDEX "idx_orders_supplier_status" ON "marketplace"."orders"("supplier_id", "status");
CREATE INDEX "idx_orders_company"         ON "marketplace"."orders"("company_id");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "marketplace"."delivery_confirmations" (
    "id"                     UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id"               UUID NOT NULL,
    "confirmed_by"           UUID NOT NULL,
    "proof_photo_url"        TEXT,
    "proof_photo_lat"        DECIMAL(9,6),
    "proof_photo_lng"        DECIMAL(9,6),
    "condition"              VARCHAR(20),
    "damage_notes"           TEXT,
    "recipient_signature_url" TEXT,
    "confirmed_at"           TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "delivery_confirmations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "delivery_confirmations_order_id_key" UNIQUE ("order_id"),
    CONSTRAINT "delivery_confirmations_order_id_fkey"
        FOREIGN KEY ("order_id") REFERENCES "marketplace"."orders"("id") ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "marketplace"."ratings" (
    "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
    "rater_id"         UUID NOT NULL,
    "rated_entity_id"  UUID NOT NULL,
    "entity_type"      VARCHAR(20) NOT NULL,
    "reference_id"     UUID,
    "overall_score"    SMALLINT NOT NULL CHECK (overall_score BETWEEN 1 AND 5),
    "dimension_scores" JSONB,
    "review_text"      TEXT,
    "is_verified"      BOOLEAN NOT NULL DEFAULT FALSE,
    "is_published"     BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_ratings_entity" ON "marketplace"."ratings"("rated_entity_id", "entity_type");
CREATE INDEX "idx_ratings_rater"  ON "marketplace"."ratings"("rater_id");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "marketplace"."material_prices" (
    "id"                UUID NOT NULL DEFAULT gen_random_uuid(),
    "material_category" VARCHAR(100) NOT NULL,
    "material_name"     VARCHAR(255) NOT NULL,
    "unit"              VARCHAR(30) NOT NULL,
    "region"            VARCHAR(100) NOT NULL,
    "country"           CHAR(2) NOT NULL,
    "price"             DECIMAL(18,2) NOT NULL,
    "currency"          CHAR(3) NOT NULL,
    "price_tier"        VARCHAR(20) NOT NULL,
    "recorded_at"       TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "material_prices_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_material_prices_category_country" ON "marketplace"."material_prices"("material_category", "country", "recorded_at");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "marketplace"."audit_logs" (
    "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id"      UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id"      UUID,
    "actor_role"    VARCHAR(50),
    "company_id"    UUID,
    "action"        VARCHAR(100) NOT NULL,
    "resource_type" VARCHAR(100),
    "resource_id"   UUID,
    "payload"       JSONB,
    "ip_address"    INET,
    "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "marketplace_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_marketplace_audit_actor"    ON "marketplace"."audit_logs"("actor_id", "created_at");
CREATE INDEX "idx_marketplace_audit_resource" ON "marketplace"."audit_logs"("resource_type", "resource_id");
