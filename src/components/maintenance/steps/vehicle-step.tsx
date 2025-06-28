'use client';

import { Database } from '@/types/database';
import { MaintenanceFormData } from '../maintenance-wizard';

type Vehicle = Database['public']['Tables']['mt_vehicles']['Row'];

interface VehicleStepProps {
  formData: MaintenanceFormData;
  updateFormData: (updates: Partial<MaintenanceFormData>) => void;
  onNext: () => void;
  vehicles: Vehicle[];
}

export function VehicleStep({ formData, updateFormData, onNext, vehicles }: VehicleStepProps) {
  const handleVehicleSelect = (vehicleId: string) => {
    updateFormData({ vehicleId });
    setTimeout(onNext, 300); // Small delay for better UX
  };

  const formatVehicle = (vehicle: Vehicle) => {
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-US').format(mileage);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Which vehicle needs maintenance?
        </h2>
        <p className="text-gray-600">
          Select the vehicle you're logging maintenance for.
        </p>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No vehicles found.</p>
          <p className="text-sm text-gray-400">
            You'll need to add a vehicle before logging maintenance.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map((vehicle) => (
            <button
              key={vehicle.id}
              onClick={() => handleVehicleSelect(vehicle.id)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-blue-500 hover:shadow-md ${
                formData.vehicleId === vehicle.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {formatVehicle(vehicle)}
                  </h3>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    {vehicle.license_plate && (
                      <span>License: {vehicle.license_plate}</span>
                    )}
                    <span>Mileage: {formatMileage(vehicle.current_mileage)}</span>
                  </div>
                </div>
                <div className="text-2xl">
                  🚗
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {formData.vehicleId && (
        <div className="mt-8 text-center">
          <button
            onClick={onNext}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Continue
            <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}