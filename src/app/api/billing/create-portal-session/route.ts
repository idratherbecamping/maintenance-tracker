import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BillingService } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('mt_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get company billing info
    const { data: company } = await supabase
      .from('mt_companies')
      .select('stripe_customer_id')
      .eq('id', profile.company_id)
      .single();

    if (!company?.stripe_customer_id) {
      return NextResponse.json({ error: 'No customer found' }, { status: 400 });
    }

    // Create portal session
    const portalSession = await BillingService.createPortalSession({
      customerId: company.stripe_customer_id,
      returnUrl: `${request.nextUrl.origin}/profile`,
    });

    return NextResponse.json({
      url: portalSession.url,
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}