-- Demo Data Step 2: Create Users and Maintenance Records
-- Run this AFTER creating users in Supabase Auth dashboard
-- Replace the UUIDs below with the actual user IDs from auth.users

-- IMPORTANT: Replace these UUIDs with actual user IDs from Supabase Auth
-- You can get them by running: SELECT id, email FROM auth.users;

-- Demo Owner User (replace with actual UUID from auth.users)
-- Email: demo@example.com
DO $$
DECLARE
    demo_owner_id UUID;
    demo_employee1_id UUID;
    demo_employee2_id UUID;
BEGIN
    -- Get user IDs from auth.users (replace emails if different)
    SELECT id INTO demo_owner_id FROM auth.users WHERE email = 'demo@example.com';
    SELECT id INTO demo_employee1_id FROM auth.users WHERE email = 'employee@example.com';
    SELECT id INTO demo_employee2_id FROM auth.users WHERE email = 'sarah@example.com';

    -- Insert demo users if auth users exist
    IF demo_owner_id IS NOT NULL THEN
        INSERT INTO mt_users (id, email, name, role, company_id, created_at) 
        VALUES (
            demo_owner_id,
            'demo@example.com',
            'Demo Owner',
            'owner',
            '550e8400-e29b-41d4-a716-446655440000',
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    IF demo_employee1_id IS NOT NULL THEN
        INSERT INTO mt_users (id, email, name, role, company_id, created_at) 
        VALUES (
            demo_employee1_id,
            'employee@example.com',
            'John Mechanic',
            'employee',
            '550e8400-e29b-41d4-a716-446655440000',
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    IF demo_employee2_id IS NOT NULL THEN
        INSERT INTO mt_users (id, email, name, role, company_id, created_at) 
        VALUES (
            demo_employee2_id,
            'sarah@example.com',
            'Sarah Driver',
            'employee',
            '550e8400-e29b-41d4-a716-446655440000',
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Create demo maintenance records using actual user IDs
    IF demo_employee1_id IS NOT NULL THEN
        -- Ford F-150 maintenance by John Mechanic
        INSERT INTO mt_maintenance_records (id, vehicle_id, user_id, mileage, type_id, description, cost, date, created_at) 
        VALUES 
        (
            '550e8400-e29b-41d4-a716-446655440020',
            '550e8400-e29b-41d4-a716-446655440010',
            demo_employee1_id,
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
            demo_employee1_id,
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
            demo_employee1_id,
            40000,
            (SELECT id FROM mt_maintenance_types WHERE name = 'Brake Service' LIMIT 1),
            'Replaced front brake pads and resurfaced rotors. Bled brake system and checked brake fluid.',
            320.75,
            CURRENT_DATE - INTERVAL '60 days',
            NOW()
        ),
        (
            '550e8400-e29b-41d4-a716-446655440024',
            '550e8400-e29b-41d4-a716-446655440011',
            demo_employee1_id,
            30000,
            (SELECT id FROM mt_maintenance_types WHERE name = 'Transmission Service' LIMIT 1),
            'Transmission fluid and filter change. 30,000 mile service completed.',
            185.00,
            CURRENT_DATE - INTERVAL '45 days',
            NOW()
        ),
        (
            '550e8400-e29b-41d4-a716-446655440025',
            '550e8400-e29b-41d4-a716-446655440012',
            demo_employee1_id,
            15000,
            (SELECT id FROM mt_maintenance_types WHERE name = 'Oil Change' LIMIT 1),
            'First oil change for new vehicle. Used Mobil 1 synthetic oil.',
            82.00,
            CURRENT_DATE - INTERVAL '7 days',
            NOW()
        ),
        (
            '550e8400-e29b-41d4-a716-446655440027',
            '550e8400-e29b-41d4-a716-446655440013',
            demo_employee1_id,
            50000,
            (SELECT id FROM mt_maintenance_types WHERE name = 'Coolant Flush' LIMIT 1),
            'Complete coolant system flush and refill. Pressure tested cooling system.',
            125.50,
            CURRENT_DATE - INTERVAL '90 days',
            NOW()
        ),
        (
            '550e8400-e29b-41d4-a716-446655440028',
            '550e8400-e29b-41d4-a716-446655440014',
            demo_employee1_id,
            28000,
            (SELECT id FROM mt_maintenance_types WHERE name = 'Inspection' LIMIT 1),
            'Annual state inspection completed. All systems passed.',
            25.00,
            CURRENT_DATE - INTERVAL '20 days',
            NOW()
        ),
        (
            '550e8400-e29b-41d4-a716-446655440029',
            '550e8400-e29b-41d4-a716-446655440010',
            demo_employee1_id,
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
    END IF;

    IF demo_employee2_id IS NOT NULL THEN
        -- Toyota Camry maintenance by Sarah Driver
        INSERT INTO mt_maintenance_records (id, vehicle_id, user_id, mileage, type_id, description, cost, date, created_at) 
        VALUES 
        (
            '550e8400-e29b-41d4-a716-446655440023',
            '550e8400-e29b-41d4-a716-446655440011',
            demo_employee2_id,
            32000,
            (SELECT id FROM mt_maintenance_types WHERE name = 'Oil Change' LIMIT 1),
            'Oil change with synthetic 0W-20. Replaced cabin air filter.',
            68.25,
            CURRENT_DATE - INTERVAL '10 days',
            NOW()
        ),
        (
            '550e8400-e29b-41d4-a716-446655440026',
            '550e8400-e29b-41d4-a716-446655440013',
            demo_employee2_id,
            52000,
            (SELECT id FROM mt_maintenance_types WHERE name = 'Air Filter Replacement' LIMIT 1),
            'Replaced engine air filter and cabin air filter. Both were very dirty.',
            35.99,
            CURRENT_DATE - INTERVAL '15 days',
            NOW()
        );
    END IF;

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

END $$;