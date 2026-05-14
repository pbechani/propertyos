-- Add buyer_countered status to property_offers
-- Distinguishes "seller counter-offered → buyer must act" (countered)
-- from "buyer counter-offered back → seller must act" (buyer_countered)

ALTER TABLE sales.property_offers
  DROP CONSTRAINT IF EXISTS property_offers_status_check;

ALTER TABLE sales.property_offers
  ADD CONSTRAINT property_offers_status_check
    CHECK (status IN (
      'pending',
      'submitted',
      'accepted',
      'rejected',
      'countered',
      'buyer_countered',
      'withdrawn'
    ));
