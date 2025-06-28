'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Database } from '@/types/database';
import { ImageUpload } from '@/components/ui/image-upload';
import { useAuth } from '@/contexts/auth-context';
import { uploadImage, deleteImage, getImageUrl, generateImagePath } from '@/lib/image-utils';

type VehicleInsert = Database['public']['Tables']['mt_vehicles']['Insert'];

const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required').max(100, 'Make is too long'),
  model: z.string().min(1, 'Model is required').max(100, 'Model is too long'),
  year: z
    .number()
    .min(1900, 'Year must be valid')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  vin: z.string().max(17, 'VIN is too long').optional().or(z.literal('')),
  license_plate: z.string().max(20, 'License plate is too long').optional().or(z.literal('')),
  current_mileage: z.number().min(0, 'Mileage must be positive'),
  asset_value: z.number().min(0, 'Asset value must be positive').optional().or(z.literal('')),
  purchase_date: z.string().optional().or(z.literal('')),
  purchase_price: z.number().min(0, 'Purchase price must be positive').optional().or(z.literal('')),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  initialData?: Partial<VehicleFormData> & { image_url?: string | null };
  onSubmit: (
    data: Omit<VehicleInsert, 'company_id'> & { imageFile?: File | null; removeImage?: boolean }
  ) => void;
  loading: boolean;
  submitLabel: string;
}

export function VehicleForm({ initialData, onSubmit, loading, submitLabel }: VehicleFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: initialData || {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      vin: '',
      license_plate: '',
      current_mileage: 0,
      asset_value: '',
      purchase_date: '',
      purchase_price: '',
    },
  });

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    setRemoveImage(false);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setRemoveImage(true);
  };

  const onFormSubmit = (data: VehicleFormData) => {
    const submitData: Omit<VehicleInsert, 'company_id'> & {
      imageFile?: File | null;
      removeImage?: boolean;
    } = {
      make: data.make,
      model: data.model,
      year: data.year,
      current_mileage: data.current_mileage,
      vin: data.vin || null,
      license_plate: data.license_plate || null,
      asset_value: data.asset_value ? Number(data.asset_value) : null,
      purchase_date: data.purchase_date || null,
      purchase_price: data.purchase_price ? Number(data.purchase_price) : null,
      imageFile,
      removeImage,
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="make" className="block text-sm font-medium text-gray-700">
            Make *
          </label>
          <input
            type="text"
            {...register('make')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., Toyota, Ford, Honda"
          />
          {errors.make && <p className="mt-1 text-sm text-red-600">{errors.make.message}</p>}
        </div>

        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700">
            Model *
          </label>
          <input
            type="text"
            {...register('model')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., Camry, F-150, Civic"
          />
          {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>}
        </div>

        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
            Year *
          </label>
          <input
            type="number"
            {...register('year', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="1900"
            max={new Date().getFullYear() + 1}
          />
          {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>}
        </div>

        <div>
          <label htmlFor="current_mileage" className="block text-sm font-medium text-gray-700">
            Current Mileage *
          </label>
          <input
            type="number"
            {...register('current_mileage', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="0"
            placeholder="e.g., 50000"
          />
          {errors.current_mileage && (
            <p className="mt-1 text-sm text-red-600">{errors.current_mileage.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="vin" className="block text-sm font-medium text-gray-700">
            VIN
          </label>
          <input
            type="text"
            {...register('vin')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="17-character VIN"
            maxLength={17}
          />
          {errors.vin && <p className="mt-1 text-sm text-red-600">{errors.vin.message}</p>}
        </div>

        <div>
          <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700">
            License Plate
          </label>
          <input
            type="text"
            {...register('license_plate')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., ABC-123"
          />
          {errors.license_plate && (
            <p className="mt-1 text-sm text-red-600">{errors.license_plate.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="asset_value" className="block text-sm font-medium text-gray-700">
            Current Asset Value ($)
          </label>
          <input
            type="number"
            {...register('asset_value', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="0"
            step="0.01"
            placeholder="e.g., 25000"
          />
          {errors.asset_value && (
            <p className="mt-1 text-sm text-red-600">{errors.asset_value.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="purchase_price" className="block text-sm font-medium text-gray-700">
            Purchase Price ($)
          </label>
          <input
            type="number"
            {...register('purchase_price', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="0"
            step="0.01"
            placeholder="e.g., 30000"
          />
          {errors.purchase_price && (
            <p className="mt-1 text-sm text-red-600">{errors.purchase_price.message}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700">
            Purchase Date
          </label>
          <input
            type="date"
            {...register('purchase_date')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.purchase_date && (
            <p className="mt-1 text-sm text-red-600">{errors.purchase_date.message}</p>
          )}
        </div>
      </div>

      {/* Vehicle Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Image</label>
        <ImageUpload
          currentImage={getImageUrl('vehicle-images', initialData?.image_url)}
          onImageChange={handleImageChange}
          onImageRemove={handleImageRemove}
          disabled={loading}
          placeholder="Upload vehicle image"
          className="max-w-md"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
