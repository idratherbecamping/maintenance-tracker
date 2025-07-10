import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, name, companyName } = await request.json();

    console.log('Admin API: Inviting user:', email);

    // Invite user with metadata
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          name,
          company_name: companyName,
          is_admin: true,
        },
        redirectTo: 'http://localhost:3000/login'
      }
    );

    if (error) {
      console.error('Admin API: Invite error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('Admin API: Invitation sent successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation sent successfully',
      user: data.user
    });

  } catch (error) {
    console.error('Admin API: Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Failed to send invitation' 
    }, { status: 500 });
  }
}