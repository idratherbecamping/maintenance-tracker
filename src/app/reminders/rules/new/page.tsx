'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

const reminderRuleSchema = z
  .object({
    rule_name: z.string().min(1, 'Rule name is required'),
    description: z.string().optional(),
    vehicle_id: z.string().optional(),
    maintenance_type_id: z.string().optional(),
    custom_type: z.string().optional(),
    trigger_type: z.enum([
      'mileage_interval',
      'time_interval',
      'mileage_since_last',
      'time_since_last',
    ]),
    mileage_interval: z.number().optional(),
    mileage_threshold: z.number().optional(),
    time_interval_days: z.number().optional(),
    time_threshold_days: z.number().optional(),
    lead_time_days: z.number().min(0, 'Lead time must be 0 or greater').default(7),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    day_of_week: z.number().min(0).max(6).optional(),
  })
  .refine(
    (data) => {
      // Require maintenance type or custom type
      if (!data.maintenance_type_id && !data.custom_type) {
        return false;
      }

      // Validate trigger-specific fields
      if (data.trigger_type === 'mileage_interval' && !data.mileage_interval) return false;
      if (data.trigger_type === 'time_interval' && !data.time_interval_days) return false;
      if (data.trigger_type === 'mileage_since_last' && !data.mileage_threshold) return false;
      if (data.trigger_type === 'time_since_last' && !data.time_threshold_days) return false;

      return true;
    },
    {
      message: 'Please complete all required fields for the selected trigger type',
      path: ['trigger_type'],
    }
  );

type ReminderRuleForm = z.infer<typeof reminderRuleSchema>;

type Vehicle = Database['public']['Tables']['mt_vehicles']['Row'];
type MaintenanceType = Database['public']['Tables']['mt_maintenance_types']['Row'];

