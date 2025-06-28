-- Test RLS Policies - Run this while logged in as demo user
-- This tests if the Row Level Security policies are working correctly

-- First, check what user is currently authenticated
SELECT 'Current authenticated user' as test_type, auth.uid() as current_user_id;

-- Check if the current user has a profile
SELECT 'User profile lookup' as test_type,
       id,
       email,
       name,
       role,
       company_id
FROM mt_users 
WHERE id = auth.uid();

-- Test vehicle access (this is what the app queries)
SELECT 'Vehicle access test' as test_type,
       id,
       make,
       model,
       year,
       is_active,
       company_id
FROM mt_vehicles 
WHERE company_id IN (
    SELECT company_id FROM mt_users WHERE id = auth.uid()
) AND is_active = true;

-- Test maintenance records access
SELECT 'Maintenance records test' as test_type,
       count(*) as total_records
FROM mt_maintenance_records mr
JOIN mt_vehicles v ON mr.vehicle_id = v.id
WHERE v.company_id IN (
    SELECT company_id FROM mt_users WHERE id = auth.uid()
);