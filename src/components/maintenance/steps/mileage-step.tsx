'use client';

import { useState } from 'react';
import { MaintenanceFormData } from '../maintenance-wizard';
import { Database } from '@/types/database';

type Vehicle = Database['public']['Tables']['mt_vehicles']['Row'];

interface MileageStepProps {
  formData: MaintenanceFormData;
  updateFormData: (updates: Partial<MaintenanceFormData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  selectedVehicle?: Vehicle;
}

export function MileageStep({
  formData,
  updateFormData,
  onNext,
  onPrevious,
  selectedVehicle,
}: MileageStepProps) {
  const [mileage, setMileage] = useState(formData.mileage?.toString() || '');
  const [error, setError] = useState('');

  const handleMileageChange = (value: string) => {
    setMileage(value);
    setError('');

    const numericValue = parseInt(value);
    if (!isNaN(numericValue)) {
      updateFormData({ mileage: numericValue });
    }
  };

  const handleNext = () => {
    const numericMileage = parseInt(mileage);

    if (!mileage || isNaN(numericMileage)) {
      setError('Please enter a valid mileage');
      return;
    }

    if (selectedVehicle && numericMileage < selectedVehicle.current_mileage) {
      setError(
        `Mileage cannot be less than current vehicle mileage (${formatNumber(selectedVehicle.current_mileage)})`
      );
      return;
    }

    if (numericMileage < 0) {
      setError('Mileage cannot be negative');
      return;
    }

    updateFormData({ mileage: numericMileage });
    onNext();
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What's the current mileage?</h2>
        <p className="text-gray-600">Enter the vehicle's current odometer reading.</p>
        {selectedVehicle && (
          <p className="text-sm text-gray-500 mt-2">
            Last recorded: {formatNumber(selectedVehicle.current_mileage)} miles
          </p>
        )}
      </div>

      <div className="max-w-md mx-auto">
        <div className="relative">
          <input
            type="number"
            value={mileage}
            onChange={(e) => handleMileageChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className={`w-full text-center text-3xl font-bold py-4 px-6 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="0"
            min="0"
            autoFocus
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
            miles
          </div>
        </div>

        {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 Tip: Check your odometer for the exact reading</p>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onPrevious}
          className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg className="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 17l-5-5 5-5M18 12H6"
            />
          </svg>
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!mileage || !!error}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5-5 5M6 12h12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
