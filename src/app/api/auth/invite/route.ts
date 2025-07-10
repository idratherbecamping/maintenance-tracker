import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  console.log('API: Invite route hit successfully!');
  
  try {
    const { email, name, companyName } = await request.json();

    console.log('API: Creating invitation for:', email);

    // Create auth user with email invitation
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: false, // They need to confirm email
      user_metadata: {
        name,
        company_name: companyName,
        is_admin: true,
        invited_at: new Date().toISOString()
      }
    });

    if (authError) {
      console.error('API: Auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    console.log('API: User invitation created:', authData.user?.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation sent successfully',
      user_id: authData.user?.id
    });

  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Failed to send invitation' 
    }, { status: 500 });
  }
}