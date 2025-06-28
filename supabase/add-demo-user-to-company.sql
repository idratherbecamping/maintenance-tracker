-- Add Demo User to Company
-- Links your existing demo user to the Demo Fleet Management company
-- User UUID: a696b48c-f756-41f0-b10f-fb7428328b51

-- First, ensure the demo company exists
INSERT INTO mt_companies (id, name, created_at, settings) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Demo Fleet Management',
  NOW(),
  '{"demo": true}'::jsonb
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  settings = EXCLUDED.settings;

-- Create or update the demo user profile
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
  company_id = EXCLUDED.company_id,
  email = EXCLUDED.email;

-- Verify the connection
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email,
  u.role,
  c.id as company_id,
  c.name as company_name,
  c.settings
FROM mt_users u
JOIN mt_companies c ON u.company_id = c.id
WHERE u.id = 'a696b48c-f756-41f0-b10f-fb7428328b51';

-- Show success message
SELECT 'Demo user successfully linked to Demo Fleet Management company!' as message;