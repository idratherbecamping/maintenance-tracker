'use client';

import { useState } from 'react';
import { MaintenanceFormData } from '../maintenance-wizard';

interface RecommendationsStepProps {
  formData: MaintenanceFormData;
  updateFormData: (updates: Partial<MaintenanceFormData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function RecommendationsStep({
  formData,
  updateFormData,
  onNext,
  onPrevious,
}: RecommendationsStepProps) {
  const [recommendations, setRecommendations] = useState(formData.recommendations);
  const [currentRecommendation, setCurrentRecommendation] = useState({
    description: '',
    recommendedDate: '',
  });

  const addRecommendation = () => {
    if (currentRecommendation.description.trim()) {
      const newRecommendations = [...recommendations, currentRecommendation];
      setRecommendations(newRecommendations);
      updateFormData({ recommendations: newRecommendations });
      setCurrentRecommendation({ description: '', recommendedDate: '' });
    }
  };

  const removeRecommendation = (index: number) => {
    const newRecommendations = recommendations.filter((_, i) => i !== index);
    setRecommendations(newRecommendations);
    updateFormData({ recommendations: newRecommendations });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addRecommendation();
    }
  };

  const commonRecommendations = [
    'Oil change due in 3,000 miles',
    'Tire rotation needed in 5,000 miles',
    'Brake inspection recommended in 6 months',
    'Air filter replacement in 12,000 miles',
    'Transmission service due in 30,000 miles',
    'Coolant flush recommended annually',
    'Battery replacement in 2-3 years',
    'Spark plugs due in 60,000 miles',
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Any future maintenance reminders?</h2>
        <p className="text-gray-600">Add reminders for upcoming maintenance needs (optional).</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Current Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Added Reminders</h3>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-gray-900">{rec.description}</p>
                    {rec.recommendedDate && (
                      <p className="text-sm text-gray-500 mt-1">
                        Due: {new Date(rec.recommendedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeRecommendation(index)}
                    className="ml-3 text-red-500 hover:text-red-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Recommendation */}
        <div className="mb-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="recommendation"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Maintenance Recommendation
              </label>
              <textarea
                id="recommendation"
                value={currentRecommendation.description}
                onChange={(e) =>
                  setCurrentRecommendation({
                    ...currentRecommendation,
                    description: e.target.value,
                  })
                }
                onKeyPress={handleKeyPress}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={2}
                placeholder="Describe what maintenance is needed and when..."
              />
            </div>

            <div>
              <label
                htmlFor="recommendedDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Recommended Date (Optional)
              </label>
              <input
                id="recommendedDate"
                type="date"
                value={currentRecommendation.recommendedDate}
                onChange={(e) =>
                  setCurrentRecommendation({
                    ...currentRecommendation,
                    recommendedDate: e.target.value,
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <button
              onClick={addRecommendation}
              disabled={!currentRecommendation.description.trim()}
              className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Recommendation
            </button>
          </div>
        </div>

        {/* Common Recommendations */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Common Recommendations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {commonRecommendations.map((rec, index) => (
              <button
                key={index}
                onClick={() =>
                  setCurrentRecommendation({
                    ...currentRecommendation,
                    description: rec,
                  })
                }
                className="text-left text-sm text-gray-600 p-2 rounded border hover:bg-gray-50 transition-colors"
              >
                {rec}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>💡 Recommendations help stay on top of preventive maintenance</p>
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
          onClick={onNext}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
