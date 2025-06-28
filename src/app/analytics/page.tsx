'use client';

import { useState, useEffect, useMemo } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type MaintenanceRecord = Database['public']['Tables']['mt_maintenance_records']['Row'] & {
  mt_vehicles: {
    id: string;
    year: number;
    make: string;
    model: string;
    license_plate: string | null;
  } | null;
  mt_users: {
    id: string;
    name: string;
  } | null;
  mt_maintenance_types: {
    id: string;
    name: string;
  } | null;
};

type Vehicle = Database['public']['Tables']['mt_vehicles']['Row'];
type Employee = Database['public']['Tables']['mt_users']['Row'];

interface AnalyticsData {
  costByType: Array<{ name: string; value: number; percentage: number }>;
  costByVehicle: Array<{ name: string; value: number; records: number }>;
  costByEmployee: Array<{ name: string; value: number; records: number }>;
  monthlyTrends: Array<{ month: string; cost: number; records: number }>;
  topExpensiveVehicles: Array<{ name: string; cost: number; costPerRecord: number }>;
}

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#EC4899',
  '#6366F1',
];

export default function AnalyticsPage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'employees'>('overview');
  const { profile } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (profile?.company_id) {
      fetchAnalyticsData();
    }
  }, [profile]);

  const fetchAnalyticsData = async () => {
    if (!profile?.company_id) return;

    try {
      // Fetch maintenance records with relationships
      const { data: recordsData, error: recordsError } = await supabase
        .from('mt_maintenance_records')
        .select(
          `
          *,
          mt_vehicles!inner (id, year, make, model, license_plate, company_id),
          mt_users (id, name),
          mt_maintenance_types (id, name)
        `
        )
        .eq('mt_vehicles.company_id', profile.company_id)
        .order('date', { ascending: false });

      if (recordsError) throw recordsError;

      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('mt_vehicles')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('is_active', true);

      if (vehiclesError) throw vehiclesError;

      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('mt_users')
        .select('*')
        .eq('company_id', profile.company_id);

      if (employeesError) throw employeesError;

      setRecords(recordsData || []);
      setVehicles(vehiclesData || []);
      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter records based on selected filters
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // Vehicle filter
      if (selectedVehicle && record.vehicle_id !== selectedVehicle) return false;

      // Date range filter
      if (dateRange.from && new Date(record.date) < new Date(dateRange.from)) return false;
      if (dateRange.to && new Date(record.date) > new Date(dateRange.to)) return false;

      return true;
    });
  }, [records, selectedVehicle, dateRange]);

  // Calculate analytics data
  const analyticsData: AnalyticsData = useMemo(() => {
    // Cost by maintenance type
    const typeMap = new Map<string, number>();
    filteredRecords.forEach((record) => {
      const type = record.mt_maintenance_types?.name || record.custom_type || 'Other';
      typeMap.set(type, (typeMap.get(type) || 0) + (record.cost || 0));
    });

    const totalCost = Array.from(typeMap.values()).reduce((sum, cost) => sum + cost, 0);
    const costByType = Array.from(typeMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalCost > 0 ? (value / totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    // Cost by vehicle
    const vehicleMap = new Map<string, { cost: number; records: number }>();
    filteredRecords.forEach((record) => {
      if (record.mt_vehicles) {
        const vehicleName = `${record.mt_vehicles.year} ${record.mt_vehicles.make} ${record.mt_vehicles.model}`;
        const current = vehicleMap.get(vehicleName) || { cost: 0, records: 0 };
        vehicleMap.set(vehicleName, {
          cost: current.cost + (record.cost || 0),
          records: current.records + 1,
        });
      }
    });

    const costByVehicle = Array.from(vehicleMap.entries())
      .map(([name, data]) => ({
        name,
        value: data.cost,
        records: data.records,
      }))
      .sort((a, b) => b.value - a.value);

    // Cost by employee
    const employeeMap = new Map<string, { cost: number; records: number }>();
    filteredRecords.forEach((record) => {
      if (record.mt_users) {
        const current = employeeMap.get(record.mt_users.name) || { cost: 0, records: 0 };
        employeeMap.set(record.mt_users.name, {
          cost: current.cost + (record.cost || 0),
          records: current.records + 1,
        });
      }
    });

    const costByEmployee = Array.from(employeeMap.entries())
      .map(([name, data]) => ({
        name,
        value: data.cost,
        records: data.records,
      }))
      .sort((a, b) => b.value - a.value);

    // Monthly trends (last 12 months)
    const monthMap = new Map<string, { cost: number; records: number }>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      monthMap.set(monthKey, { cost: 0, records: 0 });
    }

    filteredRecords.forEach((record) => {
      const monthKey = record.date.slice(0, 7);
      if (monthMap.has(monthKey)) {
        const current = monthMap.get(monthKey)!;
        monthMap.set(monthKey, {
          cost: current.cost + (record.cost || 0),
          records: current.records + 1,
        });
      }
    });

    const monthlyTrends = Array.from(monthMap.entries()).map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      cost: data.cost,
      records: data.records,
    }));

    // Top expensive vehicles
    const topExpensiveVehicles = costByVehicle.slice(0, 5).map((vehicle) => ({
      name: vehicle.name,
      cost: vehicle.value,
      costPerRecord: vehicle.records > 0 ? vehicle.value / vehicle.records : 0,
    }));

    return {
      costByType,
      costByVehicle,
      costByEmployee,
      monthlyTrends,
      topExpensiveVehicles,
    };
  }, [filteredRecords]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {/* Header Skeleton */}
              <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                  <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                </div>
              </div>

              {/* Filters Skeleton */}
              <div className="bg-white shadow rounded-lg mb-6 animate-pulse">
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation Skeleton */}
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </nav>
                </div>
              </div>

              {/* Content Skeleton */}
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <div className="ml-4">
                          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                          <div className="h-6 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                      <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between mb-8">
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                  Analytics & Insights
                </h2>
                <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    {filteredRecords.length} maintenance records analyzed
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Filter
                    </label>
                    <select
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`${
                      activeTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('vehicles')}
                    className={`${
                      activeTab === 'vehicles'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium`}
                  >
                    Vehicle Analysis
                  </button>
                  <button
                    onClick={() => setActiveTab('employees')}
                    className={`${
                      activeTab === 'employees'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium`}
                  >
                    Employee Performance
                  </button>
                </nav>
              </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">$</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Spent</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(
                            filteredRecords.reduce((sum, r) => sum + (r.cost || 0), 0)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">#</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Records</p>
                        <p className="text-2xl font-bold text-gray-900">{filteredRecords.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">Ø</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Avg per Record</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(
                            filteredRecords.length > 0
                              ? filteredRecords.reduce((sum, r) => sum + (r.cost || 0), 0) /
                                  filteredRecords.length
                              : 0
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">🏆</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Most Expensive</p>
                        <p className="text-lg font-bold text-gray-900">
                          {analyticsData.costByType[0]?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Cost by Maintenance Type Pie Chart */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Cost by Maintenance Type
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.costByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.costByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Monthly Trends */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Monthly Spending Trends
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analyticsData.monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="cost" stroke="#3B82F6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Expensive Vehicles */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Most Expensive Vehicles to Maintain
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.topExpensiveVehicles}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="cost" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Vehicle Analysis Tab */}
            {activeTab === 'vehicles' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Vehicle Cost Distribution */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Cost by Vehicle</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.costByVehicle.slice(0, 8)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.costByVehicle.slice(0, 8).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Vehicle Maintenance Frequency */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Maintenance Frequency by Vehicle
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.costByVehicle.slice(0, 6)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="records" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Individual Vehicle Analysis */}
                {selectedVehicle && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Individual Vehicle Analysis:{' '}
                      {vehicles.find((v) => v.id === selectedVehicle)?.year}{' '}
                      {vehicles.find((v) => v.id === selectedVehicle)?.make}{' '}
                      {vehicles.find((v) => v.id === selectedVehicle)?.model}
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.costByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.costByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Employee Performance Tab */}
            {activeTab === 'employees' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Employee Activity */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Maintenance Records by Employee
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.costByEmployee}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="records" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Employee Cost Management */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Cost Managed by Employee
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.costByEmployee}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Employee Performance Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Employee Performance Summary
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Records Logged
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Cost Managed
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Avg Cost per Record
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analyticsData.costByEmployee.map((employee, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {employee.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {employee.records}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(employee.value)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(
                                employee.records > 0 ? employee.value / employee.records : 0
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
