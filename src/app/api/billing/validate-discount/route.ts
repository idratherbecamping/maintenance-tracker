import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BillingService } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { discountCode } = body;

    console.log('Validating discount code:', discountCode);
    console.log('Using Stripe key:', process.env.STRIPE_SECRET_KEY?.substring(0, 20) + '...');

    if (!discountCode || typeof discountCode !== 'string') {
      return NextResponse.json({ error: 'Discount code is required' }, { status: 400 });
    }

    try {
      // Retrieve coupon from Stripe
      console.log('Attempting to retrieve coupon from Stripe...');
      const coupon = await BillingService.stripe.coupons.retrieve(discountCode);
      console.log('Successfully retrieved coupon:', { id: coupon.id, valid: coupon.valid });

      // Check if coupon is valid
      if (!coupon.valid) {
        return NextResponse.json({ 
          valid: false, 
          error: 'This discount code is no longer valid' 
        });
      }

      // Check if coupon has expired
      if (coupon.redeem_by && coupon.redeem_by * 1000 < Date.now()) {
        return NextResponse.json({ 
          valid: false, 
          error: 'This discount code has expired' 
        });
      }

      // Check if coupon has been used up (max redemptions)
      if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
        return NextResponse.json({ 
          valid: false, 
          error: 'This discount code has reached its usage limit' 
        });
      }

      // Return coupon details
      return NextResponse.json({
        valid: true,
        coupon: {
          id: coupon.id,
          name: coupon.name,
          percent_off: coupon.percent_off,
          amount_off: coupon.amount_off,
          currency: coupon.currency,
          duration: coupon.duration,
          duration_in_months: coupon.duration_in_months,
          redeem_by: coupon.redeem_by,
          max_redemptions: coupon.max_redemptions,
          times_redeemed: coupon.times_redeemed,
        },
      });

    } catch (stripeError: any) {
      console.error('Stripe error details:', {
        code: stripeError.code,
        type: stripeError.type,
        message: stripeError.message,
        statusCode: stripeError.statusCode,
        requestId: stripeError.requestId
      });

      // Handle specific Stripe errors
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json({ 
          valid: false, 
          error: 'Invalid discount code' 
        });
      }

      throw stripeError;
    }

  } catch (error) {
    console.error('Error validating discount code:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}