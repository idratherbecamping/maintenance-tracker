-- Demo Data for Maintenance Tracker - Clean Version
-- This safely handles existing data and won't cause duplicate key errors
-- Uses actual demo user UUID: a696b48c-f756-41f0-b10f-fb7428328b51

-- Clean up existing demo data first (optional - comment out if you want to keep existing data)
-- DELETE FROM mt_maintenance_recommendations WHERE maintenance_id IN (SELECT id FROM mt_maintenance_records WHERE vehicle_id IN (SELECT id FROM mt_vehicles WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'));
-- DELETE FROM mt_maintenance_images WHERE maintenance_id IN (SELECT id FROM mt_maintenance_records WHERE vehicle_id IN (SELECT id FROM mt_vehicles WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'));
-- DELETE FROM mt_maintenance_records WHERE vehicle_id IN (SELECT id FROM mt_vehicles WHERE company_id = '550e8400-e29b-41d4-a716-446655440000');
-- DELETE FROM mt_vehicles WHERE company_id = '550e8400-e29b-41d4-a716-446655440000';
-- DELETE FROM mt_users WHERE company_id = '550e8400-e29b-41d4-a716-446655440000';
-- DELETE FROM mt_companies WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Create demo company (safe insert)
INSERT INTO mt_companies (id, name, created_at, settings) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Demo Fleet Management',
  NOW(),
  '{"demo": true}'::jsonb
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  settings = EXCLUDED.settings;

-- Create demo user profile (safe insert)
INSERT INTO mt_users (id, email, name, role, company_id, created_at) 
VALUES (
  'a696b48c-f756-41f0-b10f-fb7428328b51',
  'demo@example.com',
  'Demo Owner',
  'owner',
  '550e8400-e29b-41d4-a716-446655440000',
  NOW()
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id;

-- Create demo vehicles (safe inserts)
INSERT INTO mt_vehicles (id, company_id, make, model, year, vin, license_plate, current_mileage, asset_value, purchase_date, purchase_price, created_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440000',
  'Ford',
  'F-150',
  2022,
  '1FTFW1ET5NFC12345',
  'FLEET-001',
  45000,
  35000.00,
  '2022-01-15',
  42000.00,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440011',
  '550e8400-e29b-41d4-a716-446655440000',
  'Toyota',
  'Camry',
  2021,
  'JTNB11HK8L3123456',
  'FLEET-002',
  32000,
  22000.00,
  '2021-03-10',
  28000.00,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440012',
  '550e8400-e29b-41d4-a716-446655440000',
  'Chevrolet',
  'Silverado',
  2023,
  '1GCPYBEK5PZ123456',
  'FLEET-003',
  15000,
  38000.00,
  '2023-06-01',
  45000.00,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440013',
  '550e8400-e29b-41d4-a716-446655440000',
  'Honda',
  'Civic',
  2020,
  '2HGFC2F59LH123456',
  'FLEET-004',
  52000,
  18000.00,
  '2020-08-20',
  23000.00,
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440014',
  '550e8400-e29b-41d4-a716-446655440000',
  'Ram',
  '1500',
  2022,
  '1C6SRFFT2NN123456',
  'FLEET-005',
  28000,
  33000.00,
  '2022-11-05',
  40000.00,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  make = EXCLUDED.make,
  model = EXCLUDED.model,
  year = EXCLUDED.year,
  current_mileage = EXCLUDED.current_mileage,
  asset_value = EXCLUDED.asset_value;

-- Create demo maintenance records (safe inserts)
INSERT INTO mt_maintenance_records (id, vehicle_id, user_id, mileage, type_id, description, cost, date, created_at) 
VALUES 
-- Ford F-150 maintenance
(
  '550e8400-e29b-41d4-a716-446655440020',
  '550e8400-e29b-41d4-a716-446655440010',
  'a696b48c-f756-41f0-b10f-fb7428328b51',
  45000,
  (SELECT id FROM mt_maintenance_types WHERE name = 'Oil Change' LIMIT 1),
  'Changed oil and oil filter. Used 5W-30 synthetic oil. Checked all fluid levels.',
  75.50,
  CURRENT_DATE - INTERVAL '5 days',
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440021',
  '550e8400-e29b-41d4-a716-446655440010',
  'a696b48c-f756-41f0-b10f-fb7428328b51',
  42000,
  (SELECT id FROM mt_maintenance_types WHERE name = 'Tire Rotation' LIMIT 1),
  'Rotated all four tires. Checked tire pressure and tread depth. All tires in good condition.',
  45.00,
  CURRENT_DATE - INTERVAL '30 days',
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440022',
  '550e8400-e29b-41d4-a716-446655440010',
  'a696b48c-f756-41f0-b10f-fb7428328b51',
  40000,
  (SELECT id FROM mt_maintenance_types WHERE name = 'Brake Service' LIMIT 1),
  'Replaced front brake pads and resurfaced rotors. Bled brake system and checked brake fluid.',
  320.75,
  CURRENT_DATE - INTERVAL '60 days',
  NOW()
),

-- Toyota Camry maintenance  
(
  '550e8400-e29b-41d4-a716-446655440023',
  '550e8400-e29b-41d4-a716-446655440011',
  'a696b48c-f756-41f0-b10f-fb7428328b51',
  32000,
  (SELECT id FROM mt_maintenance_types WHERE name = 'Oil Change' LIMIT 1),
  'Oil change with synthetic 0W-20. Replaced cabin air filter.',
  68.25,
  CURRENT_DATE - INTERVAL '10 days',
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440024',
  '550e8400-e29b-41d4-a716-446655440011',
  'a696b48c-f756-41f0-b10f-fb7428328b51',
  30000,
  (SELECT id FROM mt_maintenance_types WHERE name = 'Transmission Service' LIMIT 1),
  'Transmission fluid and filter change. 30,000 mile service completed.',
  185.00,
  CURRENT_DATE - INTERVAL '45 days',
  NOW()
),

-- Chevrolet Silverado maintenance
(
  '550e8400-e29b-41d4-a716-446655440025',
  '550e8400-e29b-41d4-a716-446655440012',
  'a696b48c-f756-41f0-b10f-fb7428328b51',
  15000,
  (SELECT id FROM mt_maintenance_types WHERE name = 'Oil Change' LIMIT 1),
  'First oil change for new vehicle. Used Mobil 1 synthetic oil.',
  82.00,
  CURRENT_DATE - INTERVAL '7 days',
  NOW()
),

-- Honda Civic maintenance
(
  '550e8400-e29b-41d4-a716-446655440026',
  '550e8400-e29b-41d4-a716-446655440013',
  'a696b48c-f756-41f0-b10f-fb7428328b51',
  52000,
  (SELECT id FROM mt_maintenance_types WHERE name = 'Air Filter Replacement' LIMIT 1),
  'Replaced engine air filter and cabin air filter. Both were very dirty.',
  35.99,
  CURRENT_DATE - INTERVAL '15 days',
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440027',
  '550e8400-e29b-41d4-a716-446655440013',
  'a696b48c-f756-41f0-b10f-fb7428328b51',
  50000,
  (SELECT id FROM mt_maintenance_types WHERE name = 'Coolant Flush' LIMIT 1),
  'Complete coolant system flush and refill. Pressure tested cooling system.',
  125.50,
  CURRENT_DATE - INTERVAL '90 days',
  NOW()
),

-- Ram 1500 maintenance
(
  '550e8400-e29b-41d4-a716-446655440028',
  '550e8400-e29b-41d4-a716-446655440014',
  'a696b48c-f756-41f0-b10f-fb7428328b51',
  28000,
  (SELECT id FROM mt_maintenance_types WHERE name = 'Inspection' LIMIT 1),
  'Annual state inspection completed. All systems passed.',
  25.00,
  CURRENT_DATE - INTERVAL '20 days',
  NOW()
),

-- Custom maintenance type example
(
  '550e8400-e29b-41d4-a716-446655440029',
  '550e8400-e29b-41d4-a716-446655440010',
  'a696b48c-f756-41f0-b10f-fb7428328b51',
  44000,
  NULL,
  'Replaced windshield wipers and washer fluid. Cleaned windshield.',
  28.99,
  CURRENT_DATE - INTERVAL '12 days',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  mileage = EXCLUDED.mileage,
  description = EXCLUDED.description,
  cost = EXCLUDED.cost;

-- Set custom_type for the windshield service record
UPDATE mt_maintenance_records 
SET custom_type = 'Windshield Service' 
WHERE id = '550e8400-e29b-41d4-a716-446655440029';

-- Create demo maintenance recommendations (safe inserts)
INSERT INTO mt_maintenance_recommendations (maintenance_id, description, recommended_date) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440020',
  'Next oil change due in 3,000 miles',
  CURRENT_DATE + INTERVAL '90 days'
),
(
  '550e8400-e29b-41d4-a716-446655440021',
  'Brake inspection recommended',
  CURRENT_DATE + INTERVAL '180 days'
),
(
  '550e8400-e29b-41d4-a716-446655440022',
  'Replace brake fluid - due in 2 years',
  CURRENT_DATE + INTERVAL '730 days'
),
(
  '550e8400-e29b-41d4-a716-446655440023',
  'Transmission service due at 60,000 miles',
  CURRENT_DATE + INTERVAL '120 days'
),
(
  '550e8400-e29b-41d4-a716-446655440025',
  'Tire rotation needed in 5,000 miles',
  CURRENT_DATE + INTERVAL '60 days'
)
ON CONFLICT (maintenance_id, description) DO NOTHING;

-- Create demo company-specific maintenance type (safe insert)
INSERT INTO mt_maintenance_types (name, is_custom, company_id) 
VALUES (
  'Fleet GPS Update',
  true,
  '550e8400-e29b-41d4-a716-446655440000'
)
ON CONFLICT (name, company_id) DO NOTHING;

-- Success message
SELECT 'Demo data created successfully!' as message,
       (SELECT count(*) FROM mt_vehicles WHERE company_id = '550e8400-e29b-41d4-a716-446655440000') as vehicles_count,
       (SELECT count(*) FROM mt_maintenance_records WHERE vehicle_id IN (SELECT id FROM mt_vehicles WHERE company_id = '550e8400-e29b-41d4-a716-446655440000')) as maintenance_records_count,
       (SELECT COALESCE(sum(cost), 0) FROM mt_maintenance_records WHERE vehicle_id IN (SELECT id FROM mt_vehicles WHERE company_id = '550e8400-e29b-41d4-a716-446655440000')) as total_maintenance_cost;