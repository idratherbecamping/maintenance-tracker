-- Create billing history table
CREATE TABLE IF NOT EXISTS mt_billing_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES mt_companies(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'failed', 'void')),
  invoice_url TEXT,
  vehicle_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_mt_billing_history_company_id ON mt_billing_history(company_id);
CREATE INDEX idx_mt_billing_history_created_at ON mt_billing_history(created_at DESC);
CREATE INDEX idx_mt_billing_history_stripe_invoice_id ON mt_billing_history(stripe_invoice_id);

-- Add RLS policies
ALTER TABLE mt_billing_history ENABLE ROW LEVEL SECURITY;

-- Admin users can view their company's billing history
CREATE POLICY "Admin users can view billing history"
  ON mt_billing_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mt_users
      WHERE mt_users.id = auth.uid()
      AND mt_users.company_id = mt_billing_history.company_id
      AND mt_users.role = 'admin'
    )
  );

-- System can insert billing history (for webhook handling)
CREATE POLICY "System can manage billing history"
  ON mt_billing_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_mt_billing_history_updated_at
  BEFORE UPDATE ON mt_billing_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE mt_billing_history IS 'Billing history and invoice records';
COMMENT ON COLUMN mt_billing_history.stripe_invoice_id IS 'Stripe invoice ID for reference';
COMMENT ON COLUMN mt_billing_history.amount IS 'Invoice amount in smallest currency unit (cents for USD)';
COMMENT ON COLUMN mt_billing_history.invoice_url IS 'Stripe hosted invoice URL';
COMMENT ON COLUMN mt_billing_history.vehicle_count IS 'Number of vehicles at time of billing';