'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { Database } from '@/types/database';

type ReminderRule = Database['public']['Tables']['mt_reminder_rules']['Row'] & {
  mt_vehicles?: {
    make: string;
    model: string;
    year: number;
    license_plate: string | null;
  };
  mt_maintenance_types?: {
    name: string;
  };
};

export function ReminderRulesList() {
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (profile?.company_id) {
      fetchReminderRules();
    }
  }, [profile]);

  const fetchReminderRules = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('mt_reminder_rules')
        .select(
          `
          *,
          mt_vehicles (
            make,
            model,
            year,
            license_plate
          ),
          mt_maintenance_types (
            name
          )
        `
        )
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching reminder rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('mt_reminder_rules')
        .update({ is_active: !isActive })
        .eq('id', ruleId);

      if (error) throw error;

      // Update local state
      setRules((prev) =>
        prev.map((rule) => (rule.id === ruleId ? { ...rule, is_active: !isActive } : rule))
      );
    } catch (error) {
      console.error('Error updating rule status:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this reminder rule?')) return;

    try {
      const { error } = await supabase.from('mt_reminder_rules').delete().eq('id', ruleId);

      if (error) throw error;

      // Remove from local state
      setRules((prev) => prev.filter((rule) => rule.id !== ruleId));
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const getTriggerDescription = (rule: ReminderRule) => {
    switch (rule.trigger_type) {
      case 'mileage_interval':
        return `Every ${rule.mileage_interval?.toLocaleString()} miles`;
      case 'time_interval':
        return `Every ${rule.time_interval_days} days`;
      case 'mileage_since_last':
        return `${rule.mileage_threshold?.toLocaleString()} miles since last service`;
      case 'time_since_last':
        return `${rule.time_threshold_days} days since last service`;
      default:
        return 'Unknown trigger';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-500">Loading reminder rules...</div>
      </div>
    );
  }

  if (rules.length === 0) {
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
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No reminder rules</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first automated reminder rule.
        </p>
        <div className="mt-6">
          <Link
            href="/reminders/rules/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Create Rule
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rules.map((rule) => (
        <div key={rule.id} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-medium text-gray-900">{rule.rule_name}</h3>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(rule.priority)}`}
                >
                  {rule.priority}
                </span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {rule.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Maintenance Type:</strong>{' '}
                  {rule.mt_maintenance_types?.name || rule.custom_type || 'Any'}
                </p>
                <p>
                  <strong>Vehicle:</strong>{' '}
                  {rule.mt_vehicles
                    ? `${rule.mt_vehicles.year} ${rule.mt_vehicles.make} ${rule.mt_vehicles.model}`
                    : 'All vehicles'}
                </p>
                <p>
                  <strong>Trigger:</strong> {getTriggerDescription(rule)}
                </p>
                <p>
                  <strong>Lead Time:</strong> {rule.lead_time_days} days before due
                </p>
                {rule.description && (
                  <p>
                    <strong>Description:</strong> {rule.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-2 ml-4">
              <button
                onClick={() => toggleRuleStatus(rule.id, rule.is_active)}
                className={`inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded ${
                  rule.is_active
                    ? 'text-red-700 bg-white hover:bg-red-50'
                    : 'text-green-700 bg-white hover:bg-green-50'
                }`}
              >
                {rule.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => deleteRule(rule.id)}
                className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
