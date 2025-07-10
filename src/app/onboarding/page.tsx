'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { NavigationControls } from '@/components/onboarding/NavigationControls';
import { BusinessInfoForm, BusinessInfoData } from '@/components/onboarding/BusinessInfoForm';
import { AdminProfileForm, AdminProfileData } from '@/components/onboarding/AdminProfileForm';
import { AddWorkersForm, WorkerData } from '@/components/onboarding/AddWorkersForm';
import { AddFleetForm, VehicleData } from '@/components/onboarding/AddFleetForm';
import { ReviewComplete } from '@/components/onboarding/ReviewComplete';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';

const ONBOARDING_STEPS = [
  { id: 1, name: 'Business Info', description: 'Company details' },
  { id: 2, name: 'Admin Profile', description: 'Your information' },
  { id: 3, name: 'Team Members', description: 'Invite workers' },
  { id: 4, name: 'Fleet', description: 'Add vehicles' },
  { id: 5, name: 'Complete', description: 'Review & finish' },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [onboardingData, setOnboardingData] = useState({
    businessInfo: {} as BusinessInfoData,
    adminProfile: {} as AdminProfileData,
    workers: [] as WorkerData[],
    vehicles: [] as VehicleData[],
  });
  
  const { profile, user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  // No need to load progress since we simplified to just a boolean flag

  const markOnboardingComplete = async () => {
    if (!profile?.company_id) return;

    console.log('Onboarding: Marking onboarding as complete for company:', profile.company_id);

    try {
      const { data, error } = await supabase
        .from('mt_companies')
        .update({ onboarding_completed: true })
        .eq('id', profile.company_id)
        .select();

      console.log('Onboarding: Completion update result:', { data, error });
    } catch (err) {
      console.error('Error marking onboarding complete:', err);
    }
  };

  const handleBusinessInfoSubmit = async (data: BusinessInfoData) => {
    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('mt_companies')
        .update({
          name: data.name,
          address: data.address,
          city: data.city,
          state: data.state,
          zip_code: data.zip_code,
          phone: data.phone,
          website: data.website,
          business_type: data.business_type,
          employee_count: data.employee_count,
        })
        .eq('id', profile!.company_id);

      if (updateError) throw updateError;

      setOnboardingData({ ...onboardingData, businessInfo: data });
      setCurrentStep(2);
    } catch (err) {
      setError('Failed to update business information');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminProfileSubmit = async (data: AdminProfileData) => {
    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('mt_users')
        .update({
          name: data.name,
          phone: data.phone,
        })
        .eq('id', user!.id);

      if (updateError) throw updateError;

      setOnboardingData({ ...onboardingData, adminProfile: data });
      setCurrentStep(3);
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkersSubmit = async (workers: WorkerData[]) => {
    setLoading(true);
    setError('');

    try {
      // In a real implementation, you would send invitations here
      // For now, we'll just store the data
      setOnboardingData({ ...onboardingData, workers });
      setCurrentStep(4);
    } catch (err) {
      setError('Failed to process team members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFleetSubmit = async (vehicles: VehicleData[]) => {
    setLoading(true);
    setError('');

    try {
      // Add vehicles to the database
      if (vehicles.length > 0) {
        const vehicleInserts = vehicles.map(v => ({
          company_id: profile!.company_id,
          make: v.make,
          model: v.model,
          year: v.year,
          license_plate: v.license_plate || null,
          current_mileage: v.current_mileage,
        }));

        const { error: insertError } = await supabase
          .from('mt_vehicles')
          .insert(vehicleInserts);

        if (insertError) throw insertError;
      }

      setOnboardingData({ ...onboardingData, vehicles });
      setCurrentStep(5);
    } catch (err) {
      setError('Failed to add vehicles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    console.log('Onboarding: Completing onboarding process');
    setLoading(true);
    await markOnboardingComplete();
    console.log('Onboarding: Redirecting to dashboard');
    router.push('/dashboard');
  };

  const handleSkip = async () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <BusinessInfoForm
              initialData={onboardingData.businessInfo}
              onSubmit={handleBusinessInfoSubmit}
              loading={loading}
            />
            <NavigationControls
              showPrevious={false}
              onNext={() => {
                const form = document.querySelector('form');
                form?.requestSubmit();
              }}
              onSkip={handleSkip}
              loading={loading}
            />
          </>
        );

      case 2:
        return (
          <>
            <AdminProfileForm
              initialData={{
                name: profile?.name || '',
                email: profile?.email || '',
                ...onboardingData.adminProfile,
              }}
              onSubmit={handleAdminProfileSubmit}
              loading={loading}
            />
            <NavigationControls
              onPrevious={handlePrevious}
              onNext={() => {
                const form = document.querySelector('form');
                form?.requestSubmit();
              }}
              onSkip={handleSkip}
              loading={loading}
            />
          </>
        );

      case 3:
        return (
          <>
            <AddWorkersForm
              onSubmit={handleWorkersSubmit}
              loading={loading}
            />
            <NavigationControls
              onPrevious={handlePrevious}
              onNext={() => handleWorkersSubmit(onboardingData.workers)}
              onSkip={handleSkip}
              loading={loading}
            />
          </>
        );

      case 4:
        return (
          <>
            <AddFleetForm
              onSubmit={handleFleetSubmit}
              loading={loading}
            />
            <NavigationControls
              onPrevious={handlePrevious}
              onNext={() => handleFleetSubmit(onboardingData.vehicles)}
              onSkip={handleSkip}
              loading={loading}
            />
          </>
        );

      case 5:
        return (
          <ReviewComplete
            companyName={onboardingData.businessInfo.name}
            workerCount={onboardingData.workers.length}
            vehicleCount={onboardingData.vehicles.length}
            onComplete={handleComplete}
            loading={loading}
          />
        );

      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <OnboardingLayout
        currentStep={currentStep}
        totalSteps={ONBOARDING_STEPS.length}
        onSkip={() => router.push('/dashboard')}
      >
        <StepIndicator steps={ONBOARDING_STEPS} currentStep={currentStep} />
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
            {error}
          </div>
        )}

        {renderStep()}
      </OnboardingLayout>
    </ProtectedRoute>
  );
}