export default function NewReminderRulePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCustomType, setShowCustomType] = useState(false);
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<ReminderRuleForm>({
    resolver: zodResolver(reminderRuleSchema),
    defaultValues: {
      priority: 'medium',
      lead_time_days: 7,
    },
  });

  const triggerType = watch('trigger_type');
  const maintenanceTypeId = watch('maintenance_type_id');

  useEffect(() => {
    if (profile?.company_id) {
      fetchVehicles();
      fetchMaintenanceTypes();
    }
  }, [profile]);

  useEffect(() => {
    // Clear custom type when maintenance type is selected
    if (maintenanceTypeId) {
      setValue('custom_type', '');
      setShowCustomType(false);
    }
  }, [maintenanceTypeId, setValue]);

  const fetchVehicles = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('mt_vehicles')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('year', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchMaintenanceTypes = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('mt_maintenance_types')
        .select('*')
        .or(`company_id.is.null,company_id.eq.${profile.company_id}`)
        .order('name');

      if (error) throw error;
      setMaintenanceTypes(data || []);
    } catch (error) {
      console.error('Error fetching maintenance types:', error);
    }
  };

  const onSubmit = async (data: ReminderRuleForm) => {
    if (!profile?.company_id) return;

    setLoading(true);
    try {
      const reminderRule = {
        company_id: profile.company_id,
        vehicle_id: data.vehicle_id || null,
        maintenance_type_id: data.maintenance_type_id || null,
        custom_type: data.custom_type || null,
        rule_name: data.rule_name,
        description: data.description || null,
        trigger_type: data.trigger_type,
        mileage_interval: data.mileage_interval || null,
        mileage_threshold: data.mileage_threshold || null,
        time_interval_days: data.time_interval_days || null,
        time_threshold_days: data.time_threshold_days || null,
        lead_time_days: data.lead_time_days,
        priority: data.priority,
        day_of_week: data.day_of_week || null,
        is_active: true,
      };

      const { error } = await supabase.from('mt_reminder_rules').insert([reminderRule]);

      if (error) throw error;

      router.push('/reminders');
    } catch (error) {
      console.error('Error creating reminder rule:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="py-10">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-4">
                  <li>
                    <Link href="/reminders" className="text-gray-400 hover:text-gray-500">
                      Reminders
                    </Link>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg
                        className="h-5 w-5 flex-shrink-0 text-gray-300"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-4 text-sm font-medium text-gray-500">New Rule</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 className="mt-4 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                Create Reminder Rule
              </h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Rule Details</h2>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="rule_name" className="block text-sm font-medium text-gray-700">
                      Rule Name *
                    </label>
                    <input
                      type="text"
                      {...register('rule_name')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., Oil Change Reminder"
                    />
                    {errors.rule_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.rule_name.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Optional description of this reminder rule"
                    />
                  </div>

                  <div>
                    <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700">
                      Vehicle
                    </label>
                    <select
                      {...register('vehicle_id')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">All vehicles</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      {...register('priority')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Maintenance Type</h2>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="maintenance_type_id"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Maintenance Type
                    </label>
                    <select
                      {...register('maintenance_type_id')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select a maintenance type</option>
                      {maintenanceTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showCustomType}
                      onChange={(e) => {
                        setShowCustomType(e.target.checked);
                        if (e.target.checked) {
                          setValue('maintenance_type_id', '');
                        } else {
                          setValue('custom_type', '');
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Use custom maintenance type
                    </label>
                  </div>

                  {showCustomType && (
                    <div>
                      <label
                        htmlFor="custom_type"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Custom Type
                      </label>
                      <input
                        type="text"
                        {...register('custom_type')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., Custom Inspection"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Trigger Conditions</h2>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="trigger_type"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Trigger Type *
                    </label>
                    <select
                      {...register('trigger_type')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select trigger type</option>
                      <option value="mileage_interval">
                        Mileage Interval (e.g., every 5,000 miles)
                      </option>
                      <option value="time_interval">Time Interval (e.g., every 6 months)</option>
                      <option value="mileage_since_last">Mileage Since Last Service</option>
                      <option value="time_since_last">Time Since Last Service</option>
                    </select>
                    {errors.trigger_type && (
                      <p className="mt-1 text-sm text-red-600">{errors.trigger_type.message}</p>
                    )}
                  </div>

                  {triggerType === 'mileage_interval' && (
                    <div>
                      <label
                        htmlFor="mileage_interval"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Mileage Interval *
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="number"
                          {...register('mileage_interval', { valueAsNumber: true })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="5000"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">miles</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {triggerType === 'time_interval' && (
                    <div>
                      <label
                        htmlFor="time_interval_days"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Time Interval *
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="number"
                          {...register('time_interval_days', { valueAsNumber: true })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="180"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">days</span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label
                          htmlFor="day_of_week"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Preferred Day of Week (Optional)
                        </label>
                        <select
                          {...register('day_of_week', { valueAsNumber: true })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="">Any day</option>
                          <option value="0">Sunday</option>
                          <option value="1">Monday</option>
                          <option value="2">Tuesday</option>
                          <option value="3">Wednesday</option>
                          <option value="4">Thursday</option>
                          <option value="5">Friday</option>
                          <option value="6">Saturday</option>
                        </select>
                        <p className="mt-1 text-sm text-gray-500">
                          If specified, reminders will prefer to be scheduled on this day of the week.
                        </p>
                      </div>
                    </div>
                  )}

                  {triggerType === 'mileage_since_last' && (
                    <div>
                      <label
                        htmlFor="mileage_threshold"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Mileage Threshold *
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="number"
                          {...register('mileage_threshold', { valueAsNumber: true })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="3000"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">miles</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {triggerType === 'time_since_last' && (
                    <div>
                      <label
                        htmlFor="time_threshold_days"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Time Threshold *
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="number"
                          {...register('time_threshold_days', { valueAsNumber: true })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="90"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">days</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="lead_time_days"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Lead Time
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        {...register('lead_time_days', { valueAsNumber: true })}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="7"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">days before due</span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      How many days before the due date to show the reminder
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Link
                  href="/reminders"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
