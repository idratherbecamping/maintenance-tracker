import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BillingService, STRIPE_CONFIG } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('mt_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { vehicleCount, billingEmail, paymentMethodId, discountCode } = body;

    if (!vehicleCount || !billingEmail || !paymentMethodId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if company already has billing set up
    const { data: company } = await supabase
      .from('mt_companies')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', profile.company_id)
      .single();

    if (company?.stripe_customer_id || company?.stripe_subscription_id) {
      return NextResponse.json({ error: 'Billing already configured' }, { status: 400 });
    }

    // Use the new tiered pricing
    const tieredPriceId = STRIPE_CONFIG.TIERED_PRICE_ID;

    // Validate discount code if provided
    let validCoupon = null;
    if (discountCode) {
      try {
        const coupon = await BillingService.stripe.coupons.retrieve(discountCode);
        if (coupon.valid && 
            (!coupon.redeem_by || coupon.redeem_by * 1000 > Date.now()) &&
            (!coupon.max_redemptions || coupon.times_redeemed < coupon.max_redemptions)) {
          validCoupon = coupon;
        }
      } catch (error) {
        // Continue without discount rather than failing
      }
    }

    // Create Stripe customer
    const customer = await BillingService.createCustomer({
      email: billingEmail,
      name: profile.name,
      metadata: {
        company_id: profile.company_id,
        user_id: user.id,
      },
    });

    // Attach payment method to customer
    await BillingService.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Set as default payment method
    await BillingService.stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription with tiered pricing (single item)
    const subscriptionData = {
      customer: customer.id,
      items: [{
        price: tieredPriceId,
        quantity: vehicleCount, // Total vehicle count for tiered pricing
      }],
      trial_period_days: 7,
      proration_behavior: 'none' as const,
      metadata: {
        company_id: profile.company_id,
        initial_vehicle_count: vehicleCount.toString(),
      },
    };

    // Add discount if valid
    if (validCoupon) {
      (subscriptionData as any).coupon = validCoupon.id;
    }

    const subscription = await BillingService.stripe.subscriptions.create(subscriptionData);

    // Get the tiered subscription item (for vehicle count updates)
    const tieredSubscriptionItem = subscription.items.data.find(item => 
      item.price.id === tieredPriceId
    );

    // Update company with billing information including discount
    const updateData: any = {
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      stripe_subscription_item_id: tieredSubscriptionItem?.id, // Store tiered item for updates
      subscription_status: subscription.status,
      trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      billing_email: billingEmail,
      last_reported_vehicle_count: vehicleCount,
      billing_cycle_anchor: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
    };

    // TODO: Add discount information if applied (requires database migration)
    // if (validCoupon) {
    //   updateData.discount_code = validCoupon.id;
    //   updateData.discount_percent_off = validCoupon.percent_off;
    //   updateData.discount_amount_off = validCoupon.amount_off;
    //   updateData.discount_expires_at = validCoupon.redeem_by ? new Date(validCoupon.redeem_by * 1000).toISOString() : null;
    // }

    const { error: updateError } = await supabase
      .from('mt_companies')
      .update(updateData)
      .eq('id', profile.company_id);

    if (updateError) {
      // Note: In production, you might want to cancel the subscription here
      return NextResponse.json({ error: 'Failed to save billing information' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        trial_end: subscription.trial_end,
        current_period_end: subscription.current_period_end,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}