-- Add unique QR token to each open house registration for scan-based check-in
ALTER TABLE property.open_house_registrations
  ADD COLUMN IF NOT EXISTS qr_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_open_house_reg_qr_token
  ON property.open_house_registrations (qr_token);
