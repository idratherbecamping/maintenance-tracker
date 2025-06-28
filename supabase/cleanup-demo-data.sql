-- Cleanup Demo Data
-- Run this if you want to completely remove existing demo data and start fresh

-- Delete in correct order due to foreign key constraints
DELETE FROM mt_maintenance_recommendations 
WHERE maintenance_id IN (
  SELECT id FROM mt_maintenance_records 
  WHERE vehicle_id IN (
    SELECT id FROM mt_vehicles 
    WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'
  )
);

DELETE FROM mt_maintenance_images 
WHERE maintenance_id IN (
  SELECT id FROM mt_maintenance_records 
  WHERE vehicle_id IN (
    SELECT id FROM mt_vehicles 
    WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'
  )
);

DELETE FROM mt_maintenance_records 
WHERE vehicle_id IN (
  SELECT id FROM mt_vehicles 
  WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'
);

DELETE FROM mt_vehicles 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440000';

DELETE FROM mt_maintenance_types 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440000';

DELETE FROM mt_users 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440000';

DELETE FROM mt_companies 
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Verify cleanup
SELECT 'Cleanup completed!' as message,
       (SELECT count(*) FROM mt_companies WHERE id = '550e8400-e29b-41d4-a716-446655440000') as remaining_companies,
       (SELECT count(*) FROM mt_users WHERE company_id = '550e8400-e29b-41d4-a716-446655440000') as remaining_users,
       (SELECT count(*) FROM mt_vehicles WHERE company_id = '550e8400-e29b-41d4-a716-446655440000') as remaining_vehicles;