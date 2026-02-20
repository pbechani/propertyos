-- PRIBEC Database Schema Initialization
-- Creates all bounded context schemas as per PDR-006

-- Identity & Access Management
CREATE SCHEMA IF NOT EXISTS identity;
COMMENT ON SCHEMA identity IS 'Users, roles, KYC, sessions';

-- Property Listings & Verification
CREATE SCHEMA IF NOT EXISTS property;
COMMENT ON SCHEMA property IS 'Listings, ownership, verification';

-- Sales Pipeline & Progression
CREATE SCHEMA IF NOT EXISTS sales;
COMMENT ON SCHEMA sales IS 'Purchase stages, documents';

-- Financial Ledger (Event-Sourced)
CREATE SCHEMA IF NOT EXISTS financial;
COMMENT ON SCHEMA financial IS 'Accounts, ledger, escrow - event-sourced';

-- Construction Project Management
CREATE SCHEMA IF NOT EXISTS construction;
COMMENT ON SCHEMA construction IS 'Projects, milestones, stages';

-- Contractor & Supplier Marketplace
CREATE SCHEMA IF NOT EXISTS marketplace;
COMMENT ON SCHEMA marketplace IS 'Contractors, suppliers, RFQ';

-- Logistics & Transport
CREATE SCHEMA IF NOT EXISTS logistics;
COMMENT ON SCHEMA logistics IS 'Operators, deliveries, tracking';

-- Inspection Management
CREATE SCHEMA IF NOT EXISTS inspection;
COMMENT ON SCHEMA inspection IS 'Requirements, results, certificates';

-- Analytics & Risk Engine
CREATE SCHEMA IF NOT EXISTS analytics;
COMMENT ON SCHEMA analytics IS 'Risk scores, predictions';

-- AI Engine & Design
CREATE SCHEMA IF NOT EXISTS ai_engine;
COMMENT ON SCHEMA ai_engine IS 'Design sessions, generated content';

-- Shared Audit Logs
CREATE SCHEMA IF NOT EXISTS audit;
COMMENT ON SCHEMA audit IS 'Shared audit logs across all schemas';

-- Common Lookup Tables
CREATE SCHEMA IF NOT EXISTS common;
COMMENT ON SCHEMA common IS 'Shared lookup tables (currencies, countries, etc)';

-- Create audit log table for cross-cutting concerns
CREATE TABLE IF NOT EXISTS audit.logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schema_name VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_record ON audit.logs(schema_name, table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit.logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit.logs(created_at);

-- Create common lookup tables
CREATE TABLE IF NOT EXISTS common.currencies (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(5) NOT NULL,
    decimal_places SMALLINT NOT NULL DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO common.currencies (code, name, symbol, decimal_places) VALUES
    ('USD', 'US Dollar', '$', 2),
    ('ZAR', 'South African Rand', 'R', 2),
    ('KES', 'Kenyan Shilling', 'KSh', 2),
    ('NGN', 'Nigerian Naira', '₦', 2),
    ('GHS', 'Ghanaian Cedi', '₵', 2),
    ('EUR', 'Euro', '€', 2),
    ('GBP', 'British Pound', '£', 2)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS common.countries (
    code VARCHAR(2) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    currency_code VARCHAR(3) REFERENCES common.currencies(code),
    phone_code VARCHAR(5) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO common.countries (code, name, currency_code, phone_code) VALUES
    ('ZA', 'South Africa', 'ZAR', '+27'),
    ('KE', 'Kenya', 'KES', '+254'),
    ('NG', 'Nigeria', 'NGN', '+234'),
    ('GH', 'Ghana', 'GHS', '+233'),
    ('US', 'United States', 'USD', '+1'),
    ('GB', 'United Kingdom', 'GBP', '+44')
ON CONFLICT (code) DO NOTHING;

-- Grant schema access to application user
GRANT USAGE ON SCHEMA identity TO pribec;
GRANT USAGE ON SCHEMA property TO pribec;
GRANT USAGE ON SCHEMA sales TO pribec;
GRANT USAGE ON SCHEMA financial TO pribec;
GRANT USAGE ON SCHEMA construction TO pribec;
GRANT USAGE ON SCHEMA marketplace TO pribec;
GRANT USAGE ON SCHEMA logistics TO pribec;
GRANT USAGE ON SCHEMA inspection TO pribec;
GRANT USAGE ON SCHEMA analytics TO pribec;
GRANT USAGE ON SCHEMA ai_engine TO pribec;
GRANT USAGE ON SCHEMA audit TO pribec;
GRANT USAGE ON SCHEMA common TO pribec;

-- Grant table permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA identity TO pribec;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA property TO pribec;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA sales TO pribec;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA financial TO pribec;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA construction TO pribec;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA marketplace TO pribec;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA logistics TO pribec;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA inspection TO pribec;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO pribec;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ai_engine TO pribec;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO pribec;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA common TO pribec;

-- Set default schema permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA identity GRANT ALL ON TABLES TO pribec;
ALTER DEFAULT PRIVILEGES IN SCHEMA property GRANT ALL ON TABLES TO pribec;
ALTER DEFAULT PRIVILEGES IN SCHEMA sales GRANT ALL ON TABLES TO pribec;
ALTER DEFAULT PRIVILEGES IN SCHEMA financial GRANT ALL ON TABLES TO pribec;
ALTER DEFAULT PRIVILEGES IN SCHEMA construction GRANT ALL ON TABLES TO pribec;
ALTER DEFAULT PRIVILEGES IN SCHEMA marketplace GRANT ALL ON TABLES TO pribec;
ALTER DEFAULT PRIVILEGES IN SCHEMA logistics GRANT ALL ON TABLES TO pribec;
ALTER DEFAULT PRIVILEGES IN SCHEMA inspection GRANT ALL ON TABLES TO pribec;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT ALL ON TABLES TO pribec;
ALTER DEFAULT PRIVILEGES IN SCHEMA ai_engine GRANT ALL ON TABLES TO pribec;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT ALL ON TABLES TO pribec;
ALTER DEFAULT PRIVILEGES IN SCHEMA common GRANT ALL ON TABLES TO pribec;

-- Log schema creation
DO $$
BEGIN
    RAISE NOTICE 'PRIBEC schemas created successfully';
    RAISE NOTICE 'Schemas: identity, property, sales, financial, construction, marketplace, logistics, inspection, analytics, ai_engine, audit, common';
END $$;
