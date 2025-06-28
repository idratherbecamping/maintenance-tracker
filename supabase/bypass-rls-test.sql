-- Temporary RLS Bypass Test
-- ONLY for debugging - DO NOT leave this in production

-- Temporarily disable RLS on vehicles table
ALTER TABLE mt_vehicles DISABLE ROW LEVEL SECURITY;

-- Check if vehicles are visible now (run this, then test the app)
SELECT 'All vehicles (RLS disabled)' as test_type,
       id,
       make,
       model,
       company_id,
       is_active
FROM mt_vehicles;

-- After testing, IMMEDIATELY re-enable RLS for security
-- ALTER TABLE mt_vehicles ENABLE ROW LEVEL SECURITY;

-- Note: Uncomment the line above after testing!