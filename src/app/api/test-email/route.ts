import { NextRequest, NextResponse } from 'next/server';
import { sendReminderEmail, type ReminderEmailData, type CompanyUser } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { testEmail } = await request.json();
    
    if (!testEmail) {
      return NextResponse.json({ error: 'Test email is required' }, { status: 400 });
    }

    // Test data
    const testUsers: CompanyUser[] = [
      {
        id: 'test-user-1',
        email: testEmail,
        name: 'Test User',
        role: 'admin'
      }
    ];

    const testReminderData: ReminderEmailData = {
      companyName: 'Test Company',
      vehicleInfo: '2020 Honda Civic (ABC-123)',
      reminderTitle: 'Oil Change Due',
      reminderDescription: 'Vehicle needs an oil change based on mileage interval',
      priority: 'high',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      currentMileage: 45000,
      targetMileage: 50000
    };

    await sendReminderEmail(testUsers, testReminderData);

    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully',
      sent_to: testEmail
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ 
      error: 'Failed to send test email', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}