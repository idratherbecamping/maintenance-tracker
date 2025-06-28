'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { VehicleForm } from '@/components/vehicle/vehicle-form';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { uploadImage, deleteImage, generateImagePath } from '@/lib/image-utils';
import { Database } from '@/types/database';

type Vehicle = Database['public']['Tables']['mt_vehicles']['Row'];
type VehicleUpdate = Database['public']['Tables']['mt_vehicles']['Update'];

export default function EditVehiclePage() {
  const params = useParams();
  const vehicleId = params.id as string;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (vehicleId) {
      fetchVehicle();
    }
  }, [vehicleId, profile]);

  const fetchVehicle = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('mt_vehicles')
        .select('*')
        .eq('id', vehicleId)
        .eq('company_id', profile.company_id)
        .single();

      if (fetchError) throw fetchError;
      setVehicle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicle');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (
    vehicleData: Omit<VehicleUpdate, 'company_id'> & {
      imageFile?: File | null;
      removeImage?: boolean;
    }
  ) => {
    if (!profile?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let imageUrl = vehicle?.image_url;

      // Handle image upload/removal
      if (vehicleData.removeImage && vehicle?.image_url) {
        // Delete existing image
        await deleteImage('vehicle-images', vehicle.image_url);
        imageUrl = null;
      } else if (vehicleData.imageFile) {
        // Delete old image if it exists
        if (vehicle?.image_url) {
          await deleteImage('vehicle-images', vehicle.image_url);
        }

        // Upload new image
        const imagePath = generateImagePath(profile.id, vehicleData.imageFile.name);
        await uploadImage(vehicleData.imageFile, 'vehicle-images', imagePath);
        imageUrl = imagePath;
      }

      // Create update data without the extra fields
      const { imageFile, removeImage, ...vehicleUpdateData } = vehicleData;

      const { error: updateError } = await supabase
        .from('mt_vehicles')
        .update({
          ...vehicleUpdateData,
          image_url: imageUrl,
        })
        .eq('id', vehicleId);

      if (updateError) throw updateError;

      router.push(`/vehicles/${vehicleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="py-10">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-500">Loading vehicle...</p>
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
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h3 className="mt-2 text-sm font-medium text-gray-900">Vehicle not found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  The vehicle you're trying to edit doesn't exist or you don't have access to it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const initialData = {
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    vin: vehicle.vin || '',
    license_plate: vehicle.license_plate || '',
    current_mileage: vehicle.current_mileage,
    asset_value: vehicle.asset_value || ('' as const),
    purchase_date: vehicle.purchase_date || '',
    purchase_price: vehicle.purchase_price || ('' as const),
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="py-10">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Edit Vehicle</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Update the details of your {vehicle.year} {vehicle.make} {vehicle.model}.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <VehicleForm
                  initialData={initialData}
                  onSubmit={handleSubmit}
                  loading={loading}
                  submitLabel="Update Vehicle"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
