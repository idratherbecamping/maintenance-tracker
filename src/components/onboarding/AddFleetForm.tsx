'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  license_plate: z.string().optional(),
  current_mileage: z.number().min(0),
});

export type VehicleData = z.infer<typeof vehicleSchema>;

interface AddFleetFormProps {
  onSubmit: (vehicles: VehicleData[]) => void;
  loading?: boolean;
}

export function AddFleetForm({ onSubmit, loading }: AddFleetFormProps) {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      current_mileage: 0,
    },
  });

  const handleAddVehicle = (data: VehicleData) => {
    setVehicles([...vehicles, data]);
    reset({
      year: new Date().getFullYear(),
      current_mileage: 0,
    });
    setShowAddForm(false);
  };

  const handleRemoveVehicle = (index: number) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const handleFinalSubmit = () => {
    onSubmit(vehicles);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Add Your Fleet</h2>
        <p className="text-gray-600 mb-6">
          Add your vehicles to start tracking their maintenance. You can always add more vehicles later.
        </p>
      </div>

      {vehicles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Vehicles to Add</h3>
          {vehicles.map((vehicle, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div>
                <p className="font-medium">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
                {vehicle.license_plate && (
                  <p className="text-sm text-gray-600">License: {vehicle.license_plate}</p>
                )}
                <p className="text-sm text-gray-500">
                  Current Mileage: {vehicle.current_mileage.toLocaleString()} miles
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveVehicle(index)}
                className="text-red-600 hover:text-red-700"
                disabled={loading}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddForm ? (
        <form onSubmit={handleSubmit(handleAddVehicle)} className="space-y-4 border p-4 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-700">
                Make
              </label>
              <input
                {...register('make')}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={loading}
              />
              {errors.make && (
                <p className="mt-1 text-sm text-red-600">{errors.make.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                Model
              </label>
              <input
                {...register('model')}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={loading}
              />
              {errors.model && (
                <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                Year
              </label>
              <input
                {...register('year', { valueAsNumber: true })}
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={loading}
              />
              {errors.year && (
                <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700">
                License Plate (Optional)
              </label>
              <input
                {...register('license_plate')}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="current_mileage" className="block text-sm font-medium text-gray-700">
                Current Mileage
              </label>
              <input
                {...register('current_mileage', { valueAsNumber: true })}
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={loading}
              />
              {errors.current_mileage && (
                <p className="mt-1 text-sm text-red-600">{errors.current_mileage.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              Add Vehicle
            </button>
            <button
              type="button"
              onClick={() => {
                reset({
                  year: new Date().getFullYear(),
                  current_mileage: 0,
                });
                setShowAddForm(false);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            + Add Vehicle
          </button>
        </div>
      )}

      {vehicles.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-gray-500">
          <p>No vehicles added yet.</p>
          <p className="text-sm mt-2">You can always add vehicles later from the fleet page.</p>
        </div>
      )}
    </div>
  );
}