'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { Database } from '@/types/database';

type ActiveReminder = Database['public']['Tables']['mt_active_reminders']['Row'] & {
  mt_vehicles: {
    make: string;
    model: string;
    year: number;
    license_plate: string | null;
  };
  mt_reminder_rules: {
    rule_name: string;
    priority: string;
  };
};

export function ActiveRemindersList() {
  const [reminders, setReminders] = useState<ActiveReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (profile?.company_id) {
      fetchActiveReminders();
    }
  }, [profile]);

  const fetchActiveReminders = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('mt_active_reminders')
        .select(`
          *,
          mt_vehicles!inner (
            make,
            model,
            year,
            license_plate,
            company_id
          ),
          mt_reminder_rules!inner (
            rule_name,
            priority
          )
        `)
        .eq('mt_vehicles.company_id', profile.company_id)
        .in('status', ['active', 'snoozed'])
        .order('due_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching active reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('mt_active_reminders')
        .update({
          status: 'dismissed',
          dismissed_at: new Date().toISOString(),
        })
        .eq('id', reminderId);

      if (error) throw error;
      
      // Remove from local state
      setReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch (error) {
      console.error('Error dismissing reminder:', error);
    }
  };

  const snoozeReminder = async (reminderId: string, days: number) => {
    try {
      const snoozeDate = new Date();
      snoozeDate.setDate(snoozeDate.getDate() + days);
      
      const { error } = await supabase
        .from('mt_active_reminders')
        .update({
          status: 'snoozed',
          snoozed_until: snoozeDate.toISOString().split('T')[0],
        })
        .eq('id', reminderId);

      if (error) throw error;
      
      // Update local state
      setReminders(prev => prev.map(r => 
        r.id === reminderId 
          ? { ...r, status: 'snoozed', snoozed_until: snoozeDate.toISOString().split('T')[0] }
          : r
      ));
    } catch (error) {
      console.error('Error snoozing reminder:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-500">Loading reminders...</div>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No active reminders</h3>
        <p className="mt-1 text-sm text-gray-500">
          You're all caught up! New reminders will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reminders.map((reminder) => {
        const daysUntilDue = getDaysUntilDue(reminder.due_date);
        const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
        const isDueSoon = daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue >= 0;

        return (
          <div
            key={reminder.id}
            className={`bg-white rounded-lg shadow-sm border-l-4 p-6 ${
              isOverdue ? 'border-red-500' : isDueSoon ? 'border-yellow-500' : 'border-blue-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {reminder.title}
                  </h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(reminder.priority)}`}>
                    {reminder.priority}
                  </span>
                  {reminder.status === 'snoozed' && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      Snoozed
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Vehicle:</strong> {reminder.mt_vehicles.year} {reminder.mt_vehicles.make} {reminder.mt_vehicles.model}</p>
                  {reminder.mt_vehicles.license_plate && (
                    <p><strong>License:</strong> {reminder.mt_vehicles.license_plate}</p>
                  )}
                  <p><strong>Due Date:</strong> {formatDate(reminder.due_date)}</p>
                  {reminder.target_mileage && (
                    <p><strong>Target Mileage:</strong> {reminder.target_mileage.toLocaleString()} miles</p>
                  )}
                  {reminder.description && (
                    <p><strong>Description:</strong> {reminder.description}</p>
                  )}
                </div>

                {daysUntilDue !== null && (
                  <div className="mt-3">
                    {isOverdue ? (
                      <span className="text-red-600 font-medium">
                        Overdue by {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className={`font-medium ${isDueSoon ? 'text-yellow-600' : 'text-gray-600'}`}>
                        Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => dismissReminder(reminder.id)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  Dismiss
                </button>
                <div className="relative group">
                  <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                    Snooze
                  </button>
                  <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-300 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button
                      onClick={() => snoozeReminder(reminder.id, 1)}
                      className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      1 day
                    </button>
                    <button
                      onClick={() => snoozeReminder(reminder.id, 7)}
                      className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      1 week
                    </button>
                    <button
                      onClick={() => snoozeReminder(reminder.id, 30)}
                      className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      1 month
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}