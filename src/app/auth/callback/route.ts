import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'
  const type = requestUrl.searchParams.get('type')

  // Log all search parameters for debugging
  const allParams = Object.fromEntries(requestUrl.searchParams.entries())
  console.log('Auth callback: All URL parameters:', allParams)
  console.log('Auth callback: Received request with:', { code: !!code, next, type })

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )
    
    try {
      console.log('Auth callback: Exchanging code for session')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('Auth callback: Exchange result:', { 
        hasSession: !!data.session, 
        hasUser: !!data.user,
        error: error?.message 
      })
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        
        // Handle specific error cases
        if (error.message.includes('expired') || error.message.includes('invalid') || error.message.includes('otp_expired')) {
          return NextResponse.redirect(`${requestUrl.origin}/forgot-password?error=link_expired`)
        }
        
        return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
      }

      // Check if this is a password reset flow or invitation flow
      console.log('Auth callback: Type check:', type)
      console.log('Auth callback: User metadata:', data.user?.user_metadata)
      
      if (type === 'recovery') {
        console.log('Auth callback: Password reset flow, redirecting to reset-password')
        // For password reset, session is already established after code exchange
        return NextResponse.redirect(`${requestUrl.origin}/reset-password`)
      }
      
      // Check if this is a new user invitation (they'll have is_employee in metadata but no password set)
      if (data.user?.user_metadata?.is_employee && next === '/set-password') {
        console.log('Auth callback: New employee invitation, redirecting to set-password')
        return NextResponse.redirect(`${requestUrl.origin}/set-password`)
      }

      console.log('Auth callback: Normal login flow, redirecting to:', next)
      // Normal login flow
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
    }
  }

  // Handle case where we receive a recovery request without a code
  // This happens when Supabase is not properly configured to use our callback
  if (type === 'recovery' && next === '/reset-password') {
    console.log('Auth callback: Recovery request without code - Supabase not configured properly')
    console.log('Auth callback: Redirecting to reset-password with instructions')
    return NextResponse.redirect(`${requestUrl.origin}/reset-password?error=supabase_config`)
  }

  console.log('Auth callback: No code present, redirecting to login')
  // Return the user to the login page if no code is present
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}