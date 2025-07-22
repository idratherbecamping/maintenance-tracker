// Client-side exports
export { getStripe } from './client';

// Types
export interface BillingInfo {
  customerId: string | null;
  subscriptionId: string | null;
  subscriptionItemId: string | null;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  billingEmail: string | null;
  lastReportedVehicleCount: number;
  billingCycleAnchor: string | null;
}

export interface PricingInfo {
  vehicleCount: number;
  monthlyAmount: number;
  currency: string;
  isOnTrial: boolean;
  trialEndsAt?: Date;
}