'use client';

import Link from 'next/link';
import { Database } from '@/types/database';
import { getImageUrl } from '@/lib/image-utils';

type Vehicle = Database['public']['Tables']['mt_vehicles']['Row'];

interface VehicleCardProps {
  vehicle: Vehicle;
  onDelete: (vehicleId: string) => void;
}

export function VehicleCard({ vehicle, onDelete }: VehicleCardProps) {
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

  const vehicleImageUrl = getImageUrl('vehicle-images', vehicle.image_url);

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      {/* Vehicle Image */}
      {vehicleImageUrl ? (
        <div className="aspect-w-16 aspect-h-9">
          <img
            src={vehicleImageUrl}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="w-full h-48 object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden h-48 bg-gray-100 flex items-center justify-center">
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
        </div>
      ) : (
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>
      )}

      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
              {vehicle.license_plate && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span className="font-medium">License:</span>
                  <span className="ml-1">{vehicle.license_plate}</span>
                </div>
              )}
              {vehicle.vin && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span className="font-medium">VIN:</span>
                  <span className="ml-1 truncate">{vehicle.vin}</span>
                </div>
              )}
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <div className="relative">
              <button
                type="button"
                className="bg-white rounded-full flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => onDelete(vehicle.id)}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Current Mileage</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatNumber(vehicle.current_mileage)} mi
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Asset Value</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatCurrency(vehicle.asset_value)}</dd>
          </div>
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
              <dd className="mt-1 text-sm text-gray-900">
                {formatCurrency(vehicle.purchase_price)}
              </dd>
            </div>
          )}
        </div>

        <div className="mt-6 flex space-x-3">
          <Link
            href={`/vehicles/${vehicle.id}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            View Details
          </Link>
          <Link
            href={`/vehicles/${vehicle.id}/edit`}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 text-center px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}
