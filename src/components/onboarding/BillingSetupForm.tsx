'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe/client';

const billingSchema = z.object({
  vehicleCount: z.number().min(5, 'Minimum 5 vehicles required'),
  billingEmail: z.string().email('Valid email required'),
  discountCode: z.string().optional(),
});

export type BillingSetupData = z.infer<typeof billingSchema>;

interface BillingSetupFormProps {
  initialData?: Partial<BillingSetupData>;
  onSubmit: (data: BillingSetupData & { paymentMethodId: string }) => Promise<void>;
  loading?: boolean;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
};

function BillingSetupFormContent({ initialData, onSubmit, loading }: BillingSetupFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState<string>('');
  const [monthlyAmount, setMonthlyAmount] = useState(50);
  const [discountValidating, setDiscountValidating] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<any>(null);
  const [discountError, setDiscountError] = useState<string>('');
  const [discountedAmount, setDiscountedAmount] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<BillingSetupData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      vehicleCount: initialData?.vehicleCount || 5,
      billingEmail: initialData?.billingEmail || '',
      discountCode: initialData?.discountCode || '',
    },
  });

  const vehicleCount = watch('vehicleCount');
  const discountCode = watch('discountCode');

  useEffect(() => {
    // Calculate monthly amount: $50 base for 5 vehicles, +$5 per additional vehicle
    const basePrice = 50;
    const additionalVehicles = Math.max(0, vehicleCount - 5);
    const total = basePrice + (additionalVehicles * 5);
    setMonthlyAmount(total);

    // Recalculate discounted amount if discount is applied
    if (discountInfo) {
      calculateDiscountedAmount(total, discountInfo);
    }
  }, [vehicleCount, discountInfo]);

  const validateDiscountCode = async (code: string) => {
    if (!code || code.length === 0) {
      setDiscountInfo(null);
      setDiscountError('');
      setDiscountedAmount(null);
      return;
    }

    setDiscountValidating(true);
    setDiscountError('');

    try {
      const response = await fetch('/api/billing/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountCode: code }),
      });

      const result = await response.json();

      if (result.valid && result.coupon) {
        setDiscountInfo(result.coupon);
        setDiscountError('');
        calculateDiscountedAmount(monthlyAmount, result.coupon);
      } else {
        setDiscountInfo(null);
        setDiscountError(result.error || 'Invalid discount code');
        setDiscountedAmount(null);
      }
    } catch (error) {
      setDiscountError('Failed to validate discount code');
      setDiscountInfo(null);
      setDiscountedAmount(null);
    } finally {
      setDiscountValidating(false);
    }
  };

  const calculateDiscountedAmount = (baseAmount: number, coupon: any) => {
    if (coupon.percent_off) {
      const discountAmount = (baseAmount * coupon.percent_off) / 100;
      setDiscountedAmount(baseAmount - discountAmount);
    } else if (coupon.amount_off) {
      const discountInDollars = coupon.amount_off / 100; // Convert cents to dollars
      setDiscountedAmount(Math.max(0, baseAmount - discountInDollars));
    }
  };

  // Debounced discount validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (discountCode && discountCode.length > 0) {
        validateDiscountCode(discountCode);
      } else {
        setDiscountInfo(null);
        setDiscountError('');
        setDiscountedAmount(null);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [discountCode]);

  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : '');
  };

  const handleFormSubmit = async (data: BillingSetupData) => {
    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setCardError('Card element not found');
      return;
    }

    // Create payment method
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        email: data.billingEmail,
      },
    });

    if (error) {
      setCardError(error.message || 'Failed to create payment method');
      return;
    }

    if (!paymentMethod) {
      setCardError('Failed to create payment method');
      return;
    }

    await onSubmit({
      ...data,
      paymentMethodId: paymentMethod.id,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Billing Setup</h2>
        <p className="mt-2 text-gray-600">
          Set up your payment method and vehicle count to get started
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Vehicle Count */}
        <div>
          <label htmlFor="vehicleCount" className="block text-sm font-medium text-gray-700">
            Initial Vehicle Count
          </label>
          <div className="mt-1">
            <input
              type="number"
              min="5"
              {...register('vehicleCount', { valueAsNumber: true })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          {errors.vehicleCount && (
            <p className="mt-1 text-sm text-red-600">{errors.vehicleCount.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Minimum 5 vehicles. You can add more vehicles later.
          </p>
        </div>

        {/* Discount Code */}
        <div>
          <label htmlFor="discountCode" className="block text-sm font-medium text-gray-700">
            Discount Code (Optional)
          </label>
          <div className="mt-1 relative">
            <input
              type="text"
              {...register('discountCode')}
              placeholder="Enter discount code"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
            />
            {discountValidating && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          {discountError && (
            <p className="mt-1 text-sm text-red-600">{discountError}</p>
          )}
          {discountInfo && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✅ {discountInfo.name || `Discount code "${discountCode}"`} applied!
                {discountInfo.percent_off && ` ${discountInfo.percent_off}% off`}
                {discountInfo.amount_off && ` $${(discountInfo.amount_off / 100).toFixed(2)} off`}
              </p>
            </div>
          )}
        </div>

        {/* Pricing Display */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Pricing Breakdown</h3>
          <div className="space-y-1 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Base plan (5 vehicles)</span>
              <span>$50.00/month</span>
            </div>
            {vehicleCount > 5 && (
              <div className="flex justify-between">
                <span>{vehicleCount - 5} additional vehicles × $5</span>
                <span>${((vehicleCount - 5) * 5).toFixed(2)}/month</span>
              </div>
            )}
            {discountInfo && (
              <div className="flex justify-between text-green-700">
                <span>
                  Discount ({discountInfo.percent_off ? `${discountInfo.percent_off}%` : `$${(discountInfo.amount_off / 100).toFixed(2)}`})
                </span>
                <span>
                  -{discountInfo.percent_off ? `$${(monthlyAmount * discountInfo.percent_off / 100).toFixed(2)}` : `$${(discountInfo.amount_off / 100).toFixed(2)}`}
                </span>
              </div>
            )}
            <div className="border-t border-blue-300 pt-1 font-semibold flex justify-between">
              <span>Total</span>
              <span>
                {discountedAmount !== null ? (
                  <>
                    <span className="line-through text-gray-500">${monthlyAmount.toFixed(2)}</span>{' '}
                    <span className="text-green-700">${discountedAmount.toFixed(2)}</span>/month
                  </>
                ) : (
                  `$${monthlyAmount.toFixed(2)}/month`
                )}
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-blue-700">
            🎉 7-day free trial included! No charges during trial period.
          </p>
        </div>

        {/* Billing Email */}
        <div>
          <label htmlFor="billingEmail" className="block text-sm font-medium text-gray-700">
            Billing Email
          </label>
          <div className="mt-1">
            <input
              type="email"
              {...register('billingEmail')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="billing@example.com"
            />
          </div>
          {errors.billingEmail && (
            <p className="mt-1 text-sm text-red-600">{errors.billingEmail.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Invoices and billing updates will be sent to this email.
          </p>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <div className="p-3 border border-gray-300 rounded-md">
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={handleCardChange}
            />
          </div>
          {cardError && (
            <p className="mt-1 text-sm text-red-600">{cardError}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Your payment information is secured by Stripe. We don't store card details.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Setting up billing...
            </>
          ) : (
            `Start 7-Day Free Trial (${
              discountedAmount !== null 
                ? `$${discountedAmount.toFixed(2)}/month after trial`
                : `$${monthlyAmount}/month after trial`
            })`
          )}
        </button>
      </form>
    </div>
  );
}

export function BillingSetupForm(props: BillingSetupFormProps) {
  const [stripe, setStripe] = useState<any>(null);

  useEffect(() => {
    getStripe().then(setStripe);
  }, []);

  if (!stripe) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading payment form...</span>
      </div>
    );
  }

  const elementsOptions: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <Elements stripe={stripe} options={elementsOptions}>
      <BillingSetupFormContent {...props} />
    </Elements>
  );
}