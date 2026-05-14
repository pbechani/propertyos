-- Migration: 202603060018_open_house_lifecycle
-- Add cancel_reason, rescheduled_at, rescheduled_reason columns to property.open_houses
-- These fields support the cancel/reschedule workflows with attendee email notifications.

ALTER TABLE property.open_houses
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rescheduled_reason TEXT;
