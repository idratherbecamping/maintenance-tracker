-- Add day_of_week column to mt_reminder_rules table
-- 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
-- NULL = no specific day preference (use existing interval logic)
ALTER TABLE mt_reminder_rules 
ADD COLUMN IF NOT EXISTS day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6);

-- Add comment for clarity
COMMENT ON COLUMN mt_reminder_rules.day_of_week IS 'Day of week for time-based reminders (0=Sunday, 1=Monday, ..., 6=Saturday). NULL=no preference.';