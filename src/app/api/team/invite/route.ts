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

    // Use Supabase's built-in invitation system
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          name,
          company_id: companyId,
          company_name: companyData.name,
          is_employee: true,
          role: 'employee'
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/set-password`
      }
    );

    if (error) {
      console.error('Team API: Invite error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('Team API: Employee invitation sent successfully to:', email);

    return NextResponse.json({ 
      success: true, 
      message: `Invitation sent to ${email}`,
      user: data.user,
      emailSent: true
    });

  } catch (error) {
    console.error('Team API: Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Failed to send invitation' 
    }, { status: 500 });
  }
}