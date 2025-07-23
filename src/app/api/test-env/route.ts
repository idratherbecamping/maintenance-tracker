import { NextRequest, NextResponse } from 'next/server';
import { STRIPE_CONFIG } from '@/lib/stripe/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    BASE_PRICE_ID: process.env.STRIPE_BASE_PRICE_ID,
    VEHICLE_PRICE_ID: process.env.STRIPE_VEHICLE_PRICE_ID,
    CONFIG_BASE_PRICE_ID: STRIPE_CONFIG.BASE_PRICE_ID,
    CONFIG_VEHICLE_PRICE_ID: STRIPE_CONFIG.VEHICLE_PRICE_ID,
  });
}