-- Database Optimization for Maintenance Tracker
-- Run this via the Supabase SQL Editor to improve query performance

-- Add indexes for common query patterns

-- Vehicles table indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_company_active 
ON mt_vehicles (company_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_vehicles_created_at 
ON mt_vehicles (created_at DESC);

-- Maintenance records indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_records_vehicle_date 
ON mt_maintenance_records (vehicle_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_maintenance_records_date_cost 
ON mt_maintenance_records (date DESC, cost);

CREATE INDEX IF NOT EXISTS idx_maintenance_records_user_date 
ON mt_maintenance_records (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_maintenance_records_created_at 
ON mt_maintenance_records (created_at DESC);

-- Composite index for dashboard queries (company + date filtering)
CREATE INDEX IF NOT EXISTS idx_maintenance_records_company_date 
ON mt_maintenance_records (date DESC)
INCLUDE (cost, type_id, custom_type, vehicle_id, user_id);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_company 
ON mt_users (company_id);

CREATE INDEX IF NOT EXISTS idx_users_email 
ON mt_users (email);

-- Maintenance types indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_types_company 
ON mt_maintenance_types (company_id);

-- Maintenance recommendations indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_maintenance_completed 
ON mt_maintenance_recommendations (maintenance_id, is_completed);

CREATE INDEX IF NOT EXISTS idx_recommendations_date_completed 
ON mt_maintenance_recommendations (recommended_date, is_completed)
WHERE is_completed = false;

-- Maintenance images indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_images_maintenance 
ON mt_maintenance_images (maintenance_id);

-- Reminder tables indexes (if they exist)
CREATE INDEX IF NOT EXISTS idx_reminder_rules_company 
ON mt_reminder_rules (company_id)
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mt_reminder_rules');

CREATE INDEX IF NOT EXISTS idx_active_reminders_vehicle_status 
ON mt_active_reminders (vehicle_id, status)
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mt_active_reminders');

-- Analyze tables to update statistics
ANALYZE mt_vehicles;
ANALYZE mt_maintenance_records;
ANALYZE mt_users;
ANALYZE mt_maintenance_types;
ANALYZE mt_maintenance_recommendations;
ANALYZE mt_maintenance_images;

SELECT 'Database optimization indexes created successfully!' as message;