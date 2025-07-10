-- Debug ALL RLS issues

-- 1. Check RLS status on ALL tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'mt_%'
ORDER BY tablename;

-- 2. Disable RLS on ALL maintenance tracker tables
ALTER TABLE mt_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_maintenance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_maintenance_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_maintenance_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_onboarding_status DISABLE ROW LEVEL SECURITY;

-- 3. Check if user exists
SELECT * FROM mt_users WHERE email = 'gannon@avalon-iq.com';

-- 4. Check if company exists for this user
SELECT u.*, c.* 
FROM mt_users u
LEFT JOIN mt_companies c ON u.company_id = c.id
WHERE u.email = 'gannon@avalon-iq.com';