-- Fix RLS policies for mt_companies to allow signup
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their company" ON mt_companies;
DROP POLICY IF EXISTS "Users can update their company" ON mt_companies;
DROP POLICY IF EXISTS "Users can insert their company" ON mt_companies;
DROP POLICY IF EXISTS "Owners can manage their company" ON mt_companies;

-- Create new policies that allow signup
CREATE POLICY "Users can view their company" ON mt_companies
    FOR SELECT
    USING (
        id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their company" ON mt_companies
    FOR UPDATE
    USING (
        id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- Allow authenticated users to insert companies (needed for signup)
CREATE POLICY "Authenticated users can create companies" ON mt_companies
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow owners to delete their companies
CREATE POLICY "Owners can delete their company" ON mt_companies
    FOR DELETE
    USING (
        id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid() AND role = 'owner'
        )
    );