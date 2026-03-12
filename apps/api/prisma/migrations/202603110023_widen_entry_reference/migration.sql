-- Widen entry_reference from VARCHAR(50) to VARCHAR(100)
-- The format ESCROW_DEPOSIT-{uuid} = 51 chars which exceeded the old limit.
ALTER TABLE "financial"."ledger_entries"
  ALTER COLUMN "entry_reference" TYPE VARCHAR(100);
