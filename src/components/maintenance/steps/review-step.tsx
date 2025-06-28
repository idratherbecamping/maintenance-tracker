'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { MaintenanceFormData } from '../maintenance-wizard';
import { Database } from '@/types/database';

type Vehicle = Database['public']['Tables']['mt_vehicles']['Row'];
type MaintenanceType = Database['public']['Tables']['mt_maintenance_types']['Row'];

interface ReviewStepProps {
  formData: MaintenanceFormData;
  onPrevious: () => void;
  vehicles: Vehicle[];
  maintenanceTypes: MaintenanceType[];
  onComplete: () => void;
}

export function ReviewStep({ 
  formData, 
  onPrevious, 
  vehicles, 
  maintenanceTypes, 
  onComplete 
}: ReviewStepProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { profile } = useAuth();
  const supabase = createClient();

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
  const selectedType = maintenanceTypes.find(t => t.id === formData.maintenanceTypeId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const uploadImages = async (maintenanceId: string) => {
    const uploadPromises = formData.images.map(async (image, index) => {
      const fileExt = image.name.split('.').pop();
      const fileName = `${maintenanceId}-${index}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('maintenance-images')
        .upload(filePath, image);

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data } = supabase.storage
        .from('maintenance-images')
        .getPublicUrl(filePath);

      return {
        maintenance_id: maintenanceId,
        url: data.publicUrl,
        caption: `Maintenance photo ${index + 1}`,
      };
    });

    const imageRecords = await Promise.all(uploadPromises);
    
    if (imageRecords.length > 0) {
      const { error } = await supabase
        .from('mt_maintenance_images')
        .insert(imageRecords);
      
      if (error) throw error;
    }
  };

  const handleSubmit = async () => {
    if (!profile?.id) {
      setError('User not found');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Create maintenance record
      const { data: maintenanceRecord, error: maintenanceError } = await supabase
        .from('mt_maintenance_records')
        .insert({
          vehicle_id: formData.vehicleId,
          user_id: profile.id,
          mileage: formData.mileage,
          type_id: formData.maintenanceTypeId || null,
          custom_type: formData.customType || null,
          description: formData.description || null,
          cost: formData.cost || null,
          date: formData.date,
        })
        .select()
        .single();

      if (maintenanceError) throw maintenanceError;

      // Upload images if any
      if (formData.images.length > 0) {
        await uploadImages(maintenanceRecord.id);
      }

      // Create recommendations if any
      if (formData.recommendations.length > 0) {
        const recommendationRecords = formData.recommendations.map(rec => ({
          maintenance_id: maintenanceRecord.id,
          description: rec.description,
          recommended_date: rec.recommendedDate || null,
        }));

        const { error: recommendationError } = await supabase
          .from('mt_maintenance_recommendations')
          .insert(recommendationRecords);

        if (recommendationError) throw recommendationError;
      }

      // Update vehicle mileage
      const { error: vehicleError } = await supabase
        .from('mt_vehicles')
        .update({ current_mileage: formData.mileage })
        .eq('id', formData.vehicleId);

      if (vehicleError) throw vehicleError;

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save maintenance record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Review and Submit
        </h2>
        <p className="text-gray-600">
          Double-check your maintenance record before submitting.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Vehicle */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Vehicle</h3>
            <p className="text-gray-700">
              {selectedVehicle && `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
              {selectedVehicle?.license_plate && ` (${selectedVehicle.license_plate})`}
            </p>
          </div>

          {/* Maintenance Type */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Maintenance Type</h3>
            <p className="text-gray-700">
              {selectedType?.name || formData.customType}
            </p>
          </div>

          {/* Mileage */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Mileage</h3>
            <p className="text-gray-700">{formatNumber(formData.mileage)} miles</p>
          </div>

          {/* Cost */}
          {formData.cost && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Cost</h3>
              <p className="text-gray-700">{formatCurrency(formData.cost)}</p>
            </div>
          )}

          {/* Description */}
          {formData.description && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{formData.description}</p>
            </div>
          )}

          {/* Images */}
          {formData.images.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Photos ({formData.images.length})</h3>
              <div className="grid grid-cols-3 gap-2">
                {formData.images.slice(0, 6).map((image, index) => (
                  <div key={index} className="aspect-square bg-gray-100 rounded overflow-hidden">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {formData.images.length > 6 && (
                  <div className="aspect-square bg-gray-100 rounded flex items-center justify-center text-gray-500 text-sm">
                    +{formData.images.length - 6} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {formData.recommendations.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Future Recommendations ({formData.recommendations.length})</h3>
              <div className="space-y-2">
                {formData.recommendations.map((rec, index) => (
                  <div key={index} className="text-gray-700">
                    <p>• {rec.description}</p>
                    {rec.recommendedDate && (
                      <p className="text-sm text-gray-500 ml-4">
                        Due: {new Date(rec.recommendedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Date</h3>
            <p className="text-gray-700">{new Date(formData.date).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={onPrevious}
            disabled={submitting}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
          >
            <svg className="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5 5-5M18 12H6" />
            </svg>
            Back
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                Submit Maintenance Record
                <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}