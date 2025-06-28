-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('owner', 'employee');

-- Create mt_companies table
CREATE TABLE mt_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Create mt_users table
CREATE TABLE mt_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    company_id UUID NOT NULL REFERENCES mt_companies(id) ON DELETE CASCADE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create mt_vehicles table
CREATE TABLE mt_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES mt_companies(id) ON DELETE CASCADE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    vin VARCHAR(17),
    license_plate VARCHAR(20),
    current_mileage INTEGER NOT NULL,
    asset_value DECIMAL(10, 2),
    purchase_date DATE,
    purchase_price DECIMAL(10, 2),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create mt_maintenance_types table
CREATE TABLE mt_maintenance_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    is_custom BOOLEAN DEFAULT false,
    company_id UUID REFERENCES mt_companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create mt_maintenance_records table
CREATE TABLE mt_maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES mt_vehicles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES mt_users(id),
    mileage INTEGER NOT NULL,
    type_id UUID REFERENCES mt_maintenance_types(id),
    custom_type VARCHAR(100),
    description TEXT,
    cost DECIMAL(10, 2),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create mt_maintenance_images table
CREATE TABLE mt_maintenance_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_id UUID NOT NULL REFERENCES mt_maintenance_records(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create mt_maintenance_recommendations table
CREATE TABLE mt_maintenance_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_id UUID NOT NULL REFERENCES mt_maintenance_records(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    recommended_date DATE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create mt_reminders table
CREATE TABLE mt_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_id UUID NOT NULL REFERENCES mt_maintenance_recommendations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES mt_users(id),
    reminder_date DATE NOT NULL,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_mt_users_company_id ON mt_users(company_id);
CREATE INDEX idx_mt_vehicles_company_id ON mt_vehicles(company_id);
CREATE INDEX idx_mt_maintenance_records_vehicle_id ON mt_maintenance_records(vehicle_id);
CREATE INDEX idx_mt_maintenance_records_user_id ON mt_maintenance_records(user_id);
CREATE INDEX idx_mt_maintenance_records_date ON mt_maintenance_records(date);
CREATE INDEX idx_mt_maintenance_images_maintenance_id ON mt_maintenance_images(maintenance_id);
CREATE INDEX idx_mt_reminders_reminder_date ON mt_reminders(reminder_date);

-- Enable Row Level Security
ALTER TABLE mt_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_maintenance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_maintenance_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_maintenance_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Company policies
CREATE POLICY "Users can view their own company" ON mt_companies
    FOR SELECT USING (id IN (
        SELECT company_id FROM mt_users WHERE id = auth.uid()
    ));

CREATE POLICY "Owners can update their company" ON mt_companies
    FOR UPDATE USING (id IN (
        SELECT company_id FROM mt_users WHERE id = auth.uid() AND role = 'owner'
    ));

-- User policies
CREATE POLICY "Users can view users in their company" ON mt_users
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM mt_users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update their own profile" ON mt_users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Owners can manage users in their company" ON mt_users
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- Vehicle policies
CREATE POLICY "Users can view vehicles in their company" ON mt_vehicles
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM mt_users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can manage vehicles in their company" ON mt_vehicles
    FOR ALL USING (company_id IN (
        SELECT company_id FROM mt_users WHERE id = auth.uid()
    ));

-- Maintenance type policies
CREATE POLICY "Users can view maintenance types" ON mt_maintenance_types
    FOR SELECT USING (
        company_id IS NULL OR 
        company_id IN (SELECT company_id FROM mt_users WHERE id = auth.uid())
    );

CREATE POLICY "Users can create custom maintenance types" ON mt_maintenance_types
    FOR INSERT WITH CHECK (
        company_id IN (SELECT company_id FROM mt_users WHERE id = auth.uid())
    );

-- Maintenance record policies
CREATE POLICY "Users can view maintenance records for their company vehicles" ON mt_maintenance_records
    FOR SELECT USING (
        vehicle_id IN (
            SELECT id FROM mt_vehicles WHERE company_id IN (
                SELECT company_id FROM mt_users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create maintenance records for their company vehicles" ON mt_maintenance_records
    FOR INSERT WITH CHECK (
        vehicle_id IN (
            SELECT id FROM mt_vehicles WHERE company_id IN (
                SELECT company_id FROM mt_users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own maintenance records" ON mt_maintenance_records
    FOR UPDATE USING (user_id = auth.uid());

-- Maintenance image policies
CREATE POLICY "Users can view maintenance images for their company" ON mt_maintenance_images
    FOR SELECT USING (
        maintenance_id IN (
            SELECT id FROM mt_maintenance_records WHERE vehicle_id IN (
                SELECT id FROM mt_vehicles WHERE company_id IN (
                    SELECT company_id FROM mt_users WHERE id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can upload maintenance images" ON mt_maintenance_images
    FOR INSERT WITH CHECK (
        maintenance_id IN (
            SELECT id FROM mt_maintenance_records WHERE user_id = auth.uid()
        )
    );

-- Recommendation policies
CREATE POLICY "Users can view recommendations for their company" ON mt_maintenance_recommendations
    FOR SELECT USING (
        maintenance_id IN (
            SELECT id FROM mt_maintenance_records WHERE vehicle_id IN (
                SELECT id FROM mt_vehicles WHERE company_id IN (
                    SELECT company_id FROM mt_users WHERE id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can create recommendations" ON mt_maintenance_recommendations
    FOR INSERT WITH CHECK (
        maintenance_id IN (
            SELECT id FROM mt_maintenance_records WHERE user_id = auth.uid()
        )
    );

-- Reminder policies
CREATE POLICY "Users can view their own reminders" ON mt_reminders
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own reminders" ON mt_reminders
    FOR ALL USING (user_id = auth.uid());

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_mt_users_updated_at BEFORE UPDATE ON mt_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mt_vehicles_updated_at BEFORE UPDATE ON mt_vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mt_maintenance_records_updated_at BEFORE UPDATE ON mt_maintenance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default maintenance types
INSERT INTO mt_maintenance_types (name, is_custom) VALUES
    ('Oil Change', false),
    ('Tire Rotation', false),
    ('Brake Service', false),
    ('Air Filter Replacement', false),
    ('Transmission Service', false),
    ('Coolant Flush', false),
    ('Battery Replacement', false),
    ('Spark Plug Replacement', false),
    ('Wheel Alignment', false),
    ('Inspection', false);