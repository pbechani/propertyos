-- Add listing_type column to property.properties
-- Values: 'for_sale' | 'to_rent' | 'development'

ALTER TABLE property.properties
  ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20) NULL;
