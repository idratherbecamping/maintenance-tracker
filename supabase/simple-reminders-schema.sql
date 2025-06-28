-- Simple Automated Reminders Schema - Apply via Supabase SQL Editor
-- Copy and paste these commands one by one into the Supabase SQL editor

-- Create reminder rules table
CREATE TABLE IF NOT EXISTS mt_reminder_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES mt_companies(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES mt_vehicles(id) ON DELETE CASCADE,
    maintenance_type_id UUID REFERENCES mt_maintenance_types(id) ON DELETE CASCADE,
    custom_type VARCHAR(100),
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('mileage_interval', 'time_interval', 'mileage_since_last', 'time_since_last')),
    mileage_interval INTEGER,
    mileage_threshold INTEGER,
    time_interval_days INTEGER,
    time_threshold_days INTEGER,
    lead_time_days INTEGER DEFAULT 7,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create active reminders table
CREATE TABLE IF NOT EXISTS mt_active_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reminder_rule_id UUID NOT NULL REFERENCES mt_reminder_rules(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES mt_vehicles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES mt_users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    due_date DATE,
    current_mileage INTEGER,
    target_mileage INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dismissed', 'snoozed')),
    completed_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    snoozed_until DATE,
    completed_maintenance_id UUID REFERENCES mt_maintenance_records(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE mt_reminder_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt_active_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reminder rules
CREATE POLICY "Users can view company reminder rules" ON mt_reminder_rules
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM mt_users WHERE id = auth.uid())
    );

CREATE POLICY "Owners can manage company reminder rules" ON mt_reminder_rules
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM mt_users 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- RLS Policies for active reminders  
CREATE POLICY "Users can view company reminders" ON mt_active_reminders
    FOR SELECT USING (
        vehicle_id IN (
            SELECT id FROM mt_vehicles WHERE company_id IN (
                SELECT company_id FROM mt_users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their reminders" ON mt_active_reminders
    FOR UPDATE USING (
        vehicle_id IN (
            SELECT id FROM mt_vehicles WHERE company_id IN (
                SELECT company_id FROM mt_users WHERE id = auth.uid()
            )
        )
    );

-- Add updated_at triggers
CREATE TRIGGER update_mt_reminder_rules_updated_at BEFORE UPDATE ON mt_reminder_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mt_active_reminders_updated_at BEFORE UPDATE ON mt_active_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create some demo data
INSERT INTO mt_reminder_rules (company_id, maintenance_type_id, rule_name, description, trigger_type, mileage_interval, lead_time_days, priority)
SELECT 
    '550e8400-e29b-41d4-a716-446655440000',
    mt.id,
    'Oil Change Reminder',
    'Regular oil change every 5,000 miles',
    'mileage_interval',
    5000,
    500,
    'high'
FROM mt_maintenance_types mt WHERE mt.name = 'Oil Change' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO mt_reminder_rules (company_id, maintenance_type_id, rule_name, description, trigger_type, mileage_interval, lead_time_days, priority)
SELECT 
    '550e8400-e29b-41d4-a716-446655440000',
    mt.id,
    'Tire Rotation Reminder',
    'Rotate tires every 8,000 miles',
    'mileage_interval',
    8000,
    800,
    'medium'
FROM mt_maintenance_types mt WHERE mt.name = 'Tire Rotation' LIMIT 1
ON CONFLICT DO NOTHING;