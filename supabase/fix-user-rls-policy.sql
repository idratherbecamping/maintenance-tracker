-- Fix User RLS Policy
-- The current policy might be preventing users from reading their own profile

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can view users in their company" ON mt_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON mt_users;
DROP POLICY IF EXISTS "Owners can manage users in their company" ON mt_users;

-- Create a simple policy that allows users to read their own profile
CREATE POLICY "Users can read their own profile" ON mt_users
    FOR SELECT USING (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON mt_users
    FOR UPDATE USING (id = auth.uid());

-- Allow users to view other users in their company (after they can read their own profile)
CREATE POLICY "Users can view company members" ON mt_users
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid()
        )
    );

-- Allow owners to manage users in their company
CREATE POLICY "Owners can manage company users" ON mt_users
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM mt_users 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- Test the fix
SELECT 'RLS Policy Fix Applied' as status,
       'Users should now be able to read their own profile' as message;