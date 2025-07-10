import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    
    if (!companyId) {
      return NextResponse.json({ error: 'companyId required' }, { status: 400 });
    }

    console.log('Debug Data API: Checking data for company:', companyId);

    // Get company info
    const { data: company } = await supabaseAdmin
      .from('mt_companies')
      .select('*')
      .eq('id', companyId)
      .single();

    // Get all vehicles
    const { data: vehicles, error: vehiclesError } = await supabaseAdmin
      .from('mt_vehicles')
      .select('*')
      .eq('company_id', companyId);

    // Get all maintenance records
    const { data: maintenanceRecords, error: maintenanceError } = await supabaseAdmin
      .from('mt_maintenance_records')
      .select('*, mt_vehicles!inner(company_id)')
      .eq('mt_vehicles.company_id', companyId);

    // Get all users
    const { data: users } = await supabaseAdmin
      .from('mt_users')
      .select('*')
      .eq('company_id', companyId);

    // Get maintenance types
    const { data: maintenanceTypes } = await supabaseAdmin
      .from('mt_maintenance_types')
      .select('*');

    // Get active reminders
    const { data: activeReminders } = await supabaseAdmin
      .from('mt_active_reminders')
      .select('*, mt_vehicles!inner(company_id)')
      .eq('mt_vehicles.company_id', companyId);

    const summary = {
      company: company || null,
      vehicleCount: vehicles?.length || 0,
      maintenanceCount: maintenanceRecords?.length || 0,
      userCount: users?.length || 0,
      maintenanceTypeCount: maintenanceTypes?.length || 0,
      activeReminderCount: activeReminders?.length || 0,
      vehicles: vehicles || [],
      maintenanceRecords: maintenanceRecords || [],
      users: users || [],
      errors: {
        vehicles: vehiclesError?.message,
        maintenance: maintenanceError?.message
      }
    };

    console.log('Debug Data API: Summary:', summary);

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Debug Data API: Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}