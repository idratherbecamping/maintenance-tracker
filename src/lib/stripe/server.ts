import Stripe from 'stripe';

// This is the server-side Stripe client for use in API routes and server components
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export { stripe };

// Constants
export const STRIPE_CONFIG = {
  PRODUCT_ID: process.env.STRIPE_PRODUCT_ID!,
  BASE_PRICE_ID: process.env.STRIPE_BASE_PRICE_ID!, // $50 base price
  VEHICLE_PRICE_ID: process.env.STRIPE_VEHICLE_PRICE_ID!, // $5 per vehicle
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
  TRIAL_PERIOD_DAYS: 7,
  MINIMUM_VEHICLES: 5,
  BASE_PRICE_VEHICLES: 5,
} as const;

// Billing utilities
export class BillingService {
  static stripe = stripe;
  /**
   * Create a new Stripe customer
   */
  static async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }) {
    return stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata || {},
    });
  }

  /**
   * Create a subscription with trial period
   */
  static async createSubscription(params: {
    customerId: string;
    priceId: string;
    vehicleCount: number;
    metadata?: Record<string, string>;
  }) {
    const quantity = Math.max(STRIPE_CONFIG.MINIMUM_VEHICLES, params.vehicleCount);
    
    return stripe.subscriptions.create({
      customer: params.customerId,
      items: [{
        price: params.priceId,
        quantity,
      }],
      trial_period_days: STRIPE_CONFIG.TRIAL_PERIOD_DAYS,
      proration_behavior: 'none',
      metadata: params.metadata || {},
    });
  }

  /**
   * Update subscription quantity (vehicle count)
   */
  static async updateSubscriptionQuantity(params: {
    subscriptionItemId: string;
    quantity: number;
  }) {
    const quantity = Math.max(STRIPE_CONFIG.MINIMUM_VEHICLES, params.quantity);
    
    return stripe.subscriptionItems.update(params.subscriptionItemId, {
      quantity,
      proration_behavior: 'none',
    });
  }

  /**
   * Get subscription details
   */
  static async getSubscription(subscriptionId: string) {
    return stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price', 'customer'],
    });
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string) {
    return stripe.subscriptions.cancel(subscriptionId);
  }

  /**
   * Create customer portal session
   */
  static async createPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }) {
    return stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });
  }

  /**
   * Get invoices for a customer
   */
  static async getInvoices(customerId: string, limit = 10) {
    return stripe.invoices.list({
      customer: customerId,
      limit,
      expand: ['data.payment_intent'],
    });
  }

  /**
   * Calculate monthly cost based on vehicle count
   */
  static calculateMonthlyCost(vehicleCount: number, basePriceInCents: number): number {
    const quantity = Math.max(STRIPE_CONFIG.MINIMUM_VEHICLES, vehicleCount);
    // Since this is usage-based pricing with the minimum built into the product,
    // the cost will be handled by Stripe based on the quantity
    return Math.floor((basePriceInCents * quantity) / 100);
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_CONFIG.WEBHOOK_SECRET
    );
  }
}