'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VehicleStep } from './steps/vehicle-step';
import { EmployeeStep } from './steps/employee-step';
import { MileageStep } from './steps/mileage-step';
import { MaintenanceTypeStep } from './steps/maintenance-type-step';
import { CostStep } from './steps/cost-step';
import { DescriptionStep } from './steps/description-step';
import { ImagesStep } from './steps/images-step';
import { RecommendationsStep } from './steps/recommendations-step';
import { ReviewStep } from './steps/review-step';
import { Database } from '@/types/database';

type Vehicle = Database['public']['Tables']['mt_vehicles']['Row'];
type MaintenanceType = Database['public']['Tables']['mt_maintenance_types']['Row'];

export interface MaintenanceFormData {
  vehicleId: string;
  employeeId: string;
  mileage: number;
  maintenanceTypeId?: string;
  customType?: string;
  cost?: number;
  description?: string;
  date: string;
  images: File[];
  recommendations: Array<{
    description: string;
    recommendedDate?: string;
  }>;
}

interface MaintenanceWizardProps {
  vehicles: Vehicle[];
  maintenanceTypes: MaintenanceType[];
  preselectedVehicleId?: string | null;
  onComplete: () => void;
}

const steps = [
  'vehicle',
  'employee', 
  'mileage',
  'type',
  'cost',
  'description',
  'images',
  'recommendations',
  'review',
] as const;

type Step = typeof steps[number];

export function MaintenanceWizard({
  vehicles,
  maintenanceTypes,
  preselectedVehicleId,
  onComplete,
}: MaintenanceWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<MaintenanceFormData>({
    vehicleId: preselectedVehicleId || '',
    employeeId: '',
    mileage: 0,
    date: new Date().toISOString().split('T')[0],
    images: [],
    recommendations: [],
  });

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const updateFormData = (updates: Partial<MaintenanceFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const goToNext = () => {
    if (!isLastStep) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  const renderStep = () => {
    const stepProps = {
      formData,
      updateFormData,
      onNext: goToNext,
      onPrevious: goToPrevious,
      isFirstStep,
      isLastStep,
    };

    switch (currentStep) {
      case 'vehicle':
        return (
          <VehicleStep
            {...stepProps}
            vehicles={vehicles}
          />
        );
      case 'employee':
        return (
          <EmployeeStep
            {...stepProps}
          />
        );
      case 'mileage':
        return (
          <MileageStep
            {...stepProps}
            selectedVehicle={vehicles.find(v => v.id === formData.vehicleId)}
          />
        );
      case 'type':
        return (
          <MaintenanceTypeStep
            {...stepProps}
            maintenanceTypes={maintenanceTypes}
          />
        );
      case 'cost':
        return (
          <CostStep
            {...stepProps}
          />
        );
      case 'description':
        return (
          <DescriptionStep
            {...stepProps}
          />
        );
      case 'images':
        return (
          <ImagesStep
            {...stepProps}
          />
        );
      case 'recommendations':
        return (
          <RecommendationsStep
            {...stepProps}
          />
        );
      case 'review':
        return (
          <ReviewStep
            {...stepProps}
            vehicles={vehicles}
            maintenanceTypes={maintenanceTypes}
            onComplete={onComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with progress */}
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Log Maintenance</h1>
            <div className="text-sm text-gray-500">
              Step {currentStepIndex + 1} of {steps.length}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}