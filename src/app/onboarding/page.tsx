'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { NavigationControls } from '@/components/onboarding/NavigationControls';
import { BusinessInfoForm, BusinessInfoData } from '@/components/onboarding/BusinessInfoForm';
import { AdminProfileForm, AdminProfileData } from '@/components/onboarding/AdminProfileForm';
import { BillingSetupForm, BillingSetupData } from '@/components/onboarding/BillingSetupForm';
import { ReviewComplete } from '@/components/onboarding/ReviewComplete';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';

const ONBOARDING_STEPS = [
  { id: 1, name: 'Business Info', description: 'Company details' },
  { id: 2, name: 'Admin Profile', description: 'Your information' },
  { id: 3, name: 'Billing Setup', description: 'Payment & vehicles' },
  { id: 4, name: 'Complete', description: 'Review & finish' },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [onboardingData, setOnboardingData] = useState({
    businessInfo: {} as BusinessInfoData,
    adminProfile: {} as AdminProfileData,
    billingSetup: {} as BillingSetupData & { paymentMethodId?: string },
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

  const handleBillingSetupSubmit = async (data: BillingSetupData & { paymentMethodId: string }) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/billing/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleCount: data.vehicleCount,
          billingEmail: data.billingEmail,
          paymentMethodId: data.paymentMethodId,
          discountCode: data.discountCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to set up billing');
      }

      setOnboardingData({ ...onboardingData, billingSetup: data });
      setCurrentStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up billing');
      console.error('Billing setup error:', err);
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
    if (currentStep < 4) {
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
            <BillingSetupForm
              initialData={{
                vehicleCount: onboardingData.billingSetup.vehicleCount || 5,
                billingEmail: onboardingData.billingSetup.billingEmail || profile?.email || '',
              }}
              onSubmit={handleBillingSetupSubmit}
              loading={loading}
            />
            <NavigationControls
              onPrevious={handlePrevious}
              onNext={() => {
                // The form handles its own submission
              }}
              nextDisabled={true} // Form handles submission
              loading={loading}
              hideNext={true} // Form has its own submit button
            />
          </>
        );

      case 4:
        return (
          <ReviewComplete
            companyName={onboardingData.businessInfo.name}
            workerCount={0}
            vehicleCount={onboardingData.billingSetup.vehicleCount || 0}
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