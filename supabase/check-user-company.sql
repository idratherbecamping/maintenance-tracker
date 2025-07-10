-- Check user and company relationship
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    u.company_id as user_company_id,
    c.id as company_id,
    c.name as company_name
FROM mt_users u
LEFT JOIN mt_companies c ON u.company_id = c.id
WHERE u.email = 'gannon@avalon-iq.com';

-- Check if there are any vehicles for the Test company
SELECT COUNT(*) as vehicle_count 
FROM mt_vehicles 
WHERE company_id = 'd9979d15-3712-4f48-8bdf-15174966a6cc';

-- Check if there are any maintenance records
SELECT COUNT(*) as maintenance_count 
FROM mt_maintenance_records 
WHERE company_id = 'd9979d15-3712-4f48-8bdf-15174966a6cc';

-- If no data exists, let's create some sample data
-- INSERT INTO mt_vehicles (company_id, license_plate, make, model, year, vin, mileage, is_active)
-- VALUES 
--     ('d9979d15-3712-4f48-8bdf-15174966a6cc', 'ABC123', 'Toyota', 'Camry', 2020, 'VIN123456', 50000, true),
--     ('d9979d15-3712-4f48-8bdf-15174966a6cc', 'XYZ789', 'Honda', 'Civic', 2021, 'VIN789012', 30000, true);