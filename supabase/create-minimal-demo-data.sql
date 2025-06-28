-- Minimal Demo Data - Just the essentials to get the demo working
-- Run this after confirming your user profile exists

-- 1. Ensure demo company exists
INSERT INTO mt_companies (id, name, created_at, settings) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Demo Fleet Management',
  NOW(),
  '{"demo": true}'::jsonb
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name;

-- 2. Ensure demo user profile exists
INSERT INTO mt_users (id, email, name, role, company_id, created_at) 
VALUES (
  'a696b48c-f756-41f0-b10f-fb7428328b51',
  'demo@example.com',
  'Demo Owner',
  'owner',
  '550e8400-e29b-41d4-a716-446655440000',
  NOW()
) ON CONFLICT (id) DO UPDATE SET 
  company_id = '550e8400-e29b-41d4-a716-446655440000',
  role = 'owner';

-- 3. Create just 2 demo vehicles (ensuring is_active = true)
INSERT INTO mt_vehicles (id, company_id, make, model, year, current_mileage, is_active, created_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440000',
  'Ford',
  'F-150',
  2022,
  45000,
  true,  -- Explicitly set to true
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440011',
  '550e8400-e29b-41d4-a716-446655440000',
  'Toyota',
  'Camry',
  2021,
  32000,
  true,  -- Explicitly set to true
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  company_id = '550e8400-e29b-41d4-a716-446655440000';

-- 4. Create just 2 maintenance records
INSERT INTO mt_maintenance_records (id, vehicle_id, user_id, mileage, type_id, description, cost, date, created_at) 
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440020',
  '550e8400-e29b-41d4-a716-446655440010',
  'a696b48c-f756-41f0-b10f-fb7428328b51',
  45000,
  (SELECT id FROM mt_maintenance_types WHERE name = 'Oil Change' LIMIT 1),
  'Changed oil and oil filter.',
  75.50,
  CURRENT_DATE - INTERVAL '5 days',
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440021',
  '550e8400-e29b-41d4-a716-446655440011',
  'a696b48c-f756-41f0-b10f-fb7428328b51',
  32000,
  (SELECT id FROM mt_maintenance_types WHERE name = 'Oil Change' LIMIT 1),
  'Oil change with synthetic oil.',
  68.25,
  CURRENT_DATE - INTERVAL '10 days',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  cost = EXCLUDED.cost,
  description = EXCLUDED.description;

-- 5. Verify everything was created correctly
SELECT 'Verification Results' as status,
       (SELECT count(*) FROM mt_vehicles WHERE company_id = '550e8400-e29b-41d4-a716-446655440000' AND is_active = true) as active_vehicles,
       (SELECT count(*) FROM mt_maintenance_records WHERE vehicle_id IN (
           SELECT id FROM mt_vehicles WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'
       )) as maintenance_records,
       (SELECT company_id FROM mt_users WHERE id = 'a696b48c-f756-41f0-b10f-fb7428328b51') as user_company_id;