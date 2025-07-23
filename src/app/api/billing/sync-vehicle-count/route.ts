import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BillingService, STRIPE_CONFIG, stripe } from '@/lib/stripe/server';

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

    if (!company?.stripe_subscription_id) {
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
    
    // Calculate the additional vehicles beyond the base 5
    const baseVehicles = 5;
    const additionalVehicles = Math.max(0, actualVehicleCount - baseVehicles);
    const totalMonthlyAmount = 50 + (additionalVehicles * 5);
    
    console.log(`Vehicle count: ${actualVehicleCount}, Additional vehicles: ${additionalVehicles}, Total amount: $${totalMonthlyAmount}`);
    console.log('STRIPE_CONFIG.BASE_PRICE_ID:', STRIPE_CONFIG.BASE_PRICE_ID);
    console.log('STRIPE_CONFIG.VEHICLE_PRICE_ID:', STRIPE_CONFIG.VEHICLE_PRICE_ID);
    
    // Get the current subscription to update vehicle pricing
    const subscription = await stripe.subscriptions.retrieve(company.stripe_subscription_id, {
      expand: ['items.data.price']
    });
    
    console.log('Current subscription items:', subscription.items.data.map(item => ({
      id: item.id,
      price_id: item.price.id,
      quantity: item.quantity
    })));
    
    // Find the tiered subscription item
    const tieredItem = subscription.items.data.find(item => 
      item.price.id === STRIPE_CONFIG.TIERED_PRICE_ID
    );
    
    // Also check for legacy items (for existing subscriptions)
    const baseItem = subscription.items.data.find(item => 
      item.price.id === STRIPE_CONFIG.BASE_PRICE_ID
    );
    const vehicleItem = subscription.items.data.find(item => 
      item.price.id === STRIPE_CONFIG.VEHICLE_PRICE_ID
    );
    
    console.log('Tiered item found:', !!tieredItem, tieredItem?.id);
    console.log('Legacy base item found:', !!baseItem, baseItem?.id);
    console.log('Legacy vehicle item found:', !!vehicleItem, vehicleItem?.id);
    console.log('Total vehicles:', actualVehicleCount);
    
    // Handle tiered pricing (single item with total vehicle count)
    if (tieredItem) {
      console.log('Updating tiered subscription item quantity to:', actualVehicleCount);
      await stripe.subscriptionItems.update(tieredItem.id, {
        quantity: actualVehicleCount,
        proration_behavior: 'none',
      });
    } else {
      // Handle legacy two-item pricing structure
      console.log('Using legacy pricing structure');
      if (additionalVehicles > 0) {
        if (vehicleItem) {
          console.log('Updating existing vehicle item quantity to:', additionalVehicles);
          await stripe.subscriptionItems.update(vehicleItem.id, {
            quantity: additionalVehicles,
            proration_behavior: 'none',
          });
        } else {
          console.log('Creating new vehicle subscription item with quantity:', additionalVehicles);
          await stripe.subscriptionItems.create({
            subscription: company.stripe_subscription_id,
            price: STRIPE_CONFIG.VEHICLE_PRICE_ID,
            quantity: additionalVehicles,
            proration_behavior: 'none',
          });
        }
      } else if (vehicleItem) {
        console.log('Removing vehicle item since no additional vehicles needed');
        await stripe.subscriptionItems.del(vehicleItem.id, {
          proration_behavior: 'none',
        });
      }
    }

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