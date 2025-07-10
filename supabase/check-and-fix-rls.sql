-- Check and fix RLS issues for signin

-- 1. First, let's see ALL existing policies on mt_users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'mt_users'
ORDER BY policyname;

-- 2. Check if your user exists in the database
SELECT id, email, name, role, company_id 
FROM mt_users 
WHERE email = 'gannon@avalon-iq.com';

-- 3. TEMPORARY FIX - Disable RLS to allow signin
-- This will immediately fix the hanging issue
ALTER TABLE mt_users DISABLE ROW LEVEL SECURITY;

-- 4. Test signin now - it should work!

-- 5. After confirming signin works, we can properly fix RLS policies
-- Run this to re-enable RLS with proper policies:
/*
-- Re-enable RLS
ALTER TABLE mt_users ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies first
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'mt_users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON mt_users', pol.policyname);
    END LOOP;
END $$;

-- Create proper policies
CREATE POLICY "users_select_own" ON mt_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON mt_users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_select_same_company" ON mt_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mt_users u
            WHERE u.id = auth.uid() 
            AND u.company_id = mt_users.company_id
        )
    );
*/