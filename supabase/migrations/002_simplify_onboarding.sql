-- Simplify onboarding by adding a field to mt_companies instead of separate table
ALTER TABLE mt_companies ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Drop the complex onboarding status table since we don't need it
DROP TABLE IF EXISTS mt_onboarding_status;