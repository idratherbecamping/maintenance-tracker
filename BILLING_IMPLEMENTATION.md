# Stripe Billing Implementation Summary

## Overview
This document outlines the complete Stripe billing integration implemented for the maintenance tracker application. The system supports usage-based pricing with a 7-day free trial.

## Pricing Model
- **Base Plan**: $50/month (includes up to 5 vehicles)
- **Additional Vehicles**: $5/month per vehicle beyond the initial 5
- **Minimum**: 5 vehicles ($50/month)
- **No Proration**: Vehicle count updates apply to the next billing cycle

## Implementation Details

### 1. Database Schema
**New Fields in `mt_companies`:**
- `stripe_customer_id` - Stripe customer ID
- `stripe_subscription_id` - Stripe subscription ID  
- `stripe_subscription_item_id` - For usage reporting
- `subscription_status` - Current subscription status
- `trial_ends_at` - Trial end date
- `billing_email` - Billing contact email
- `last_reported_vehicle_count` - Last count sent to Stripe
- `billing_cycle_anchor` - Monthly billing date

**New Table: `mt_billing_history`**
- Stores invoice records with amounts, status, and vehicle counts
- RLS policies for admin-only access

### 2. Onboarding Integration
**New Step 3: Billing Setup**
- Vehicle count selector (minimum 5)
- Payment method collection via Stripe Elements
- Pricing calculator with real-time updates
- 7-day trial setup

### 3. Profile Settings (Admin Only)
**Billing Tab:**
- Current subscription status and details
- Vehicle count comparison (billed vs. actual)
- Manual sync button for vehicle count updates
- Payment method management via Stripe Customer Portal
- Billing history with downloadable invoices

### 4. API Endpoints
- `POST /api/billing/create-subscription` - Creates subscription during onboarding
- `POST /api/billing/sync-vehicle-count` - Manual sync for individual company
- `POST /api/billing/create-portal-session` - Stripe Customer Portal access
- `POST /api/billing/manual-sync-all` - Trigger sync for all companies
- `POST /api/webhooks/stripe` - Stripe webhook handler

### 5. Webhook Handling
**Supported Events:**
- `invoice.created` - Invoice creation logging
- `invoice.payment_succeeded` - Save to billing history
- `invoice.payment_failed` - Log failure (no access blocking)
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Handle cancellation
- `customer.subscription.trial_will_end` - Trial ending notification

### 6. Vehicle Count Sync
**Edge Function: `sync-vehicle-counts`**
- Runs periodically to update vehicle counts in Stripe
- Only syncs companies within 2 days of billing cycle
- No proration - changes apply to next billing period
- Comprehensive logging and error handling

## Configuration Required

### Environment Variables
```bash
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRODUCT_ID=prod_SjFiKwG4bA372m
```

### Stripe Product Setup
- Use the existing product ID: `prod_SjFiKwG4bA372m`
- Ensure the product has usage-based pricing configured
- Set up webhook endpoints in Stripe Dashboard

## User Experience Flow

### New User Onboarding:
1. Business Information → Admin Profile → **Billing Setup** → Complete
2. User sets initial vehicle count and payment method
3. 7-day trial begins immediately
4. No charges during trial period

### Admin Management:
1. Access Profile → Billing tab
2. View current plan and vehicle counts
3. Sync vehicle count when needed
4. Manage payment methods via Stripe Portal
5. View billing history and download invoices

### Automated Billing:
1. Vehicle counts sync 1-2 days before billing
2. Invoices generated based on current vehicle count
3. Payment attempts with grace period on failure
4. No access blocking on payment failures

## Security Features
- Webhook signature verification
- PCI compliance via Stripe Elements/Portal
- No card data stored locally
- Admin-only access to billing features
- Audit logging for billing operations

## Testing
To test the complete billing flow:
1. Set up test Stripe keys
2. Run the database migrations
3. Complete onboarding with test card
4. Add/remove vehicles and test sync functionality
5. Verify webhook handling with Stripe CLI

## Deployment Notes
1. Apply database migrations: `20250122_add_billing_fields.sql` and `20250122_create_billing_history.sql`
2. Deploy the Edge Function: `sync-vehicle-counts`
3. Configure Stripe webhook endpoint: `/api/webhooks/stripe`
4. Set up periodic calling of the sync function (recommended: daily)
5. Update environment variables with production Stripe keys

## Support & Maintenance
- Monitor webhook delivery in Stripe Dashboard
- Review billing history for discrepancies
- Set up alerts for failed payments or sync errors
- Regularly verify vehicle count accuracy