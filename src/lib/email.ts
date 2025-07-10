import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface ReminderEmailData {
  companyName: string;
  vehicleInfo: string;
  reminderTitle: string;
  reminderDescription: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  currentMileage?: number;
  targetMileage?: number;
}

export interface CompanyUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function sendReminderEmail(
  users: CompanyUser[],
  reminderData: ReminderEmailData
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return;
  }

  if (!users || users.length === 0) {
    console.log('No users to send email to');
    return;
  }

  const priorityColors = {
    low: '#10B981',
    medium: '#F59E0B', 
    high: '#EF4444',
    critical: '#DC2626'
  };

  const priorityLabels = {
    low: 'Low Priority',
    medium: 'Medium Priority',
    high: 'High Priority',
    critical: 'Critical'
  };

  const emailSubject = `${priorityLabels[reminderData.priority]} Maintenance Reminder - ${reminderData.vehicleInfo}`;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #1f2937; margin: 0 0 10px 0;">🚗 Maintenance Reminder</h1>
        <p style="color: #6b7280; margin: 0; font-size: 16px;">${reminderData.companyName}</p>
      </div>
      
      <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="background-color: ${priorityColors[reminderData.priority]}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-right: 10px;">
            ${priorityLabels[reminderData.priority]}
          </div>
          <h2 style="margin: 0; color: #1f2937; font-size: 18px;">${reminderData.reminderTitle}</h2>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
          <p style="margin: 0 0 10px 0; color: #374151;"><strong>Vehicle:</strong> ${reminderData.vehicleInfo}</p>
          <p style="margin: 0 0 10px 0; color: #374151;"><strong>Due Date:</strong> ${new Date(reminderData.dueDate).toLocaleDateString()}</p>
          ${reminderData.currentMileage ? `<p style="margin: 0 0 10px 0; color: #374151;"><strong>Current Mileage:</strong> ${reminderData.currentMileage.toLocaleString()} mi</p>` : ''}
          ${reminderData.targetMileage ? `<p style="margin: 0; color: #374151;"><strong>Target Mileage:</strong> ${reminderData.targetMileage.toLocaleString()} mi</p>` : ''}
        </div>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 15px;">
          <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">Description</h3>
          <p style="margin: 0; color: #92400e;">${reminderData.reminderDescription}</p>
        </div>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
          This is an automated reminder from your maintenance tracking system.
        </p>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          Please schedule this maintenance as soon as possible.
        </p>
      </div>
    </div>
  `;

  try {
    const emailPromises = users.map(async (user) => {
      const personalizedSubject = `${emailSubject} - ${user.name}`;
      
      return resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@maintenance-tracker.com',
        to: user.email,
        subject: personalizedSubject,
        html: emailHtml,
      });
    });

    const results = await Promise.allSettled(emailPromises);
    
    // Log results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Email sent successfully to ${users[index].email}`);
      } else {
        console.error(`Failed to send email to ${users[index].email}:`, result.reason);
      }
    });

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Email notification summary: ${successful} sent, ${failed} failed`);
    
  } catch (error) {
    console.error('Error sending reminder emails:', error);
    throw error;
  }
}