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
    const subscription = await BillingService.stripe.subscriptions.retrieve(company.stripe_subscription_id, {
      expand: ['items.data.price']
    });
    
    console.log('Current subscription items:', subscription.items.data.map(item => ({
      id: item.id,
      price_id: item.price.id,
      quantity: item.quantity
    })));
    
    // Find current subscription items
    const baseItem = subscription.items.data.find(item => item.price.id === STRIPE_CONFIG.BASE_PRICE_ID);
    const vehicleItem = subscription.items.data.find(item => item.price.id === STRIPE_CONFIG.VEHICLE_PRICE_ID);
    
    console.log('Base item found:', !!baseItem, baseItem?.id);
    console.log('Vehicle item found:', !!vehicleItem, vehicleItem?.id);
    console.log('Additional vehicles needed:', additionalVehicles);
    
    // Handle metered billing - report usage instead of setting quantity
    if (additionalVehicles > 0) {
      if (vehicleItem) {
        console.log('Reporting usage for existing vehicle item:', additionalVehicles);
        // For metered billing, report usage record
        await BillingService.stripe.subscriptionItems.createUsageRecord(vehicleItem.id, {
          quantity: additionalVehicles,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'set', // Set the usage to this exact amount
        });
      } else {
        console.log('Creating new vehicle subscription item for metered billing');
        const newVehicleItem = await BillingService.stripe.subscriptionItems.create({
          subscription: company.stripe_subscription_id,
          price: STRIPE_CONFIG.VEHICLE_PRICE_ID,
          proration_behavior: 'none',
        });
        
        // Report initial usage
        await BillingService.stripe.subscriptionItems.createUsageRecord(newVehicleItem.id, {
          quantity: additionalVehicles,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'set',
        });
      }
    } else if (vehicleItem) {
      console.log('Setting vehicle usage to 0 since no additional vehicles needed');
      // Set usage to 0 instead of deleting the item
      await BillingService.stripe.subscriptionItems.createUsageRecord(vehicleItem.id, {
        quantity: 0,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'set',
      });
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