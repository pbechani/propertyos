CREATE TABLE IF NOT EXISTS identity.user_business_profiles (
  user_id UUID PRIMARY KEY REFERENCES identity.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  business_type VARCHAR(100),
  license_number VARCHAR(100),
  years_experience VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_identity_user_business_profiles_company_name
  ON identity.user_business_profiles (company_name);
