-- Add discount fields to mt_companies table
ALTER TABLE mt_companies
ADD COLUMN IF NOT EXISTS discount_code TEXT,
ADD COLUMN IF NOT EXISTS discount_amount_off INTEGER, -- Amount off in cents
ADD COLUMN IF NOT EXISTS discount_percent_off DECIMAL(5,2), -- Percentage off (0.00-100.00)
ADD COLUMN IF NOT EXISTS discount_expires_at TIMESTAMP WITH TIME ZONE;

-- Add comments for clarity
COMMENT ON COLUMN mt_companies.discount_code IS 'Applied discount/coupon code';
COMMENT ON COLUMN mt_companies.discount_amount_off IS 'Discount amount in cents (for amount_off coupons)';
COMMENT ON COLUMN mt_companies.discount_percent_off IS 'Discount percentage (for percent_off coupons)';
COMMENT ON COLUMN mt_companies.discount_expires_at IS 'When the discount expires';