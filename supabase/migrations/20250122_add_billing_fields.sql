-- Add billing fields to mt_companies table
ALTER TABLE mt_companies
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_item_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (
  subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired')
),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS billing_email TEXT,
ADD COLUMN IF NOT EXISTS last_reported_vehicle_count INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS billing_cycle_anchor TIMESTAMP WITH TIME ZONE;

-- Add indexes for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_mt_companies_stripe_customer_id ON mt_companies(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_mt_companies_stripe_subscription_id ON mt_companies(stripe_subscription_id);

-- Add comments for clarity
COMMENT ON COLUMN mt_companies.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN mt_companies.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN mt_companies.stripe_subscription_item_id IS 'Stripe subscription item ID for usage reporting';
COMMENT ON COLUMN mt_companies.subscription_status IS 'Current subscription status from Stripe';
COMMENT ON COLUMN mt_companies.trial_ends_at IS 'When the free trial ends';
COMMENT ON COLUMN mt_companies.billing_email IS 'Email address for billing notifications';
COMMENT ON COLUMN mt_companies.last_reported_vehicle_count IS 'Last vehicle count reported to Stripe';
COMMENT ON COLUMN mt_companies.billing_cycle_anchor IS 'Monthly billing date anchor';