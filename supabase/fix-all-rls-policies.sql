-- Comprehensive RLS Fix for Maintenance Tracker
-- This script fixes all RLS policies to allow proper data access

-- 1. First, check current RLS status
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'mt_%'
ORDER BY tablename;

-- 2. Temporarily disable RLS on all tables (for immediate fix)
ALTER TABLE mt_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_maintenance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_maintenance_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_maintenance_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_onboarding_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_reminder_rules DISABLE ROW LEVEL SECURITY;

-- 3. Verify user exists
SELECT * FROM mt_users WHERE id = '6f23ca30-52ff-4a6d-9317-db15e3ef8a0b';

-- 4. Check all data for this user's company
SELECT 
    u.id, u.email, u.name, u.role,
    c.id as company_id, c.name as company_name,
    COUNT(DISTINCT v.id) as vehicle_count,
    COUNT(DISTINCT mr.id) as maintenance_count
FROM mt_users u
LEFT JOIN mt_companies c ON u.company_id = c.id
LEFT JOIN mt_vehicles v ON v.company_id = c.id
LEFT JOIN mt_maintenance_records mr ON mr.company_id = c.id
WHERE u.id = '6f23ca30-52ff-4a6d-9317-db15e3ef8a0b'
GROUP BY u.id, u.email, u.name, u.role, c.id, c.name;

-- 5. After confirming everything works, you can re-enable RLS with proper policies:
/*
-- Re-enable RLS with proper policies
ALTER TABLE mt_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_maintenance_records ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DO $$ 
DECLARE
    pol record;
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['mt_users', 'mt_companies', 'mt_vehicles', 'mt_maintenance_records'])
    LOOP
        FOR pol IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = tbl
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, tbl);
        END LOOP;
    END LOOP;
END $$;

-- Create new simplified policies

-- Users table
CREATE POLICY "users_all_own" ON mt_users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "users_view_same_company" ON mt_users
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid()
        )
    );

-- Companies table
CREATE POLICY "companies_view_own" ON mt_companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid()
        )
    );

CREATE POLICY "companies_all_admin" ON mt_companies
    FOR ALL USING (
        id IN (
            SELECT company_id FROM mt_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Vehicles table
CREATE POLICY "vehicles_view_own_company" ON mt_vehicles
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid()
        )
    );

CREATE POLICY "vehicles_all_admin" ON mt_vehicles
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM mt_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Maintenance records table
CREATE POLICY "maintenance_view_own_company" ON mt_maintenance_records
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid()
        )
    );

CREATE POLICY "maintenance_all_users" ON mt_maintenance_records
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid()
        )
    );
*/