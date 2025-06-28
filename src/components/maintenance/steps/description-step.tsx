'use client';

import { useState } from 'react';
import { MaintenanceFormData } from '../maintenance-wizard';

interface DescriptionStepProps {
  formData: MaintenanceFormData;
  updateFormData: (updates: Partial<MaintenanceFormData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function DescriptionStep({ formData, updateFormData, onNext, onPrevious }: DescriptionStepProps) {
  const [description, setDescription] = useState(formData.description || '');

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    updateFormData({ description: value });
  };

  const handleNext = () => {
    onNext();
  };

  const handleSkip = () => {
    updateFormData({ description: '' });
    onNext();
  };

  const exampleSuggestions = [
    "Changed oil and oil filter. Used 5W-30 synthetic oil.",
    "Rotated all four tires. Checked tire pressure and tread depth.",
    "Replaced front brake pads and resurfaced rotors. Bled brake system.",
    "Replaced air filter and cabin filter. Cleaned air intake.",
    "Full inspection completed. All systems functioning normally.",
  ];

  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tell us more about the work
        </h2>
        <p className="text-gray-600">
          Add details about what was done (optional but recommended).
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <textarea
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="Describe the maintenance work performed, parts used, any issues found, etc."
            autoFocus
          />
          <div className="mt-2 text-right text-sm text-gray-500">
            {description.length} characters
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showSuggestions ? 'Hide' : 'Show'} example descriptions
          </button>
          
          {showSuggestions && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-600 font-medium">Examples:</p>
              {exampleSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleDescriptionChange(suggestion)}
                  className="block w-full text-left text-sm text-gray-600 p-2 rounded border hover:bg-gray-50 transition-colors"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>💡 Good descriptions help track maintenance patterns and warranty claims</p>
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

        <div className="space-x-3">
          <button
            onClick={handleSkip}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Skip
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
    </div>
  );
}