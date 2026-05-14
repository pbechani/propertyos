-- Migration: 202603160031_open_house_preparation_checklist
-- Add preparation_checklist JSONB column to property.open_houses
-- Stores an array of { task: string, completed: boolean } objects

ALTER TABLE property.open_houses
  ADD COLUMN IF NOT EXISTS preparation_checklist JSONB;
