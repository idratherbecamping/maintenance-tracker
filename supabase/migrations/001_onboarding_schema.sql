-- Add additional fields to mt_companies for business information
ALTER TABLE mt_companies ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE mt_companies ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE mt_companies ADD COLUMN IF NOT EXISTS state VARCHAR(50);
ALTER TABLE mt_companies ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
ALTER TABLE mt_companies ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE mt_companies ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE mt_companies ADD COLUMN IF NOT EXISTS business_type VARCHAR(100);
ALTER TABLE mt_companies ADD COLUMN IF NOT EXISTS employee_count VARCHAR(50);

-- Add phone number to mt_users
ALTER TABLE mt_users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Create onboarding status tracking table
CREATE TABLE IF NOT EXISTS mt_onboarding_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES mt_companies(id) ON DELETE CASCADE,
    current_step INTEGER DEFAULT 1,
    completed_steps JSONB DEFAULT '[]'::jsonb,
    is_completed BOOLEAN DEFAULT false,
    skipped BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_company ON mt_onboarding_status(company_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_completed ON mt_onboarding_status(is_completed);

-- Update RLS policies for new table
ALTER TABLE mt_onboarding_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for onboarding status
DROP POLICY IF EXISTS "Users can manage their company onboarding status" ON mt_onboarding_status;
CREATE POLICY "Users can manage their company onboarding status" ON mt_onboarding_status
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid()
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mt_onboarding_status_updated_at BEFORE UPDATE
    ON mt_onboarding_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();