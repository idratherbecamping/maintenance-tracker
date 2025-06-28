'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type MaintenanceRecord = Database['public']['Tables']['mt_maintenance_records']['Row'] & {
  mt_vehicles: {
    year: number;
    make: string;
    model: string;
    license_plate: string | null;
  } | null;
  mt_users: {
    name: string;
  } | null;
  mt_maintenance_types: {
    name: string;
  } | null;
};

export default function MaintenanceHistoryPage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedType, setSelectedType] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'cost' | 'mileage'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [maintenanceTypes, setMaintenanceTypes] = useState<Array<{id: string, name: string}>>([]);
  const [employees, setEmployees] = useState<Array<{id: string, name: string}>>([]);
  const [vehicles, setVehicles] = useState<Array<{id: string, year: number, make: string, model: string, license_plate: string | null}>>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    if (profile?.company_id) {
      fetchMaintenanceHistory();
      fetchFilterOptions();
    }
  }, [profile]);

  // Handle URL parameters for vehicle filter
  useEffect(() => {
    const vehicleId = searchParams.get('vehicle');
    if (vehicleId && vehicleId !== selectedVehicle) {
      setSelectedVehicle(vehicleId);
    }
  }, [searchParams, selectedVehicle]);

  const fetchMaintenanceHistory = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('mt_maintenance_records')
        .select(`
          *,
          mt_vehicles!inner (year, make, model, license_plate, company_id),
          mt_users (name),
          mt_maintenance_types (name)
        `)
        .eq('mt_vehicles.company_id', profile.company_id)
        .order('date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching maintenance history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    if (!profile?.company_id) return;

    try {
      // Fetch maintenance types
      const { data: types, error: typesError } = await supabase
        .from('mt_maintenance_types')
        .select('id, name')
        .or(`company_id.is.null,company_id.eq.${profile.company_id}`)
        .order('name');

      if (typesError) throw typesError;
      setMaintenanceTypes(types || []);

      // Fetch employees
      const { data: users, error: usersError } = await supabase
        .from('mt_users')
        .select('id, name')
        .eq('company_id', profile.company_id)
        .order('name');

      if (usersError) throw usersError;
      setEmployees(users || []);

      // Fetch vehicles
      const { data: vehicleData, error: vehiclesError } = await supabase
        .from('mt_vehicles')
        .select('id, year, make, model, license_plate')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('year', { ascending: false })
        .order('make')
        .order('model');

      if (vehiclesError) throw vehiclesError;
      setVehicles(vehicleData || []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Filter and sort records
  const filteredAndSortedRecords = useMemo(() => {
    let filtered = records.filter(record => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          (record.mt_maintenance_types?.name || record.custom_type || '').toLowerCase().includes(searchLower) ||
          (record.description || '').toLowerCase().includes(searchLower) ||
          (record.mt_vehicles ? `${record.mt_vehicles.year} ${record.mt_vehicles.make} ${record.mt_vehicles.model}` : '').toLowerCase().includes(searchLower) ||
          (record.mt_users?.name || '').toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (dateRange.from) {
        if (new Date(record.date) < new Date(dateRange.from)) return false;
      }
      if (dateRange.to) {
        if (new Date(record.date) > new Date(dateRange.to)) return false;
      }

      // Maintenance type filter
      if (selectedType) {
        const recordType = record.type_id || record.custom_type;
        if (recordType !== selectedType) return false;
      }

      // Employee filter
      if (selectedEmployee && record.user_id !== selectedEmployee) return false;

      // Vehicle filter
      if (selectedVehicle && record.vehicle_id !== selectedVehicle) return false;

      return true;
    });

    // Sort records
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'cost':
          aValue = a.cost || 0;
          bValue = b.cost || 0;
          break;
        case 'mileage':
          aValue = a.mileage;
          bValue = b.mileage;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [records, searchTerm, dateRange, selectedType, selectedEmployee, selectedVehicle, sortBy, sortOrder]);

  const totalCost = useMemo(() => {
    return filteredAndSortedRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
  }, [filteredAndSortedRecords]);

  const clearFilters = () => {
    setSearchTerm('');
    setDateRange({ from: '', to: '' });
    setSelectedType('');
    setSelectedEmployee('');
    setSelectedVehicle('');
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
                  Maintenance History
                </h2>
                <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    {filteredAndSortedRecords.length} of {records.length} records
                    {selectedVehicle && (
                      <span className="ml-4 text-blue-600 font-medium">
                        • {vehicles.find(v => v.id === selectedVehicle)?.year} {vehicles.find(v => v.id === selectedVehicle)?.make} {vehicles.find(v => v.id === selectedVehicle)?.model}
                      </span>
                    )}
                    {filteredAndSortedRecords.length > 0 && (
                      <span className="ml-4 font-medium">
                        Total: {formatCurrency(totalCost)}
                      </span>
                    )}
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

            {loading ? (
              <div className="mt-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-500">Loading maintenance records...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="mt-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No maintenance records</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by logging your first maintenance record.
                </p>
                <div className="mt-6">
                  <Link
                    href="/maintenance/new"
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Log Maintenance
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                {/* Vehicle Filter - Most Important */}
                <div className="bg-white shadow rounded-lg border-l-4 border-blue-500">
                  <div className="px-4 py-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">Filter by Vehicle</h3>
                      {selectedVehicle && (
                        <button
                          onClick={() => setSelectedVehicle('')}
                          className="text-sm text-blue-600 hover:text-blue-500"
                        >
                          Show all vehicles
                        </button>
                      )}
                    </div>
                    
                    <select
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base"
                    >
                      <option value="">All vehicles ({vehicles.length})</option>
                      {vehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.year} {vehicle.make} {vehicle.model}
                          {vehicle.license_plate && ` (${vehicle.license_plate})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Other Filters */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Additional Filters</h3>
                      <button
                        onClick={clearFilters}
                        className="text-sm text-blue-600 hover:text-blue-500"
                      >
                        Clear all
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {/* Search */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Search
                        </label>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search records..."
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      {/* Date From */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          From Date
                        </label>
                        <input
                          type="date"
                          value={dateRange.from}
                          onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      {/* Date To */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          To Date
                        </label>
                        <input
                          type="date"
                          value={dateRange.to}
                          onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      {/* Maintenance Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={selectedType}
                          onChange={(e) => setSelectedType(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                          <option value="">All types</option>
                          {maintenanceTypes.map(type => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Employee */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee
                        </label>
                        <select
                          value={selectedEmployee}
                          onChange={(e) => setSelectedEmployee(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                          <option value="">All employees</option>
                          {employees.map(employee => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sort By */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sort By
                        </label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'date' | 'cost' | 'mileage')}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                          <option value="date">Date</option>
                          <option value="cost">Cost</option>
                          <option value="mileage">Mileage</option>
                        </select>
                      </div>

                      {/* Sort Order */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Order
                        </label>
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                          <option value="desc">Newest First</option>
                          <option value="asc">Oldest First</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Records */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    {filteredAndSortedRecords.length === 0 ? (
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
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No matching records</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Try adjusting your filters or search terms.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {filteredAndSortedRecords.map((record) => (
                        <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-lg font-medium text-gray-900">
                                  {record.mt_maintenance_types?.name || record.custom_type || 'Maintenance'}
                                </h3>
                                {record.cost && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {formatCurrency(record.cost)}
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">Vehicle:</span>{' '}
                                {record.mt_vehicles && (
                                  <>
                                    {record.mt_vehicles.year} {record.mt_vehicles.make} {record.mt_vehicles.model}
                                    {record.mt_vehicles.license_plate && ` (${record.mt_vehicles.license_plate})`}
                                  </>
                                )}
                              </div>

                              {record.description && (
                                <p className="text-gray-700 mb-3">{record.description}</p>
                              )}

                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>Date: {new Date(record.date).toLocaleDateString()}</span>
                                <span>Mileage: {formatNumber(record.mileage)} mi</span>
                                <span>By: {record.mt_users?.name}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        ))}
                      </div>
                    )}
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