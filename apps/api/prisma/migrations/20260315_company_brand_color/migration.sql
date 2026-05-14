-- Add brand_color column to companies table for property card header theming
ALTER TABLE identity.companies
ADD COLUMN IF NOT EXISTS brand_color VARCHAR(7);

COMMENT ON COLUMN identity.companies.brand_color IS 'Hex colour code (e.g. #4A9E8E) used as the background of the property card header banner';
