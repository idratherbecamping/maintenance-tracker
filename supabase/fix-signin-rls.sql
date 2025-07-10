-- Emergency fix for signin hanging issue
-- The problem: RLS policies are preventing users from reading their own profile

-- First, let's check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('mt_users', 'mt_companies');

-- Drop ALL existing policies on mt_users to start fresh
DROP POLICY IF EXISTS "Users can view users in their company" ON mt_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON mt_users;
DROP POLICY IF EXISTS "Owners can manage users in their company" ON mt_users;
DROP POLICY IF EXISTS "Users can read their own profile" ON mt_users;
DROP POLICY IF EXISTS "Users can view company members" ON mt_users;
DROP POLICY IF EXISTS "Owners can manage company users" ON mt_users;
DROP POLICY IF EXISTS "Admins can manage users in their company" ON mt_users;

-- Create the SIMPLEST possible policy - users can ONLY read their own profile
CREATE POLICY "Users can read own profile" ON mt_users
    FOR SELECT 
    USING (auth.uid() = id);

-- Allow users to be inserted via service role (for signup)
CREATE POLICY "Service role can insert users" ON mt_users
    FOR INSERT 
    WITH CHECK (true);

-- Test if we can see the user
SELECT id, email, name, role, company_id 
FROM mt_users 
WHERE id = '6f23ca30-52ff-4a6d-9317-db15e3ef8a0b';

-- If you need to temporarily disable RLS to fix data (CAREFUL - only for debugging):
-- ALTER TABLE mt_users DISABLE ROW LEVEL SECURITY;
-- After fixing, re-enable:
-- ALTER TABLE mt_users ENABLE ROW LEVEL SECURITY;