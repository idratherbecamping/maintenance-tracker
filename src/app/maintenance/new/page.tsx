'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { MaintenanceWizard } from '@/components/maintenance/maintenance-wizard';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

export const dynamic = 'force-dynamic';

type Vehicle = Database['public']['Tables']['mt_vehicles']['Row'];
type MaintenanceType = Database['public']['Tables']['mt_maintenance_types']['Row'];

export default function NewMaintenancePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVehicleId = searchParams.get('vehicle');
  const supabase = createClient();

  useEffect(() => {
    fetchInitialData();
  }, [profile]);

  const fetchInitialData = async () => {
    if (!profile?.company_id) return;

    try {
      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('mt_vehicles')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('make', { ascending: true });

      if (vehiclesError) throw vehiclesError;

      // Fetch maintenance types (default and company-specific)
      const { data: typesData, error: typesError } = await supabase
        .from('mt_maintenance_types')
        .select('*')
        .or(`company_id.is.null,company_id.eq.${profile.company_id}`)
        .order('name', { ascending: true });

      if (typesError) throw typesError;

      setVehicles(vehiclesData || []);
      setMaintenanceTypes(typesData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push('/maintenance/history');
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MaintenanceWizard
        vehicles={vehicles}
        maintenanceTypes={maintenanceTypes}
        preselectedVehicleId={preselectedVehicleId}
        onComplete={handleComplete}
      />
    </ProtectedRoute>
  );
}
