import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, email, name, companyName } = await request.json();

    console.log('Setup API: Creating company and profile for:', { userId, email, name, companyName });

    // Check if user profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('mt_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      console.log('Setup API: Profile already exists, returning existing data');
      return NextResponse.json({ 
        success: true, 
        company: { id: existingProfile.company_id }
      });
    }

    // Check if company already exists for this user's email domain (optional)
    let companyData;
    const { data: existingCompany } = await supabaseAdmin
      .from('mt_companies')
      .select('*')
      .eq('name', companyName)
      .single();

    if (existingCompany) {
      console.log('Setup API: Company already exists, using existing one');
      companyData = existingCompany;
    } else {
      // Create new company
      const { data: newCompanyData, error: companyError } = await supabaseAdmin
        .from('mt_companies')
        .insert({ name: companyName })
        .select()
        .single();

      if (companyError) {
        console.error('Setup API: Company creation error:', companyError);
        return NextResponse.json({ error: companyError.message }, { status: 400 });
      }

      console.log('Setup API: Company created:', newCompanyData);
      companyData = newCompanyData;
    }

    // Create user profile
    const { error: userError } = await supabaseAdmin
      .from('mt_users')
      .insert({
        id: userId,
        email,
        name,
        role: 'admin',
        company_id: companyData.id,
      });

    if (userError) {
      console.error('Setup API: User profile creation error:', userError);
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    console.log('Setup API: Profile created successfully');

    return NextResponse.json({ 
      success: true, 
      company: companyData
    });

  } catch (error) {
    console.error('Setup API: Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Failed to setup profile' 
    }, { status: 500 });
  }
}