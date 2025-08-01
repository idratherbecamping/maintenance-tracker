'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onSkip?: () => void;
}

export function OnboardingLayout({ 
  children, 
  currentStep, 
  totalSteps,
  onSkip 
}: OnboardingLayoutProps) {
  const router = useRouter();

  const handleSkipAll = () => {
    if (onSkip) {
      onSkip();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome! Let's set up your account</h1>
            <p className="text-gray-900 mt-1">Complete these steps to get the most out of your maintenance tracker</p>
          </div>
          <button
            onClick={handleSkipAll}
            className="text-gray-900 hover:text-black text-sm underline"
          >
            Skip setup
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          {children}
        </div>
      </div>
    </div>
  );
}