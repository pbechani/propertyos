-- Add buyer_email to property_offers for email notifications
ALTER TABLE sales.property_offers
  ADD COLUMN IF NOT EXISTS buyer_email TEXT;
