import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendReminderEmail, type ReminderEmailData, type CompanyUser } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { reminderId } = await request.json();
    
    if (!reminderId) {
      return NextResponse.json({ error: 'Reminder ID is required' }, { status: 400 });
    }

    const supabase = createClient();
    
    // Get the reminder with related data
    const { data: reminder, error: reminderError } = await supabase
      .from('mt_active_reminders')
      .select(`
        *,
        mt_vehicles!inner (
          id,
          year,
          make,
          model,
          license_plate,
          current_mileage,
          company_id,
          mt_companies!inner (
            id,
            name
          )
        ),
        mt_reminder_rules!inner (
          rule_name,
          description
        )
      `)
      .eq('id', reminderId)
      .single();

    if (reminderError) {
      console.error('Error fetching reminder:', reminderError);
      return NextResponse.json({ error: 'Failed to fetch reminder' }, { status: 500 });
    }

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    // Get all company users (admin + employees)
    const { data: users, error: usersError } = await supabase
      .from('mt_users')
      .select('id, email, name, role')
      .eq('company_id', reminder.mt_vehicles.company_id)
      .not('email', 'is', null);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No users to notify',
        sent_count: 0 
      });
    }

    // Prepare email data
    const vehicleInfo = `${reminder.mt_vehicles.year} ${reminder.mt_vehicles.make} ${reminder.mt_vehicles.model}${
      reminder.mt_vehicles.license_plate ? ` (${reminder.mt_vehicles.license_plate})` : ''
    }`;

    const emailData: ReminderEmailData = {
      companyName: reminder.mt_vehicles.mt_companies.name,
      vehicleInfo,
      reminderTitle: reminder.title,
      reminderDescription: reminder.description || reminder.mt_reminder_rules.description || 'No description provided',
      priority: reminder.priority,
      dueDate: reminder.due_date || new Date().toISOString(),
      currentMileage: reminder.current_mileage || reminder.mt_vehicles.current_mileage,
      targetMileage: reminder.target_mileage
    };

    const companyUsers: CompanyUser[] = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }));

    // Send emails
    await sendReminderEmail(companyUsers, emailData);

    return NextResponse.json({ 
      success: true, 
      message: `Email notifications sent to ${users.length} users`,
      sent_count: users.length
    });

  } catch (error) {
    console.error('Error sending reminder notification:', error);
    return NextResponse.json({ 
      error: 'Failed to send notification', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}