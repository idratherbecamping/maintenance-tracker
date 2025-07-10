-- Rename 'owner' role to 'admin' in user_role enum

-- First, drop ALL policies that reference the role column from any table
-- Company policies
DROP POLICY IF EXISTS "Owners can update their company" ON mt_companies;
DROP POLICY IF EXISTS "Owners can delete their company" ON mt_companies;
DROP POLICY IF EXISTS "Admins can update their company" ON mt_companies;
DROP POLICY IF EXISTS "Admins can delete their company" ON mt_companies;
DROP POLICY IF EXISTS "Users can update their company" ON mt_companies;

-- User policies
DROP POLICY IF EXISTS "Owners can manage users in their company" ON mt_users;
DROP POLICY IF EXISTS "Owners can manage company users" ON mt_users;
DROP POLICY IF EXISTS "Admins can manage users in their company" ON mt_users;
DROP POLICY IF EXISTS "Users can view users in their company" ON mt_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON mt_users;
DROP POLICY IF EXISTS "Users can read their own profile" ON mt_users;
DROP POLICY IF EXISTS "Users can view company members" ON mt_users;

-- Vehicle policies
DROP POLICY IF EXISTS "Owners can delete vehicles from their company" ON mt_vehicles;
DROP POLICY IF EXISTS "Admins can delete vehicles from their company" ON mt_vehicles;

-- Reminder policies
DROP POLICY IF EXISTS "Owners can manage company reminder rules" ON mt_reminder_rules;
DROP POLICY IF EXISTS "Admins can manage company reminder rules" ON mt_reminder_rules;

-- Remove the default constraint temporarily
ALTER TABLE mt_users ALTER COLUMN role DROP DEFAULT;

-- Create new enum type with both old and new values
CREATE TYPE user_role_new AS ENUM ('owner', 'admin', 'employee');

-- Update the column to use the new enum (this allows both owner and admin)
ALTER TABLE mt_users 
  ALTER COLUMN role TYPE user_role_new 
  USING role::text::user_role_new;

-- Drop the old enum
DROP TYPE user_role;

-- Rename the new enum to the original name
ALTER TYPE user_role_new RENAME TO user_role;

-- Now update all existing 'owner' records to 'admin'
UPDATE mt_users SET role = 'admin' WHERE role = 'owner';

-- Create final enum type with only admin and employee
CREATE TYPE user_role_final AS ENUM ('admin', 'employee');

-- Update the column to use the final enum
ALTER TABLE mt_users 
  ALTER COLUMN role TYPE user_role_final 
  USING role::text::user_role_final;

-- Drop the temporary enum
DROP TYPE user_role;

-- Rename the final enum to the original name
ALTER TYPE user_role_final RENAME TO user_role;

-- Restore the default constraint with the new value
ALTER TABLE mt_users ALTER COLUMN role SET DEFAULT 'employee';

-- Recreate all RLS policies with 'admin' instead of 'owner'
CREATE POLICY "Admins can update their company" ON mt_companies
    FOR UPDATE
    USING (
        id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete their company" ON mt_companies
    FOR DELETE
    USING (
        id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create simple, non-recursive policies for mt_users
CREATE POLICY "Users can read own profile" ON mt_users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON mt_users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON mt_users
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can delete vehicles from their company" ON mt_vehicles
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage company reminder rules" ON mt_reminder_rules
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM mt_users WHERE id = auth.uid() AND role = 'admin'
        )
    );