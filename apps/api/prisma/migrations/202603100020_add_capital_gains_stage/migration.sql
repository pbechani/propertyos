-- ============================================================
-- Migration: Add Capital Gains / Income Tax Clearance stage
--
-- Inserts a new Stage 13 (SARS Capital Gains/Income Tax
-- clearance certificate) between Transfer Duty Payment (12)
-- and Deeds Office Registration (was 13, now 14).
--
-- Existing stages 13 and 14 are shifted up to 14 and 15.
-- Any in-flight sale_stages rows are also renumbered to keep
-- consistency.
-- ============================================================

-- Step 1: Temporarily drop the unique constraint so we can
--         renumber without violating (country, stage_number)
ALTER TABLE sales.stage_configs
  DROP CONSTRAINT IF EXISTS stage_configs_country_stage_number_key;

-- Step 2: Shift existing stages 13→14 and 14→15
--         (do 14→15 first to avoid a transient collision)
UPDATE sales.stage_configs SET stage_number = 15 WHERE country = 'ZA' AND stage_number = 14;
UPDATE sales.stage_configs SET stage_number = 14 WHERE country = 'ZA' AND stage_number = 13;

-- Step 3: Re-add the unique constraint
ALTER TABLE sales.stage_configs
  ADD CONSTRAINT stage_configs_country_stage_number_key UNIQUE (country, stage_number);

-- Step 4: Insert the new stage 13
INSERT INTO sales.stage_configs
  (country, stage_number, stage_name, description, responsible_role, is_blocker, government_dept, typical_duration_days, required_documents)
VALUES
  ('ZA', 13,
   'Capital Gains / Income Tax Clearance',
   'Seller obtains SARS capital gains and income tax compliance certificate required before transfer can be registered',
   'conveyancer',
   TRUE,
   'SARS / Tax Authority',
   14,
   '["sars_capital_gains_certificate","sars_tax_compliance_certificate"]'
  )
ON CONFLICT (country, stage_number) DO NOTHING;

-- Step 5: Renumber any existing in-flight sale_stage_progress rows
--         (do 14→15 first, then 13→14)
UPDATE sales.sale_stage_progress SET stage_number = 15 WHERE stage_number = 14;
UPDATE sales.sale_stage_progress SET stage_number = 14 WHERE stage_number = 13;

-- Step 6: Also fix stage_number references in stage_documents
UPDATE sales.stage_documents SET stage_number = 15 WHERE stage_number = 14;
UPDATE sales.stage_documents SET stage_number = 14 WHERE stage_number = 13;

-- Step 7: Same for government_interactions
UPDATE sales.government_interactions SET stage_number = 15 WHERE stage_number = 14;
UPDATE sales.government_interactions SET stage_number = 14 WHERE stage_number = 13;
