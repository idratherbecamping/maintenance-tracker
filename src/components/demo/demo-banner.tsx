'use client';

import { useState } from 'react';

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  if (!isDemoMode || dismissed) {
    return null;
  }

  return (
    <div className="bg-blue-600 relative">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="pr-16 sm:text-center sm:px-16">
          <p className="font-medium text-white">
            <span className="md:hidden">Demo Mode Active</span>
            <span className="hidden md:inline">
              🚀 Demo Mode: You're viewing sample data from "Demo Fleet Management"
            </span>
            <span className="block sm:ml-2 sm:inline-block">
              <span className="text-blue-200">•</span> 5 vehicles 
              <span className="text-blue-200 mx-2">•</span> 10 maintenance records 
              <span className="text-blue-200 mx-2">•</span> $1,092 total costs
            </span>
          </p>
        </div>
        <div className="absolute inset-y-0 right-0 pt-1 pr-1 flex items-start sm:pt-1 sm:pr-2 sm:items-start">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex p-2 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}