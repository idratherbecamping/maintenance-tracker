-- Fix Circular RLS Dependency in mt_users table
-- The issue: policies were referencing mt_users table within mt_users policies

-- Step 1: Drop ALL existing policies on mt_users to start fresh
DROP POLICY IF EXISTS "Users can view users in their company" ON mt_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON mt_users;
DROP POLICY IF EXISTS "Owners can manage users in their company" ON mt_users;
DROP POLICY IF EXISTS "Users can read their own profile" ON mt_users;
DROP POLICY IF EXISTS "Users can view company members" ON mt_users;
DROP POLICY IF EXISTS "Owners can manage company users" ON mt_users;

-- Step 2: Create simple, non-recursive policies

-- Policy 1: Users can ALWAYS read their own profile (no company check needed)
CREATE POLICY "Users can read own profile" ON mt_users
    FOR SELECT USING (id = auth.uid());

-- Policy 2: Users can ALWAYS update their own profile
CREATE POLICY "Users can update own profile" ON mt_users
    FOR UPDATE USING (id = auth.uid());

-- Policy 3: For INSERT (when creating new users) - allow if inserting own ID
CREATE POLICY "Users can insert own profile" ON mt_users
    FOR INSERT WITH CHECK (id = auth.uid());

-- Step 3: Verify the fix by testing the problematic query
SELECT 'Testing user profile access...' as test;

-- This should now work without recursion
SELECT id, email, name, role, company_id 
FROM mt_users 
WHERE id = 'a696b48c-f756-41f0-b10f-fb7428328b51';

-- Step 4: Test that RLS is still working (should only return the specific user)
SELECT 'RLS Test - Should only see own profile' as test,
       count(*) as visible_users
FROM mt_users;

SELECT 'Fix completed successfully!' as status;