'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { VehicleForm } from '@/components/vehicle/vehicle-form';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { uploadImage, generateImagePath } from '@/lib/image-utils';
import { Database } from '@/types/database';

type VehicleInsert = Database['public']['Tables']['mt_vehicles']['Insert'];

export default function NewVehiclePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (
    vehicleData: Omit<VehicleInsert, 'company_id'> & {
      imageFile?: File | null;
      removeImage?: boolean;
    }
  ) => {
    if (!profile?.company_id || !profile?.id) {
      setError('No company ID found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let imageUrl = null;

      // Upload image if provided
      if (vehicleData.imageFile) {
        const imagePath = generateImagePath(profile.id, vehicleData.imageFile.name);
        await uploadImage(vehicleData.imageFile, 'vehicle-images', imagePath);
        imageUrl = imagePath;
      }

      // Create vehicle data without the extra fields
      const { imageFile, removeImage, ...vehicleInsertData } = vehicleData;

      const { error: insertError } = await supabase.from('mt_vehicles').insert({
        ...vehicleInsertData,
        company_id: profile.company_id,
        image_url: imageUrl,
      });

      if (insertError) throw insertError;

      router.push('/vehicles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Add New Vehicle</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Enter the details of the vehicle you want to track.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <VehicleForm onSubmit={handleSubmit} loading={loading} submitLabel="Add Vehicle" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
