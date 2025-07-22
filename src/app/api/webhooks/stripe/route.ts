import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { BillingService } from '@/lib/stripe/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = BillingService.verifyWebhookSignature(body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case 'invoice.created':
        await handleInvoiceCreated(event.data.object as Stripe.Invoice, supabase);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabase);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleInvoiceCreated(invoice: Stripe.Invoice, supabase: any) {
  if (!invoice.customer || typeof invoice.customer === 'string') return;

  const companyId = invoice.customer.metadata?.company_id;
  if (!companyId) return;

  console.log(`Invoice created for company ${companyId}: ${invoice.id}`);
  
  // Optionally log invoice creation or send notifications
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  if (!invoice.customer) return;

  let companyId: string | undefined;
  
  if (typeof invoice.customer === 'string') {
    // Fetch customer metadata
    const customer = await BillingService.stripe.customers.retrieve(invoice.customer);
    companyId = customer.metadata?.company_id;
  } else {
    companyId = invoice.customer.metadata?.company_id;
  }

  if (!companyId) {
    console.warn('No company_id found for invoice:', invoice.id);
    return;
  }

  // Extract vehicle count from invoice line items
  let vehicleCount = 5; // Default minimum
  if (invoice.lines.data.length > 0) {
    const lineItem = invoice.lines.data[0];
    vehicleCount = lineItem.quantity || 5;
  }

  // Save billing history
  const { error } = await supabase.from('mt_billing_history').insert({
    company_id: companyId,
    stripe_invoice_id: invoice.id,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: 'paid',
    invoice_url: invoice.hosted_invoice_url,
    vehicle_count: vehicleCount,
  });

  if (error) {
    console.error('Error saving billing history:', error);
  } else {
    console.log(`Payment succeeded for company ${companyId}: ${invoice.id}`);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  if (!invoice.customer) return;

  let companyId: string | undefined;
  
  if (typeof invoice.customer === 'string') {
    const customer = await BillingService.stripe.customers.retrieve(invoice.customer);
    companyId = customer.metadata?.company_id;
  } else {
    companyId = invoice.customer.metadata?.company_id;
  }

  if (!companyId) return;

  // Extract vehicle count from invoice line items
  let vehicleCount = 5;
  if (invoice.lines.data.length > 0) {
    const lineItem = invoice.lines.data[0];
    vehicleCount = lineItem.quantity || 5;
  }

  // Save billing history
  const { error } = await supabase.from('mt_billing_history').insert({
    company_id: companyId,
    stripe_invoice_id: invoice.id,
    amount: invoice.amount_due,
    currency: invoice.currency,
    status: 'failed',
    invoice_url: invoice.hosted_invoice_url,
    vehicle_count: vehicleCount,
  });

  if (error) {
    console.error('Error saving failed payment to billing history:', error);
  } else {
    console.log(`Payment failed for company ${companyId}: ${invoice.id}`);
  }

  // Note: As per requirements, we don't block access on payment failure
  // You might want to send an email notification here
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any) {
  if (!subscription.customer) return;

  let companyId: string | undefined;
  
  if (typeof subscription.customer === 'string') {
    const customer = await BillingService.stripe.customers.retrieve(subscription.customer);
    companyId = customer.metadata?.company_id;
  } else {
    companyId = subscription.customer.metadata?.company_id;
  }

  if (!companyId) return;

  // Update company subscription status
  const { error } = await supabase
    .from('mt_companies')
    .update({
      subscription_status: subscription.status,
      trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      billing_cycle_anchor: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription status:', error);
  } else {
    console.log(`Subscription updated for company ${companyId}: ${subscription.status}`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  if (!subscription.customer) return;

  let companyId: string | undefined;
  
  if (typeof subscription.customer === 'string') {
    const customer = await BillingService.stripe.customers.retrieve(subscription.customer);
    companyId = customer.metadata?.company_id;
  } else {
    companyId = subscription.customer.metadata?.company_id;
  }

  if (!companyId) return;

  // Update company subscription status
  const { error } = await supabase
    .from('mt_companies')
    .update({
      subscription_status: 'canceled',
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating canceled subscription:', error);
  } else {
    console.log(`Subscription canceled for company ${companyId}`);
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription, supabase: any) {
  if (!subscription.customer) return;

  let companyId: string | undefined;
  
  if (typeof subscription.customer === 'string') {
    const customer = await BillingService.stripe.customers.retrieve(subscription.customer);
    companyId = customer.metadata?.company_id;
  } else {
    companyId = subscription.customer.metadata?.company_id;
  }

  if (!companyId) return;

  console.log(`Trial will end for company ${companyId} on ${new Date(subscription.trial_end! * 1000)}`);
  
  // You might want to send a notification email here
  // The trial end date is already stored in the database from previous webhook events
}