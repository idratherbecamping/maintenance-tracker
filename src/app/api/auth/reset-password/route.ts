import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service key (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  console.log('API: Password reset route hit');
  
  try {
    console.log('API: Environment check:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKeyStart: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10)
    });

    const body = await request.json();
    console.log('API: Request body:', body);
    
    const { email, otp, password } = body;

    console.log('API: Password reset request for:', email);

    if (!email || !otp || !password) {
      console.log('API: Missing required fields');
      return NextResponse.json({ 
        error: 'Email, OTP, and password are required' 
      }, { status: 400 });
    }

    // First verify the OTP
    console.log('API: Verifying OTP...');
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery',
    });

    console.log('API: OTP verification result:', { verifyData, verifyError });

    if (verifyError) {
      console.error('API: OTP verification error:', verifyError);
      return NextResponse.json({ 
        error: verifyError.message 
      }, { status: 400 });
    }

    // Then update the password
    console.log('API: Updating password...');
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    console.log('API: Password update result:', { updateError });

    if (updateError) {
      console.error('API: Password update error:', updateError);
      return NextResponse.json({ 
        error: updateError.message 
      }, { status: 400 });
    }

    console.log('API: Password reset successful');

    return NextResponse.json({ 
      success: true, 
      message: 'Password updated successfully' 
    });

  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Failed to reset password' 
    }, { status: 500 });
  }
} 