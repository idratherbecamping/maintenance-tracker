-- Automated Reminders Feature - Database Schema
-- Adds intelligent reminder rules that trigger based on mileage, time, or maintenance history

-- Create automated reminder rules table
CREATE TABLE mt_reminder_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES mt_companies(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES mt_vehicles(id) ON DELETE CASCADE, -- NULL means applies to all vehicles
    maintenance_type_id UUID REFERENCES mt_maintenance_types(id) ON DELETE CASCADE,
    custom_type VARCHAR(100), -- For custom maintenance types
    
    -- Rule configuration
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Trigger conditions
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('mileage_interval', 'time_interval', 'mileage_since_last', 'time_since_last')),
    
    -- Mileage-based triggers
    mileage_interval INTEGER, -- Every X miles (e.g., oil change every 5000 miles)
    mileage_threshold INTEGER, -- When vehicle reaches X miles since last service
    
    -- Time-based triggers  
    time_interval_days INTEGER, -- Every X days
    time_threshold_days INTEGER, -- X days since last service
    
    -- Advanced settings
    lead_time_days INTEGER DEFAULT 7, -- How many days before due date to send reminder
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure we have the right trigger data for each type
    CONSTRAINT check_mileage_interval CHECK (
        (trigger_type = 'mileage_interval' AND mileage_interval IS NOT NULL) OR
        trigger_type != 'mileage_interval'
    ),
    CONSTRAINT check_time_interval CHECK (
        (trigger_type = 'time_interval' AND time_interval_days IS NOT NULL) OR
        trigger_type != 'time_interval'  
    ),
    CONSTRAINT check_mileage_since_last CHECK (
        (trigger_type = 'mileage_since_last' AND mileage_threshold IS NOT NULL) OR
        trigger_type != 'mileage_since_last'
    ),
    CONSTRAINT check_time_since_last CHECK (
        (trigger_type = 'time_since_last' AND time_threshold_days IS NOT NULL) OR
        trigger_type != 'time_since_last'
    )
);

