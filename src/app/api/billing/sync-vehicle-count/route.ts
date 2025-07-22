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

    // Get user profile
    const { data: profile } = await supabase
      .from('mt_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get company billing info
    const { data: company } = await supabase
      .from('mt_companies')
      .select('*')
      .eq('id', profile.company_id)
      .single();

    if (!company?.stripe_subscription_item_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    // Count active vehicles
    const { count: vehicleCount, error: countError } = await supabase
      .from('mt_vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', profile.company_id)
      .eq('is_active', true);

    if (countError) {
      throw countError;
    }

    const actualVehicleCount = vehicleCount || 0;
    const quantity = Math.max(5, actualVehicleCount);

    // Update Stripe subscription quantity
    await BillingService.updateSubscriptionQuantity({
      subscriptionItemId: company.stripe_subscription_item_id,
      quantity,
    });

    // Update database
    const { error: updateError } = await supabase
      .from('mt_companies')
      .update({ last_reported_vehicle_count: actualVehicleCount })
      .eq('id', profile.company_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      vehicleCount: actualVehicleCount,
      billedQuantity: quantity,
    });

  } catch (error) {
    console.error('Error syncing vehicle count:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}