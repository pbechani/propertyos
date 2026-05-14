-- Migration: 202603160032_open_house_marketing_options
-- Add marketing_options JSONB column to property.open_houses
-- Stores an array of { channel: string, enabled: boolean } objects

ALTER TABLE property.open_houses
  ADD COLUMN IF NOT EXISTS marketing_options JSONB;
