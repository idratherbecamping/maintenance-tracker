'use client';

import React from 'react';

interface Step {
  id: number;
  name: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <li key={step.id} className="flex-1">
            <div className="flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                {index < steps.length - 1 && (
                  <div
                    className={`absolute left-full w-full h-0.5 ${
                      step.id < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    style={{ width: 'calc(100% - 2.5rem)', left: '2.5rem' }}
                  />
                )}
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step.id < currentStep
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : step.id === currentStep
                      ? 'border-blue-600 bg-white text-blue-600'
                      : 'border-gray-200 bg-white text-gray-400'
                  }`}
                >
                  {step.id < currentStep ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    step.id
                  )}
                </span>
              </div>
              <div className="mt-2 text-center">
                <p
                  className={`text-sm font-medium ${
                    step.id === currentStep ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {step.name}
                </p>
                <p className="text-xs text-gray-400 mt-1 hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}