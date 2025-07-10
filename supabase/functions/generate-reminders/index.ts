import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface Database {
  public: {
    Tables: {
      mt_reminder_rules: {
        Row: {
          id: string;
          company_id: string;
          vehicle_id: string | null;
          maintenance_type_id: string | null;
          custom_type: string | null;
          rule_name: string;
          description: string | null;
          is_active: boolean;
          trigger_type: 'mileage_interval' | 'time_interval' | 'mileage_since_last' | 'time_since_last';
          mileage_interval: number | null;
          mileage_threshold: number | null;
          time_interval_days: number | null;
          time_threshold_days: number | null;
          lead_time_days: number;
          priority: 'low' | 'medium' | 'high' | 'critical';
          day_of_week: number | null;
          created_at: string;
          updated_at: string;
        };
      };
      mt_active_reminders: {
        Row: {
          id: string;
          reminder_rule_id: string;
          vehicle_id: string;
          user_id: string | null;
          title: string;
          description: string | null;
          priority: 'low' | 'medium' | 'high' | 'critical';
          due_date: string | null;
          current_mileage: number | null;
          target_mileage: number | null;
          status: 'active' | 'completed' | 'dismissed' | 'snoozed';
          completed_at: string | null;
          dismissed_at: string | null;
          snoozed_until: string | null;
          completed_maintenance_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reminder_rule_id: string;
          vehicle_id: string;
          user_id?: string | null;
          title: string;
          description?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'critical';
          due_date?: string | null;
          current_mileage?: number | null;
          target_mileage?: number | null;
          status?: 'active' | 'completed' | 'dismissed' | 'snoozed';
          completed_at?: string | null;
          dismissed_at?: string | null;
          snoozed_until?: string | null;
          completed_maintenance_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      mt_vehicles: {
        Row: {
          id: string;
          company_id: string;
          make: string;
          model: string;
          year: number;
          current_mileage: number;
          is_active: boolean;
        };
      };
      mt_maintenance_records: {
        Row: {
          id: string;
          vehicle_id: string;
          mileage: number;
          type_id: string | null;
          custom_type: string | null;
          date: string;
        };
      };
    };
  };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const generatedCount = await generateReminders(supabaseClient);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${generatedCount} reminders`,
        generated_count: generatedCount,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error generating reminders:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function generateReminders(supabase: any): Promise<number> {
  console.log('Starting reminder generation...');
  
  // Get all active reminder rules
  const { data: rules, error: rulesError } = await supabase
    .from('mt_reminder_rules')
    .select('*')
    .eq('is_active', true);

  if (rulesError) {
    console.error('Error fetching reminder rules:', rulesError);
    throw new Error('Failed to fetch reminder rules');
  }

  if (!rules || rules.length === 0) {
    console.log('No active reminder rules found');
    return 0;
  }

  console.log(`Found ${rules.length} active reminder rules`);
  
  let generatedCount = 0;
  
  for (const rule of rules) {
    try {
      const newReminders = await processReminderRuleForAllVehicles(supabase, rule);
      generatedCount += newReminders;
    } catch (error) {
      console.error(`Error processing rule ${rule.id}:`, error);
      // Continue with other rules
    }
  }

  console.log(`Generated ${generatedCount} total reminders`);
  return generatedCount;
}

async function processReminderRuleForAllVehicles(supabase: any, rule: any): Promise<number> {
  console.log(`Processing rule: ${rule.rule_name}`);
  
  // Get vehicles that this rule applies to
  let vehicleQuery = supabase
    .from('mt_vehicles')
    .select('*')
    .eq('is_active', true);

  // If rule is for a specific vehicle, filter by vehicle_id
  if (rule.vehicle_id) {
    vehicleQuery = vehicleQuery.eq('id', rule.vehicle_id);
  } else {
    // If rule is for all vehicles, filter by company
    vehicleQuery = vehicleQuery.eq('company_id', rule.company_id);
  }

  const { data: vehicles, error: vehiclesError } = await vehicleQuery;

  if (vehiclesError) {
    console.error('Error fetching vehicles:', vehiclesError);
    throw new Error('Failed to fetch vehicles');
  }

  if (!vehicles || vehicles.length === 0) {
    console.log(`No vehicles found for rule ${rule.rule_name}`);
    return 0;
  }

  console.log(`Found ${vehicles.length} vehicles for rule ${rule.rule_name}`);
  
  let generatedCount = 0;
  
  for (const vehicle of vehicles) {
    try {
      const newReminders = await processReminderRule(supabase, rule, vehicle);
      generatedCount += newReminders;
    } catch (error) {
      console.error(`Error processing rule ${rule.id} for vehicle ${vehicle.id}:`, error);
      // Continue with other vehicles
    }
  }

  return generatedCount;
}

async function processReminderRule(supabase: any, rule: any, vehicle: any): Promise<number> {
  
  // Check if reminder already exists and is active
  const { data: existingReminders } = await supabase
    .from('mt_active_reminders')
    .select('id')
    .eq('reminder_rule_id', rule.id)
    .eq('vehicle_id', vehicle.id)
    .in('status', ['active', 'snoozed']);

  if (existingReminders && existingReminders.length > 0) {
    // Reminder already exists, skip
    return 0;
  }

  // Calculate if reminder should be generated based on trigger type
  const reminderData = await calculateReminderData(supabase, rule, vehicle);
  
  if (!reminderData) {
    // Conditions not met for reminder generation
    return 0;
  }

  // Create the reminder
  const { data: newReminder, error: insertError } = await supabase
    .from('mt_active_reminders')
    .insert({
      reminder_rule_id: rule.id,
      vehicle_id: vehicle.id,
      title: reminderData.title,
      description: reminderData.description,
      priority: rule.priority,
      due_date: reminderData.due_date,
      current_mileage: vehicle.current_mileage,
      target_mileage: reminderData.target_mileage,
      status: 'active'
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Error inserting reminder:', insertError);
    throw new Error('Failed to create reminder');
  }

  console.log(`Created reminder for rule ${rule.rule_name} on vehicle ${vehicle.make} ${vehicle.model}`);
  return 1;
}

async function calculateReminderData(supabase: any, rule: any, vehicle: any): Promise<any> {
  const today = new Date();
  const leadTimeDate = new Date(today);
  leadTimeDate.setDate(today.getDate() + rule.lead_time_days);

  switch (rule.trigger_type) {
    case 'mileage_interval':
      return await calculateMileageInterval(supabase, rule, vehicle, leadTimeDate);
    
    case 'time_interval':
      return await calculateTimeInterval(supabase, rule, vehicle, leadTimeDate);
    
    case 'mileage_since_last':
      return await calculateMileageSinceLast(supabase, rule, vehicle, leadTimeDate);
    
    case 'time_since_last':
      return await calculateTimeSinceLast(supabase, rule, vehicle, leadTimeDate);
    
    default:
      return null;
  }
}

async function calculateMileageInterval(supabase: any, rule: any, vehicle: any, leadTimeDate: Date): Promise<any> {
  if (!rule.mileage_interval) return null;

  // Get the last maintenance record for this type
  const { data: lastMaintenance } = await supabase
    .from('mt_maintenance_records')
    .select('mileage, date')
    .eq('vehicle_id', vehicle.id)
    .or(`type_id.eq.${rule.maintenance_type_id},custom_type.eq.${rule.custom_type}`)
    .order('date', { ascending: false })
    .limit(1);

  const lastMileage = lastMaintenance?.[0]?.mileage || 0;
  const targetMileage = lastMileage + rule.mileage_interval;
  
  // Check if we're within lead time of the target mileage
  const mileageUntilDue = targetMileage - vehicle.current_mileage;
  
  if (mileageUntilDue <= 0) {
    // Overdue
    return {
      title: `${rule.rule_name} - Overdue`,
      description: `${rule.rule_name} is overdue by ${Math.abs(mileageUntilDue)} miles`,
      due_date: null,
      target_mileage: targetMileage
    };
  }

  // Estimate due date based on average daily mileage (assume 30 miles/day if no history)
  const estimatedDays = Math.ceil(mileageUntilDue / 30);
  const estimatedDueDate = new Date();
  estimatedDueDate.setDate(estimatedDueDate.getDate() + estimatedDays);

  if (estimatedDueDate <= leadTimeDate) {
    return {
      title: `${rule.rule_name} - Due Soon`,
      description: `${rule.rule_name} due in approximately ${mileageUntilDue} miles`,
      due_date: estimatedDueDate.toISOString().split('T')[0],
      target_mileage: targetMileage
    };
  }

  return null;
}

async function calculateTimeInterval(supabase: any, rule: any, vehicle: any, leadTimeDate: Date): Promise<any> {
  if (!rule.time_interval_days) return null;

  // Get the last maintenance record for this type
  const { data: lastMaintenance } = await supabase
    .from('mt_maintenance_records')
    .select('date')
    .eq('vehicle_id', vehicle.id)
    .or(`type_id.eq.${rule.maintenance_type_id},custom_type.eq.${rule.custom_type}`)
    .order('date', { ascending: false })
    .limit(1);

  const lastDate = lastMaintenance?.[0]?.date ? new Date(lastMaintenance[0].date) : new Date('2025-01-01');
  const dueDate = new Date(lastDate);
  dueDate.setDate(dueDate.getDate() + rule.time_interval_days);

  // Adjust to preferred day of week if specified
  if (rule.day_of_week !== null && rule.day_of_week !== undefined) {
    const currentDayOfWeek = dueDate.getDay();
    const preferredDayOfWeek = rule.day_of_week;
    
    // Calculate days to add/subtract to get to preferred day
    let daysToAdjust = preferredDayOfWeek - currentDayOfWeek;
    
    // If the preferred day is earlier in the week, move to next week
    if (daysToAdjust < 0) {
      daysToAdjust += 7;
    }
    
    dueDate.setDate(dueDate.getDate() + daysToAdjust);
  }

  if (dueDate <= leadTimeDate) {
    const today = new Date();
    const isOverdue = dueDate < today;
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dueDateDay = rule.day_of_week !== null ? ` (${dayNames[rule.day_of_week]})` : '';
    
    return {
      title: `${rule.rule_name} - ${isOverdue ? 'Overdue' : 'Due Soon'}`,
      description: `${rule.rule_name} ${isOverdue ? 'was due' : 'is due'} on ${dueDate.toLocaleDateString()}${dueDateDay}`,
      due_date: dueDate.toISOString().split('T')[0],
      target_mileage: null
    };
  }

  return null;
}

async function calculateMileageSinceLast(supabase: any, rule: any, vehicle: any, leadTimeDate: Date): Promise<any> {
  if (!rule.mileage_threshold) return null;

  const { data: lastMaintenance } = await supabase
    .from('mt_maintenance_records')
    .select('mileage')
    .eq('vehicle_id', vehicle.id)
    .or(`type_id.eq.${rule.maintenance_type_id},custom_type.eq.${rule.custom_type}`)
    .order('date', { ascending: false })
    .limit(1);

  const lastMileage = lastMaintenance?.[0]?.mileage || 0;
  const mileagesSinceLast = vehicle.current_mileage - lastMileage;

  if (mileagesSinceLast >= rule.mileage_threshold) {
    return {
      title: `${rule.rule_name} - Threshold Reached`,
      description: `${mileagesSinceLast} miles since last ${rule.rule_name} (threshold: ${rule.mileage_threshold})`,
      due_date: null,
      target_mileage: null
    };
  }

  return null;
}

async function calculateTimeSinceLast(supabase: any, rule: any, vehicle: any, leadTimeDate: Date): Promise<any> {
  if (!rule.time_threshold_days) return null;

  const { data: lastMaintenance } = await supabase
    .from('mt_maintenance_records')
    .select('date')
    .eq('vehicle_id', vehicle.id)
    .or(`type_id.eq.${rule.maintenance_type_id},custom_type.eq.${rule.custom_type}`)
    .order('date', { ascending: false })
    .limit(1);

  const lastDate = lastMaintenance?.[0]?.date ? new Date(lastMaintenance[0].date) : new Date('2025-01-01');
  const today = new Date();
  const daysSinceLast = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLast >= rule.time_threshold_days) {
    return {
      title: `${rule.rule_name} - Time Threshold Reached`,
      description: `${daysSinceLast} days since last ${rule.rule_name} (threshold: ${rule.time_threshold_days})`,
      due_date: null,
      target_mileage: null
    };
  }

  return null;
}