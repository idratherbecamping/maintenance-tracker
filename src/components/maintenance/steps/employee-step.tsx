'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { MaintenanceFormData } from '../maintenance-wizard';
import { Database } from '@/types/database';

type User = Database['public']['Tables']['mt_users']['Row'];

interface EmployeeStepProps {
  formData: MaintenanceFormData;
  updateFormData: (updates: Partial<MaintenanceFormData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function EmployeeStep({ formData, updateFormData, onNext, onPrevious }: EmployeeStepProps) {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    fetchEmployees();
  }, [profile]);

  const fetchEmployees = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('mt_users')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
      
      // Auto-select current user if not already selected
      if (!formData.employeeId && profile.id) {
        updateFormData({ employeeId: profile.id });
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    updateFormData({ employeeId });
    setTimeout(onNext, 300);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Who is performing this maintenance?
        </h2>
        <p className="text-gray-600">
          Select the person responsible for this work.
        </p>
      </div>

      <div className="space-y-3">
        {employees.map((employee) => (
          <button
            key={employee.id}
            onClick={() => handleEmployeeSelect(employee.id)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-blue-500 hover:shadow-md ${
              formData.employeeId === employee.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{employee.name}</h3>
                <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
                  <span className="capitalize">{employee.role}</span>
                  {employee.id === profile?.id && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      You
                    </span>
                  )}
                </div>
              </div>
              <div className="text-2xl">
                👤
              </div>
            </div>
          </button>
        ))}
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

        {formData.employeeId && (
          <button
            onClick={onNext}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Continue
            <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}