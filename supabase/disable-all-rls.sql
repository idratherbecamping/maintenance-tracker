-- Disable RLS on ALL maintenance tracker tables
-- Run this to immediately fix data loading issues

ALTER TABLE mt_active_reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_maintenance_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_maintenance_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_maintenance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_maintenance_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_reminder_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE mt_vehicles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity as "RLS Status"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'mt_%'
ORDER BY tablename;

-- Check if data exists for your user
SELECT 
    u.id, u.email, u.name, u.role,
    c.id as company_id, c.name as company_name,
    COUNT(DISTINCT v.id) as vehicle_count,
    COUNT(DISTINCT mr.id) as maintenance_count
FROM mt_users u
LEFT JOIN mt_companies c ON u.company_id = c.id
LEFT JOIN mt_vehicles v ON v.company_id = c.id
LEFT JOIN mt_maintenance_records mr ON mr.company_id = c.id
WHERE u.email = 'gannon@avalon-iq.com'
GROUP BY u.id, u.email, u.name, u.role, c.id, c.name;