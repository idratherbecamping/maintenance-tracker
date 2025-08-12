import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { accessToken, password } = await request.json();

    if (!accessToken || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Decode the access token to get user ID
    try {
      const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
      const userId = tokenPayload.sub;

      if (!userId) {
        return NextResponse.json({ error: 'Invalid access token' }, { status: 400 });
      }

      // Update the user's password using admin client
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: password }
      );

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Password updated successfully'
      });

    } catch (decodeError) {
      return NextResponse.json({ error: 'Invalid access token format' }, { status: 400 });
    }

  } catch (error) {
    console.error('Set Password API: Unexpected error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}