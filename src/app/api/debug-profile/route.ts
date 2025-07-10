import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client that bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log('Debug API: Fetching profile for:', userId);

    // Use service role to bypass RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('mt_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Debug API: Profile fetch error:', profileError);
      
      // Check if user exists at all
      const { count } = await supabaseAdmin
        .from('mt_users')
        .select('*', { count: 'exact', head: true })
        .eq('id', userId);
      
      return NextResponse.json({ 
        error: profileError.message,
        userExists: count ? count > 0 : false,
        hint: 'User might not exist in mt_users table'
      }, { status: 404 });
    }

    // Also fetch company info
    let company = null;
    if (profile.company_id) {
      const { data: companyData } = await supabaseAdmin
        .from('mt_companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();
      
      company = companyData;
    }

    return NextResponse.json({ 
      profile,
      company,
      success: true 
    });

  } catch (error) {
    console.error('Debug API: Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}