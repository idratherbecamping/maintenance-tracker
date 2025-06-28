-- Debug Demo Data - Check what exists and what's missing
-- Run this to see exactly what data exists for your demo user

-- 1. Check if demo user profile exists and is linked to company
SELECT 'Demo User Profile' as check_type,
       u.id as user_id,
       u.email,
       u.name,
       u.role,
       u.company_id,
       c.name as company_name
FROM mt_users u
LEFT JOIN mt_companies c ON u.company_id = c.id
WHERE u.id = 'a696b48c-f756-41f0-b10f-fb7428328b51';

-- 2. Check if demo company exists
SELECT 'Demo Company' as check_type,
       id as company_id,
       name as company_name,
       created_at,
       settings
FROM mt_companies 
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- 3. Check vehicles for demo company
SELECT 'Demo Vehicles' as check_type,
       id as vehicle_id,
       make,
       model,
       year,
       license_plate,
       current_mileage,
       company_id
FROM mt_vehicles 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440000';

-- 4. Check maintenance records for demo company vehicles
SELECT 'Demo Maintenance Records' as check_type,
       mr.id as record_id,
       v.make || ' ' || v.model as vehicle,
       mr.mileage,
       COALESCE(mt.name, mr.custom_type) as maintenance_type,
       mr.cost,
       mr.date,
       mr.user_id
FROM mt_maintenance_records mr
JOIN mt_vehicles v ON mr.vehicle_id = v.id
LEFT JOIN mt_maintenance_types mt ON mr.type_id = mt.id
WHERE v.company_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY mr.date DESC;

-- 5. Check total counts
SELECT 'Summary Counts' as check_type,
       (SELECT count(*) FROM mt_companies WHERE id = '550e8400-e29b-41d4-a716-446655440000') as companies,
       (SELECT count(*) FROM mt_users WHERE company_id = '550e8400-e29b-41d4-a716-446655440000') as users,
       (SELECT count(*) FROM mt_vehicles WHERE company_id = '550e8400-e29b-41d4-a716-446655440000') as vehicles,
       (SELECT count(*) FROM mt_maintenance_records WHERE vehicle_id IN (
           SELECT id FROM mt_vehicles WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'
       )) as maintenance_records;

-- 6. Check if there are any RLS policy issues by checking what the current user can see
-- (This will only work if you run it while authenticated as the demo user)
SELECT 'RLS Test - Current User Access' as check_type,
       auth.uid() as current_user_id,
       (SELECT company_id FROM mt_users WHERE id = auth.uid()) as user_company_id;

-- 7. Check if maintenance types exist
SELECT 'Maintenance Types' as check_type,
       count(*) as total_types,
       count(*) FILTER (WHERE company_id IS NULL) as default_types,
       count(*) FILTER (WHERE company_id = '550e8400-e29b-41d4-a716-446655440000') as company_types
FROM mt_maintenance_types;