-- Create active reminders table (generated reminders that users see)
CREATE TABLE mt_active_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reminder_rule_id UUID NOT NULL REFERENCES mt_reminder_rules(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES mt_vehicles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES mt_users(id), -- Who should see this reminder (NULL = all company users)
    
    -- Reminder details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Due date calculation
    due_date DATE,
    current_mileage INTEGER,
    target_mileage INTEGER, -- For mileage-based reminders
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dismissed', 'snoozed')),
    completed_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    snoozed_until DATE,
    
    -- Reference to maintenance record that completed this reminder
    completed_maintenance_id UUID REFERENCES mt_maintenance_records(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_mt_reminder_rules_company_id ON mt_reminder_rules(company_id);
CREATE INDEX idx_mt_reminder_rules_vehicle_id ON mt_reminder_rules(vehicle_id);
CREATE INDEX idx_mt_reminder_rules_active ON mt_reminder_rules(is_active);
CREATE INDEX idx_mt_active_reminders_vehicle_id ON mt_active_reminders(vehicle_id);
CREATE INDEX idx_mt_active_reminders_user_id ON mt_active_reminders(user_id);
CREATE INDEX idx_mt_active_reminders_status ON mt_active_reminders(status);
CREATE INDEX idx_mt_active_reminders_due_date ON mt_active_reminders(due_date);

-- Enable Row Level Security
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

-- Add triggers for updated_at
CREATE TRIGGER update_mt_reminder_rules_updated_at BEFORE UPDATE ON mt_reminder_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mt_active_reminders_updated_at BEFORE UPDATE ON mt_active_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate reminders based on rules
CREATE OR REPLACE FUNCTION generate_automated_reminders()
RETURNS void AS $$
DECLARE
    rule_record RECORD;
    vehicle_record RECORD;
    last_maintenance RECORD;
    due_date DATE;
    target_mileage INTEGER;
    reminder_title TEXT;
    reminder_description TEXT;
BEGIN
    -- Process each active reminder rule
    FOR rule_record IN 
        SELECT * FROM mt_reminder_rules WHERE is_active = true
    LOOP
        -- Get vehicles this rule applies to
        FOR vehicle_record IN
            SELECT * FROM mt_vehicles 
            WHERE company_id = rule_record.company_id 
            AND is_active = true
            AND (rule_record.vehicle_id IS NULL OR id = rule_record.vehicle_id)
        LOOP
            -- Get last maintenance of this type for this vehicle
            SELECT * INTO last_maintenance
            FROM mt_maintenance_records
            WHERE vehicle_id = vehicle_record.id
            AND (
                (rule_record.maintenance_type_id IS NOT NULL AND type_id = rule_record.maintenance_type_id) OR
                (rule_record.custom_type IS NOT NULL AND custom_type = rule_record.custom_type)
            )
            ORDER BY date DESC, created_at DESC
            LIMIT 1;
            
            -- Calculate due date and target based on rule type
            due_date := NULL;
            target_mileage := NULL;
            
            CASE rule_record.trigger_type
                WHEN 'mileage_interval' THEN
                    IF last_maintenance.id IS NOT NULL THEN
                        target_mileage := last_maintenance.mileage + rule_record.mileage_interval;
                        -- Estimate due date based on average daily mileage (assume 50 miles/day)
                        due_date := CURRENT_DATE + ((target_mileage - vehicle_record.current_mileage) / 50)::INTEGER;
                    END IF;
                    
                WHEN 'time_interval' THEN
                    IF last_maintenance.id IS NOT NULL THEN
                        due_date := last_maintenance.date + rule_record.time_interval_days;
                    END IF;
                    
                WHEN 'mileage_since_last' THEN
                    IF last_maintenance.id IS NOT NULL THEN
                        target_mileage := last_maintenance.mileage + rule_record.mileage_threshold;
                        due_date := CURRENT_DATE + ((target_mileage - vehicle_record.current_mileage) / 50)::INTEGER;
                    END IF;
                    
                WHEN 'time_since_last' THEN
                    IF last_maintenance.id IS NOT NULL THEN
                        due_date := last_maintenance.date + rule_record.time_threshold_days;
                    END IF;
            END CASE;
            
            -- Only create reminder if we have a valid due date and it's within lead time
            IF due_date IS NOT NULL AND due_date <= CURRENT_DATE + rule_record.lead_time_days THEN
                -- Build reminder title and description
                reminder_title := rule_record.rule_name || ' - ' || vehicle_record.year || ' ' || vehicle_record.make || ' ' || vehicle_record.model;
                reminder_description := COALESCE(rule_record.description, 'Scheduled maintenance reminder');
                
                -- Check if reminder already exists and is active
                IF NOT EXISTS (
                    SELECT 1 FROM mt_active_reminders 
                    WHERE reminder_rule_id = rule_record.id 
                    AND vehicle_id = vehicle_record.id 
                    AND status IN ('active', 'snoozed')
                    AND due_date = due_date
                ) THEN
                    -- Insert new active reminder
                    INSERT INTO mt_active_reminders (
                        reminder_rule_id,
                        vehicle_id,
                        title,
                        description,
                        priority,
                        due_date,
                        current_mileage,
                        target_mileage
                    ) VALUES (
                        rule_record.id,
                        vehicle_record.id,
                        reminder_title,
                        reminder_description,
                        rule_record.priority,
                        due_date,
                        vehicle_record.current_mileage,
                        target_mileage
                    );
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create some default reminder rules for the demo company
INSERT INTO mt_reminder_rules (company_id, maintenance_type_id, rule_name, description, trigger_type, mileage_interval, lead_time_days, priority)
VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000',
    (SELECT id FROM mt_maintenance_types WHERE name = 'Oil Change' LIMIT 1),
    'Oil Change Reminder',
    'Regular oil change every 5,000 miles',
    'mileage_interval',
    5000,
    500, -- Remind when vehicle is within 500 miles of due
    'high'
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    (SELECT id FROM mt_maintenance_types WHERE name = 'Tire Rotation' LIMIT 1),
    'Tire Rotation Reminder', 
    'Rotate tires every 8,000 miles',
    'mileage_interval',
    8000,
    800,
    'medium'
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    (SELECT id FROM mt_maintenance_types WHERE name = 'Inspection' LIMIT 1),
    'Annual Inspection',
    'State inspection required annually',
    'time_interval',
    NULL,
    365,
    30, -- Remind 30 days before due
    'critical'
);

-- Generate initial reminders
SELECT generate_automated_reminders();

SELECT 'Automated reminders system installed successfully!' as message,
       (SELECT count(*) FROM mt_reminder_rules WHERE company_id = '550e8400-e29b-41d4-a716-446655440000') as rules_created,
       (SELECT count(*) FROM mt_active_reminders WHERE vehicle_id IN (SELECT id FROM mt_vehicles WHERE company_id = '550e8400-e29b-41d4-a716-446655440000')) as active_reminders;