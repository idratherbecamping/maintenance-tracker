import { createClient } from 'jsr:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@^18.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface Company {
  id: string;
  stripe_subscription_item_id: string;
  last_reported_vehicle_count: number;
  billing_cycle_anchor: string | null;
}

Deno.serve(async (req: Request) => {
  try {
    console.log('Starting vehicle count sync...');

    // Get companies with active subscriptions that need syncing
    const { data: companies, error: companiesError } = await supabase
      .from('mt_companies')
      .select('id, stripe_subscription_item_id, last_reported_vehicle_count, billing_cycle_anchor')
      .not('stripe_subscription_item_id', 'is', null)
      .not('billing_cycle_anchor', 'is', null) as { data: Company[] | null, error: any };

    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
      throw companiesError;
    }

    if (!companies || companies.length === 0) {
      console.log('No companies found with active subscriptions');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No companies to sync',
        synced: 0 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${companies.length} companies to potentially sync`);

    let syncedCount = 0;
    const results = [];

    for (const company of companies) {
      try {
        // Check if we should sync this company (e.g., within 2 days of billing cycle)
        const shouldSync = shouldSyncCompany(company.billing_cycle_anchor);
        
        if (!shouldSync) {
          console.log(`Skipping company ${company.id} - not near billing cycle`);
          continue;
        }

        // Count current active vehicles
        const { count: vehicleCount, error: countError } = await supabase
          .from('mt_vehicles')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .eq('is_active', true);

        if (countError) {
          console.error(`Error counting vehicles for company ${company.id}:`, countError);
          results.push({
            companyId: company.id,
            success: false,
            error: 'Failed to count vehicles',
          });
          continue;
        }

        const actualVehicleCount = vehicleCount || 0;
        const quantity = Math.max(5, actualVehicleCount);

        // Only update if the count has changed
        if (quantity === company.last_reported_vehicle_count) {
          console.log(`No change for company ${company.id}: ${quantity} vehicles`);
          results.push({
            companyId: company.id,
            success: true,
            message: 'No change needed',
            vehicleCount: actualVehicleCount,
          });
          continue;
        }

        console.log(`Syncing company ${company.id}: ${company.last_reported_vehicle_count} -> ${quantity} vehicles`);

        // Update Stripe subscription quantity
        await stripe.subscriptionItems.update(company.stripe_subscription_item_id, {
          quantity,
          proration_behavior: 'none', // No proration as per requirements
        });

        // Update database
        const { error: updateError } = await supabase
          .from('mt_companies')
          .update({ last_reported_vehicle_count: actualVehicleCount })
          .eq('id', company.id);

        if (updateError) {
          console.error(`Error updating company ${company.id}:`, updateError);
          results.push({
            companyId: company.id,
            success: false,
            error: 'Failed to update database',
          });
          continue;
        }

        syncedCount++;
        results.push({
          companyId: company.id,
          success: true,
          vehicleCount: actualVehicleCount,
          billedQuantity: quantity,
          previousCount: company.last_reported_vehicle_count,
        });

        console.log(`Successfully synced company ${company.id}`);

      } catch (error) {
        console.error(`Error syncing company ${company.id}:`, error);
        results.push({
          companyId: company.id,
          success: false,
          error: error.message || 'Unknown error',
        });
      }
    }

    console.log(`Vehicle count sync completed. Synced ${syncedCount} companies.`);

    return new Response(JSON.stringify({
      success: true,
      message: `Synced ${syncedCount} of ${companies.length} companies`,
      synced: syncedCount,
      total: companies.length,
      results,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Vehicle count sync failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Vehicle count sync failed',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Determine if we should sync a company based on their billing cycle
 * Sync if we're within 2 days of their next billing date
 */
function shouldSyncCompany(billingCycleAnchor: string | null): boolean {
  if (!billingCycleAnchor) return false;

  const now = new Date();
  const billingDate = new Date(billingCycleAnchor);
  const daysDiff = Math.ceil((billingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Sync if within 2 days of billing date (including past due)
  return daysDiff <= 2;
}