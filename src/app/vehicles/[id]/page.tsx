'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type Vehicle = Database['public']['Tables']['mt_vehicles']['Row'];
type MaintenanceRecord = Database['public']['Tables']['mt_maintenance_records']['Row'] & {
  mt_users: { name: string } | null;
  mt_maintenance_types: { name: string } | null;
};

export default function VehicleDetailPage() {
  const params = useParams();
  const vehicleId = params.id as string;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (vehicleId) {
      fetchVehicleData();
    }
  }, [vehicleId, profile]);

  const fetchVehicleData = async () => {
    if (!profile?.company_id) return;

    try {
      // Fetch vehicle details
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('mt_vehicles')
        .select('*')
        .eq('id', vehicleId)
        .eq('company_id', profile.company_id)
        .single();

      if (vehicleError) throw vehicleError;
      setVehicle(vehicleData);

      // Fetch maintenance records
      const { data: recordsData, error: recordsError } = await supabase
        .from('mt_maintenance_records')
        .select(`
          *,
          mt_users (name),
          mt_maintenance_types (name)
        `)
        .eq('vehicle_id', vehicleId)
        .order('date', { ascending: false });

      if (recordsError) throw recordsError;
      setMaintenanceRecords(recordsData || []);
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-500">Loading vehicle details...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!vehicle) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h3 className="mt-2 text-sm font-medium text-gray-900">Vehicle not found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  The vehicle you're looking for doesn't exist or you don't have access to it.
                </p>
                <div className="mt-6">
                  <Link
                    href="/vehicles"
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                  >
                    Back to Vehicles
                  </Link>
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
            <div className="md:flex md:items-center md:justify-between mb-8">
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h2>
                <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                  {vehicle.license_plate && (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="font-medium">License:</span>
                      <span className="ml-1">{vehicle.license_plate}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 md:ml-4 md:mt-0">
                <Link
                  href={`/maintenance/history?vehicle=${vehicle.id}`}
                  className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View All Maintenance
                </Link>
                <Link
                  href={`/maintenance/new?vehicle=${vehicle.id}`}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Log Maintenance
                </Link>
                <Link
                  href={`/vehicles/${vehicle.id}/edit`}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Vehicle
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Vehicle Details</h3>
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Current Mileage</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatNumber(vehicle.current_mileage)} mi</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Asset Value</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatCurrency(vehicle.asset_value)}</dd>
                      </div>
                      {vehicle.vin && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">VIN</dt>
                          <dd className="mt-1 text-sm text-gray-900 break-all">{vehicle.vin}</dd>
                        </div>
                      )}
                      {vehicle.purchase_date && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Purchase Date</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {new Date(vehicle.purchase_date).toLocaleDateString()}
                          </dd>
                        </div>
                      )}
                      {vehicle.purchase_price && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Purchase Price</dt>
                          <dd className="mt-1 text-sm text-gray-900">{formatCurrency(vehicle.purchase_price)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance History</h3>
                    {maintenanceRecords.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500">No maintenance records yet.</p>
                        <Link
                          href={`/maintenance/new?vehicle=${vehicle.id}`}
                          className="mt-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                        >
                          Log First Maintenance
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {maintenanceRecords.map((record) => (
                          <div key={record.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {record.mt_maintenance_types?.name || record.custom_type || 'Maintenance'}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {record.description}
                                </p>
                                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                                  <span>Date: {new Date(record.date).toLocaleDateString()}</span>
                                  <span>Mileage: {formatNumber(record.mileage)} mi</span>
                                  {record.cost && <span>Cost: {formatCurrency(record.cost)}</span>}
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
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}