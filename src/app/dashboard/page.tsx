'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { RecentMaintenanceList } from '@/components/dashboard/recent-maintenance-list';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  totalVehicles: number;
  thisMonthRecords: number;
  upcomingReminders: number;
  totalSpent: number;
}

interface CompanyInfo {
  name: string;
  onboarding_completed: boolean;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    thisMonthRecords: 0,
    upcomingReminders: 0,
    totalSpent: 0,
  });
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (profile?.company_id) {
      checkOnboardingStatus();
      fetchDashboardStats();
    }
  }, [profile]);

  const checkOnboardingStatus = async () => {
    if (!profile?.company_id) return;

    console.log('Dashboard: Checking onboarding status for company:', profile.company_id);

    try {
      const { data, error } = await supabase
        .from('mt_companies')
        .select('name, onboarding_completed')
        .eq('id', profile.company_id)
        .single();

      console.log('Dashboard: Company info result:', { data, error });

      if (data) {
        setCompanyInfo(data);
        
        if (!data.onboarding_completed) {
          console.log('Dashboard: Redirecting to onboarding - not completed');
          router.push('/onboarding');
        } else {
          console.log('Dashboard: Onboarding completed, staying on dashboard');
        }
      }
    } catch (err) {
      console.log('Dashboard: Error checking company info:', err);
      router.push('/onboarding');
    }
  };

  const fetchDashboardStats = async () => {
    if (!profile?.company_id) return;

    console.log('Dashboard: Fetching stats for company:', profile.company_id);

    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      const today = new Date().toISOString().split('T')[0];

      // Run all queries in parallel for better performance
      const [
        vehiclesResult,
        thisMonthResult,
        allRecordsResult,
        manualRemindersResult,
        activeRemindersResult,
      ] = await Promise.allSettled([
        // Total active vehicles
        supabase
          .from('mt_vehicles')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', profile.company_id)
          .eq('is_active', true),

        // This month's maintenance records with cost
        supabase
          .from('mt_maintenance_records')
          .select('id, cost, mt_vehicles!inner(company_id)')
          .eq('mt_vehicles.company_id', profile.company_id)
          .gte('date', startOfMonth.toISOString().split('T')[0])
          .lte('date', endOfMonth.toISOString().split('T')[0]),

        // All maintenance records for total cost calculation
        supabase
          .from('mt_maintenance_records')
          .select('cost, mt_vehicles!inner(company_id)')
          .eq('mt_vehicles.company_id', profile.company_id),

        // Manual reminders
        supabase
          .from('mt_maintenance_recommendations')
          .select('id', { count: 'exact', head: true })
          .eq('is_completed', false)
          .gte('recommended_date', today),

        // Automated reminders (graceful fallback if table doesn't exist)
        supabase
          .from('mt_active_reminders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['active', 'snoozed'])
          .then((result) => result)
          .catch(() => ({ count: 0, data: null, error: null })),
      ]);

      // Debug the results
      console.log('Dashboard: Query results:', {
        vehicles: vehiclesResult,
        thisMonth: thisMonthResult,
        allRecords: allRecordsResult,
        manualReminders: manualRemindersResult,
        activeReminders: activeRemindersResult
      });

      // Process results with error handling
      const totalVehicles =
        vehiclesResult.status === 'fulfilled' && !vehiclesResult.value.error
          ? vehiclesResult.value.count || 0
          : 0;

      const thisMonthRecords =
        thisMonthResult.status === 'fulfilled' && !thisMonthResult.value.error
          ? thisMonthResult.value.data?.length || 0
          : 0;

      const totalSpent =
        allRecordsResult.status === 'fulfilled' && !allRecordsResult.value.error
          ? allRecordsResult.value.data?.reduce((sum, record) => sum + (record.cost || 0), 0) || 0
          : 0;

      const manualReminders =
        manualRemindersResult.status === 'fulfilled' && !manualRemindersResult.value.error
          ? manualRemindersResult.value.count || 0
          : 0;

      const activeReminders =
        activeRemindersResult.status === 'fulfilled' && !activeRemindersResult.value.error
          ? activeRemindersResult.value.count || 0
          : 0;

      setStats({
        totalVehicles,
        thisMonthRecords,
        upcomingReminders: manualReminders + activeReminders,
        totalSpent,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                  Welcome back, {profile?.name}!
                </h2>
                <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span className="font-medium">{companyInfo?.name}</span>
                    <span className="mx-2">•</span>
                    <span className="capitalize">{profile?.role}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex md:ml-4 md:mt-0">
                <Link
                  href="/maintenance/new"
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Log Maintenance
                </Link>
              </div>
            </div>

            <div className="mt-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
                  <dt>
                    <div className="absolute rounded-md bg-blue-500 p-3">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 18.75a1.5 1.5 0 01-3 0V5.25a1.5 1.5 0 013 0v13.5z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 18.75a1.5 1.5 0 01-3 0V5.25a1.5 1.5 0 013 0v13.5z"
                        />
                      </svg>
                    </div>
                    <p className="ml-16 truncate text-sm font-medium text-gray-500">
                      Total Vehicles
                    </p>
                  </dt>
                  <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                    <p className="text-2xl font-semibold text-gray-900">
                      {loading ? '...' : stats.totalVehicles}
                    </p>
                  </dd>
                </div>

                <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
                  <dt>
                    <div className="absolute rounded-md bg-green-500 p-3">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l5.653-4.655 3.03-2.496c.14-.468.382-.891.766-1.208L21 12.177z"
                        />
                      </svg>
                    </div>
                    <p className="ml-16 truncate text-sm font-medium text-gray-500">This Month</p>
                  </dt>
                  <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                    <p className="text-2xl font-semibold text-gray-900">
                      {loading ? '...' : stats.thisMonthRecords}
                    </p>
                    <p className="ml-2 text-sm text-gray-600">maintenance records</p>
                  </dd>
                </div>

                <Link
                  href="/reminders"
                  className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 hover:shadow-md transition-shadow cursor-pointer block"
                >
                  <dt>
                    <div className="absolute rounded-md bg-yellow-500 p-3">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="ml-16 truncate text-sm font-medium text-gray-500">Upcoming</p>
                  </dt>
                  <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                    <p className="text-2xl font-semibold text-gray-900">
                      {loading ? '...' : stats.upcomingReminders}
                    </p>
                    <p className="ml-2 text-sm text-gray-600">reminders</p>
                  </dd>
                </Link>

                <div className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
                  <dt>
                    <div className="absolute rounded-md bg-red-500 p-3">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="ml-16 truncate text-sm font-medium text-gray-500">Total Spent</p>
                  </dt>
                  <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                    <p className="text-2xl font-semibold text-gray-900">
                      {loading ? '...' : formatCurrency(stats.totalSpent)}
                    </p>
                  </dd>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Link
                      href="/vehicles/new"
                      className="inline-flex flex-col items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      <svg
                        className="h-6 w-6 text-gray-400 mb-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Add Vehicle
                    </Link>
                    <Link
                      href="/maintenance/new"
                      className="inline-flex flex-col items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      <svg
                        className="h-6 w-6 text-gray-400 mb-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                      Log Service
                    </Link>
                    <Link
                      href="/maintenance/history"
                      className="inline-flex flex-col items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      <svg
                        className="h-6 w-6 text-gray-400 mb-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      View History
                    </Link>
                    <Link
                      href="/reminders"
                      className="inline-flex flex-col items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      <svg
                        className="h-6 w-6 text-gray-400 mb-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Reminders
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Recent Maintenance
                    </h3>
                    <Link
                      href="/maintenance/history"
                      className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                    >
                      View all
                    </Link>
                  </div>
                  <RecentMaintenanceList companyId={profile?.company_id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
