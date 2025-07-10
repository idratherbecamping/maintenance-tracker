-- Fix RLS policies for mt_vehicles table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view vehicles from their company" ON mt_vehicles;
DROP POLICY IF EXISTS "Users can insert vehicles for their company" ON mt_vehicles;
DROP POLICY IF EXISTS "Users can update vehicles from their company" ON mt_vehicles;
DROP POLICY IF EXISTS "Users can delete vehicles from their company" ON mt_vehicles;

-- Enable RLS
ALTER TABLE mt_vehicles ENABLE ROW LEVEL SECURITY;

-- Create new policies
-- Users can view vehicles from their company
CREATE POLICY "Users can view vehicles from their company" ON mt_vehicles
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid()
        )
    );

-- Users can insert vehicles for their company
CREATE POLICY "Users can insert vehicles for their company" ON mt_vehicles
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid()
        )
    );

-- Users can update vehicles from their company
CREATE POLICY "Users can update vehicles from their company" ON mt_vehicles
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid()
        )
    );

-- Owners can delete vehicles from their company
CREATE POLICY "Owners can delete vehicles from their company" ON mt_vehicles
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid() AND role = 'owner'
        )
    );