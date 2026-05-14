-- Migration: extend lead_activities type CHECK constraint
-- Adds: 'property-sent', 'viewing', 'follow-up'
-- These are used by SendPropertiesModal, ScheduleFollowUpModal and the lead detail page.

-- PostgreSQL doesn't support ALTER ... MODIFY CHECK directly.
-- Drop the old constraint and re-create it with the expanded list.

ALTER TABLE sales.lead_activities
  DROP CONSTRAINT IF EXISTS lead_activities_type_check;

ALTER TABLE sales.lead_activities
  ADD CONSTRAINT lead_activities_type_check
    CHECK (type IN (
      'email',
      'call',
      'sms',
      'meeting',
      'note',
      'stage_change',
      'property-sent',
      'viewing',
      'follow-up'
    ));
