-- Demo Data for Maintenance Tracker
-- Run this after the main schema.sql

-- Create demo company
INSERT INTO mt_companies (id, name, created_at, settings) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Demo Fleet Management',
  NOW(),
  '{"demo": true}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Create demo users (you'll need to create these in Supabase Auth first)
-- Owner user
INSERT INTO mt_users (id, email, name, role, company_id, created_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'demo@example.com',
  'Demo Owner',
  'owner',
  '550e8400-e29b-41d4-a716-446655440000',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Employee user
INSERT INTO mt_users (id, email, name, role, company_id, created_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'employee@example.com',
  'John Mechanic',
  'employee',
  '550e8400-e29b-41d4-a716-446655440000',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Another employee
INSERT INTO mt_users (id, email, name, role, company_id, created_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  'sarah@example.com',
  'Sarah Driver',
  'employee',
  '550e8400-e29b-41d4-a716-446655440000',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create demo vehicles
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
);

-- Create demo maintenance records
INSERT INTO mt_maintenance_records (id, vehicle_id, user_id, mileage, type_id, description, cost, date, created_at) 
VALUES 
-- Ford F-150 maintenance
(
  '550e8400-e29b-41d4-a716-446655440020',
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440002',
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
  '550e8400-e29b-41d4-a716-446655440002',
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
  '550e8400-e29b-41d4-a716-446655440002',
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
  '550e8400-e29b-41d4-a716-446655440003',
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
  '550e8400-e29b-41d4-a716-446655440002',
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
  '550e8400-e29b-41d4-a716-446655440002',
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
  '550e8400-e29b-41d4-a716-446655440003',
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
  '550e8400-e29b-41d4-a716-446655440002',
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
  '550e8400-e29b-41d4-a716-446655440002',
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
  '550e8400-e29b-41d4-a716-446655440002',
  44000,
  NULL,
  'Replaced windshield wipers and washer fluid. Cleaned windshield.',
  28.99,
  CURRENT_DATE - INTERVAL '12 days',
  NOW()
);

-- Set custom_type for the last record
UPDATE mt_maintenance_records 
SET custom_type = 'Windshield Service' 
WHERE id = '550e8400-e29b-41d4-a716-446655440029';

-- Create demo maintenance recommendations
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
);

-- Create demo company-specific maintenance type
INSERT INTO mt_maintenance_types (name, is_custom, company_id) 
VALUES (
  'Fleet GPS Update',
  true,
  '550e8400-e29b-41d4-a716-446655440000'
);

-- Summary stats for demo
-- Total vehicles: 5
-- Total maintenance records: 10
-- Total cost: $1,091.98
-- Date range: Last 90 days