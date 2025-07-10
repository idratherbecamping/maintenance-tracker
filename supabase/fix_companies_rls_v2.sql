-- Temporarily disable RLS for companies table to allow signup
-- This is needed because during signup, the user exists but mt_users record doesn't exist yet

ALTER TABLE mt_companies DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS after fixing the chicken-and-egg problem
ALTER TABLE mt_companies ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their company" ON mt_companies;
DROP POLICY IF EXISTS "Users can update their company" ON mt_companies;
DROP POLICY IF EXISTS "Users can insert their company" ON mt_companies;
DROP POLICY IF EXISTS "Owners can manage their company" ON mt_companies;
DROP POLICY IF EXISTS "Authenticated users can create companies" ON mt_companies;

-- Create a very permissive INSERT policy for signup
CREATE POLICY "Allow company creation during signup" ON mt_companies
    FOR INSERT
    WITH CHECK (true);

-- Restrict other operations to company members
CREATE POLICY "Users can view their company" ON mt_companies
    FOR SELECT
    USING (
        id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Owners can update their company" ON mt_companies
    FOR UPDATE
    USING (
        id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Owners can delete their company" ON mt_companies
    FOR DELETE
    USING (
        id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid() AND role = 'owner'
        )
    );