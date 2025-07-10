import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, name, companyId } = await request.json();

    console.log('Team API: Inviting employee:', { email, name, companyId });

    // Get company info for context
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('mt_companies')
      .select('name')
      .eq('id', companyId)
      .single();

    if (companyError || !companyData) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Create user with temporary password that they'll need to reset
    const tempPassword = Math.random().toString(36).slice(-8) + 'Temp123!';
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm for development
      user_metadata: {
        name,
        company_id: companyId,
        company_name: companyData.name,
        is_employee: true,
      }
    });

    if (error) {
      console.error('Team API: Invite error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('Team API: Employee invitation sent successfully');

    return NextResponse.json({ 
      success: true, 
      message: `Employee account created successfully`,
      user: data.user,
      temporaryPassword: tempPassword,
      loginInstructions: `Account created for ${email}. Temporary password: ${tempPassword}. Please have them login and change their password.`
    });

  } catch (error) {
    console.error('Team API: Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Failed to send invitation' 
    }, { status: 500 });
  }
}