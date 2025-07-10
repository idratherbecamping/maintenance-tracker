import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { sendReminderEmail, type ReminderEmailData, type CompanyUser } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    console.log('Generate reminders API called');
    
    // Get user context using cookies (standard Next.js auth pattern)
    const supabase = await createServerClient();
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('Authentication failed:', userError?.message);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's company ID
    const { data: userProfile, error: profileError } = await supabase
      .from('mt_users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.log('Profile fetch failed:', profileError?.message);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const userCompanyId = userProfile.company_id;
    console.log(`User ${user.id} from company ${userCompanyId} requesting reminder generation`);

    // Call the Supabase Edge Function directly via HTTP
    console.log('Calling Edge Function...');
    
    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-reminders`;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ manual_trigger: true })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function HTTP error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to generate reminders', details: `HTTP ${response.status}: ${errorText}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    console.log('Edge function response:', data);
    
    // If reminders were generated, send email notifications for this company only
    let emailsSent = 0;
    if (data?.generated_count > 0) {
      try {
        console.log(`Attempting to send emails for ${data.generated_count} new reminders for company ${userCompanyId}`);
        emailsSent = await sendEmailsForNewReminders(userCompanyId);
        console.log(`Successfully sent emails for ${emailsSent} reminders`);
      } catch (emailError) {
        console.error('Error sending email notifications:', emailError);
        // Don't fail the request if emails fail
      }
    }
    
    return NextResponse.json({
      success: true,
      message: data?.message || 'Reminders generated successfully',
      generated_count: data?.generated_count || 0,
      emails_sent: emailsSent,
      timestamp: data?.timestamp || new Date().toISOString()
    });
  } catch (error) {
    console.error('Unexpected error in generate reminders API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

async function sendEmailsForNewReminders(companyId: string): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Get recently created active reminders (within last 5 minutes) for specific company
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data: newReminders, error: remindersError } = await supabase
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
    .eq('status', 'active')
    .eq('mt_vehicles.company_id', companyId)
    .gte('created_at', fiveMinutesAgo);

  if (remindersError) {
    console.error('Error fetching new reminders:', remindersError);
    throw new Error('Failed to fetch new reminders');
  }

  if (!newReminders || newReminders.length === 0) {
    console.log('No new reminders found to send emails for');
    return 0;
  }

  console.log(`Found ${newReminders.length} new reminders to send emails for company ${companyId}`);

  // Get company users
  const { data: users, error: usersError } = await supabase
    .from('mt_users')
    .select('id, email, name, role')
    .eq('company_id', companyId)
    .not('email', 'is', null);

  if (usersError) {
    console.error(`Error fetching users for company ${companyId}:`, usersError);
    throw new Error('Failed to fetch users');
  }

  if (!users || users.length === 0) {
    console.log(`No users with email found for company ${companyId}`);
    return 0;
  }

  const companyUsers: CompanyUser[] = users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  }));

  let totalEmailsSent = 0;

  // Send email for each reminder
  for (const reminder of newReminders) {
    try {
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

      await sendReminderEmail(companyUsers, emailData);
      totalEmailsSent++;
      
      console.log(`Sent email for reminder: ${reminder.title} to ${users.length} users`);
    } catch (error) {
      console.error(`Error sending email for reminder ${reminder.title}:`, error);
      // Continue with other reminders
    }
  }

  return totalEmailsSent;
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate reminders.' },
    { status: 405 }
  );
}