'use client';

import { useState } from 'react';
import { MaintenanceFormData } from '../maintenance-wizard';

interface CostStepProps {
  formData: MaintenanceFormData;
  updateFormData: (updates: Partial<MaintenanceFormData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function CostStep({ formData, updateFormData, onNext, onPrevious }: CostStepProps) {
  const [cost, setCost] = useState(formData.cost?.toString() || '');
  const [skipCost, setSkipCost] = useState(!formData.cost);

  const handleCostChange = (value: string) => {
    setCost(value);
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0) {
      updateFormData({ cost: numericValue });
      setSkipCost(false);
    } else if (value === '') {
      updateFormData({ cost: undefined });
    }
  };

  const handleSkipToggle = () => {
    if (!skipCost) {
      setSkipCost(true);
      setCost('');
      updateFormData({ cost: undefined });
    } else {
      setSkipCost(false);
    }
  };

  const handleNext = () => {
    if (skipCost) {
      updateFormData({ cost: undefined });
    }
    onNext();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numericValue);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          How much did it cost?
        </h2>
        <p className="text-gray-600">
          Enter the total cost for this maintenance (optional).
        </p>
      </div>

      <div className="max-w-md mx-auto">
        {!skipCost ? (
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-2xl">
              $
            </div>
            <input
              type="number"
              value={cost}
              onChange={(e) => handleCostChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full text-center text-3xl font-bold py-4 pl-12 pr-6 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              min="0"
              step="0.01"
              autoFocus
            />
            {cost && (
              <div className="mt-2 text-center text-sm text-gray-500">
                {formatCurrency(cost)}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💸</div>
            <p className="text-gray-500">Cost will be recorded as unknown</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={handleSkipToggle}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {skipCost ? '← Enter cost instead' : 'Skip cost (record as unknown)'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 Include parts, labor, taxes, and fees</p>
        </div>
      </div>

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

        <button
          onClick={handleNext}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Continue
          <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
          </svg>
        </button>
      </div>
    </div>
  );
}