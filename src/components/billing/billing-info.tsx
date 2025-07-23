'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { BillingHistory } from './billing-history';
import { Database } from '@/types/database';

type Company = Database['public']['Tables']['mt_companies']['Row'];

interface BillingInfoProps {
  onUpdateVehicleCount?: () => void;
}

export function BillingInfo({ onUpdateVehicleCount }: BillingInfoProps) {
  const { profile } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [vehicleCount, setVehicleCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchBillingInfo();
    fetchVehicleCount();
  }, [profile]);

  const fetchBillingInfo = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('mt_companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();

      if (error) throw error;
      setCompany(data);
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleCount = async () => {
    if (!profile?.company_id) return;

    try {
      const { count, error } = await supabase
        .from('mt_vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .eq('is_active', true);

      if (error) throw error;
      setVehicleCount(count || 0);
    } catch (error) {
      // Silently handle error
    }
  };

  const handleSyncVehicleCount = async () => {
    if (!company?.stripe_subscription_item_id) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/billing/sync-vehicle-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error);
      }

      // Refresh data
      await fetchBillingInfo();
      if (onUpdateVehicleCount) onUpdateVehicleCount();
    } catch (error) {
      alert('Failed to sync vehicle count. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleManagePayment = async () => {
    if (!company?.stripe_customer_id) return;

    try {
      const response = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      if (response.ok && result.url) {
        window.location.href = result.url;
      } else {
        alert('Failed to open payment portal. Please try again.');
      }
    } catch (error) {
      alert('Error opening payment portal. Please try again.');
    }
  };

  const calculateMonthlyAmount = () => {
    if (!company?.last_reported_vehicle_count) return 0;
    const vehicles = Math.max(5, company.last_reported_vehicle_count);
    return 50 + Math.max(0, vehicles - 5) * 5;
  };

  const getSubscriptionStatusDisplay = (status: string | null) => {
    switch (status) {
      case 'active':
        return { text: 'Active', className: 'bg-green-100 text-green-800' };
      case 'trialing':
        return { text: 'Free Trial', className: 'bg-blue-100 text-blue-800' };
      case 'past_due':
        return { text: 'Past Due', className: 'bg-yellow-100 text-yellow-800' };
      case 'canceled':
        return { text: 'Canceled', className: 'bg-red-100 text-red-800' };
      default:
        return { text: 'Unknown', className: 'bg-gray-100 text-gray-800' };
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (!company?.stripe_customer_id) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h2>
        <p className="text-gray-600">No billing information found. Please contact support.</p>
      </div>
    );
  }

  const subscriptionStatus = getSubscriptionStatusDisplay(company.subscription_status);
  const monthlyAmount = calculateMonthlyAmount();
  const isOnTrial = company.subscription_status === 'trialing';

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Current Plan</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${subscriptionStatus.className}`}>
              {subscriptionStatus.text}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Vehicles (billed)</span>
            <span className="text-sm text-gray-900">{company.last_reported_vehicle_count || 0}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Current vehicles</span>
            <span className="text-sm text-gray-900">{vehicleCount}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Monthly amount</span>
            <span className="text-sm font-semibold text-gray-900">
              ${monthlyAmount.toFixed(2)}
              {isOnTrial && <span className="text-xs text-blue-600 ml-1">(after trial)</span>}
            </span>
          </div>

          {isOnTrial && company.trial_ends_at && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Trial ends</span>
              <span className="text-sm text-gray-900">
                {new Date(company.trial_ends_at).toLocaleDateString()}
              </span>
            </div>
          )}

          {company.billing_cycle_anchor && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Next billing date</span>
              <span className="text-sm text-gray-900">
                {new Date(company.billing_cycle_anchor).toLocaleDateString()}
              </span>
            </div>
          )}

          {company.discount_code && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Active discount</span>
              <div className="text-right">
                <span className="text-sm font-semibold text-green-700">
                  {company.discount_percent_off ? `${company.discount_percent_off}% off` : 
                   company.discount_amount_off ? `$${(company.discount_amount_off / 100).toFixed(2)} off` : ''}
                </span>
                <div className="text-xs text-gray-500">Code: {company.discount_code}</div>
                {company.discount_expires_at && (
                  <div className="text-xs text-gray-500">
                    Expires: {new Date(company.discount_expires_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={handleSyncVehicleCount}
            disabled={updating || vehicleCount === company.last_reported_vehicle_count}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1"></div>
                Syncing...
              </>
            ) : (
              'Update Vehicle Count'
            )}
          </button>

          <button
            onClick={handleManagePayment}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Manage Payment Method
          </button>
        </div>

        {vehicleCount !== company.last_reported_vehicle_count && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Your vehicle count has changed from {company.last_reported_vehicle_count} to {vehicleCount}.
              Click "Update Vehicle Count" to sync this change for your next billing cycle.
            </p>
          </div>
        )}
      </div>

      {/* Billing Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Billing Details</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Billing Email</span>
            <span className="text-sm text-gray-900">{company.billing_email}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Customer ID</span>
            <span className="text-sm font-mono text-gray-600">{company.stripe_customer_id}</span>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <BillingHistory />
    </div>
  );
}