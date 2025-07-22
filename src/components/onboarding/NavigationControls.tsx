'use client';

import React from 'react';

interface NavigationControlsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  showPrevious?: boolean;
  showNext?: boolean;
  showSkip?: boolean;
  nextLabel?: string;
  loading?: boolean;
  nextDisabled?: boolean;
  hideNext?: boolean;
}

export function NavigationControls({
  onPrevious,
  onNext,
  onSkip,
  showPrevious = true,
  showNext = true,
  showSkip = true,
  nextLabel = 'Next',
  loading = false,
  nextDisabled = false,
  hideNext = false,
}: NavigationControlsProps) {
  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t">
      <div>
        {showPrevious && onPrevious && (
          <button
            onClick={onPrevious}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            Previous
          </button>
        )}
      </div>
      
      <div className="flex gap-3">
        {showSkip && onSkip && (
          <button
            onClick={onSkip}
            disabled={loading}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            Skip this step
          </button>
        )}
        
        {showNext && onNext && !hideNext && (
          <button
            onClick={onNext}
            disabled={loading || nextDisabled}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}