-- Demo Data Step 1: Create Company and Vehicles
-- Run this FIRST, before creating users

-- Create demo company
INSERT INTO mt_companies (id, name, created_at, settings) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Demo Fleet Management',
  NOW(),
  '{"demo": true}'::jsonb
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

-- Create demo company-specific maintenance type
INSERT INTO mt_maintenance_types (name, is_custom, company_id) 
VALUES (
  'Fleet GPS Update',
  true,
  '550e8400-e29b-41d4-a716-446655440000'
);