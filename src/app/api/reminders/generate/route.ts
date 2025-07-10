import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Generate reminders API called');
    
    // Check if user is logged in via Authorization header or session
    const authHeader = request.headers.get('authorization');
    if (!authHeader && !request.headers.get('cookie')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Call the Supabase Edge Function directly via HTTP
    console.log('Calling Edge Function...');
    
    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-reminders`;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ manual_trigger: true })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function HTTP error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to generate reminders', details: `HTTP ${response.status}: ${errorText}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    console.log('Edge function response:', data);
    
    return NextResponse.json({
      success: true,
      message: data?.message || 'Reminders generated successfully',
      generated_count: data?.generated_count || 0,
      timestamp: data?.timestamp || new Date().toISOString()
    });
  } catch (error) {
    console.error('Unexpected error in generate reminders API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate reminders.' },
    { status: 405 }
  );
}