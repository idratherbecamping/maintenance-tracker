import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  console.log('API: Route hit successfully!');
  
  try {
    console.log('API: Environment check:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKeyStart: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10)
    });

    const { email, password, name, companyName } = await request.json();

    console.log('API: Starting signup process for:', email);

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation
    });

    if (authError) {
      console.error('API: Auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 400 });
    }

    console.log('API: User created:', authData.user.id);

    // 2. Create company
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('mt_companies')
      .insert({ name: companyName })
      .select()
      .single();

    if (companyError) {
      console.error('API: Company creation error:', companyError);
      return NextResponse.json({ error: companyError.message }, { status: 400 });
    }

    console.log('API: Company created:', companyData.id);

    // 3. Create user profile
    const { error: userError } = await supabaseAdmin
      .from('mt_users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: 'admin',
        company_id: companyData.id,
      });

    if (userError) {
      console.error('API: User profile creation error:', userError);
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    console.log('API: User profile created successfully');

    return NextResponse.json({ 
      success: true, 
      user: authData.user,
      company: companyData 
    });

  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}