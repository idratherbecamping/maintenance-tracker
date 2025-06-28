'use client';

import { useState } from 'react';
import { MaintenanceFormData } from '../maintenance-wizard';
import { Database } from '@/types/database';

type MaintenanceType = Database['public']['Tables']['mt_maintenance_types']['Row'];

interface MaintenanceTypeStepProps {
  formData: MaintenanceFormData;
  updateFormData: (updates: Partial<MaintenanceFormData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  maintenanceTypes: MaintenanceType[];
}

export function MaintenanceTypeStep({ 
  formData, 
  updateFormData, 
  onNext, 
  onPrevious, 
  maintenanceTypes 
}: MaintenanceTypeStepProps) {
  const [showCustom, setShowCustom] = useState(!!formData.customType);
  const [customType, setCustomType] = useState(formData.customType || '');

  const handleTypeSelect = (typeId: string) => {
    updateFormData({ 
      maintenanceTypeId: typeId,
      customType: undefined 
    });
    setShowCustom(false);
    setTimeout(onNext, 300);
  };

  const handleCustomTypeChange = (value: string) => {
    setCustomType(value);
    updateFormData({ 
      customType: value,
      maintenanceTypeId: undefined 
    });
  };

  const handleCustomSubmit = () => {
    if (customType.trim()) {
      onNext();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customType.trim()) {
      handleCustomSubmit();
    }
  };

  const typeEmojis: Record<string, string> = {
    'Oil Change': '🛢️',
    'Tire Rotation': '🔄',
    'Brake Service': '🛑',
    'Air Filter Replacement': '🌪️',
    'Transmission Service': '⚙️',
    'Coolant Flush': '❄️',
    'Battery Replacement': '🔋',
    'Spark Plug Replacement': '⚡',
    'Wheel Alignment': '🎯',
    'Inspection': '🔍',
  };

  const getTypeEmoji = (typeName: string) => {
    return typeEmojis[typeName] || '🔧';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What type of maintenance?
        </h2>
        <p className="text-gray-600">
          Select a common maintenance type or enter a custom one.
        </p>
      </div>

      {!showCustom ? (
        <div className="space-y-3">
          {maintenanceTypes
            .filter(type => !type.is_custom)
            .map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-blue-500 hover:shadow-md ${
                  formData.maintenanceTypeId === type.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getTypeEmoji(type.name)}</span>
                    <span className="font-medium text-gray-900">{type.name}</span>
                  </div>
                </div>
              </button>
            ))}

          <button
            onClick={() => setShowCustom(true)}
            className="w-full text-left p-4 rounded-lg border-2 border-dashed border-gray-300 transition-all hover:border-blue-500 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✏️</span>
                <span className="font-medium text-gray-700">Custom maintenance type</span>
              </div>
            </div>
          </button>
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <label htmlFor="customType" className="block text-sm font-medium text-gray-700 mb-2">
              Enter custom maintenance type
            </label>
            <input
              id="customType"
              type="text"
              value={customType}
              onChange={(e) => handleCustomTypeChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Engine tune-up, Windshield replacement"
              autoFocus
            />
          </div>

          <button
            onClick={() => {
              setShowCustom(false);
              setCustomType('');
              updateFormData({ customType: undefined });
            }}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Back to common types
          </button>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          onClick={onPrevious}
          className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg className="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5 5-5M18 12H6" />
          </svg>
          Back
        </button>

        {(formData.maintenanceTypeId || (showCustom && customType.trim())) && (
          <button
            onClick={showCustom ? handleCustomSubmit : onNext}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Continue
            <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}