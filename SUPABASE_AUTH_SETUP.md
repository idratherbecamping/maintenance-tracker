# Supabase Authentication Setup Guide

## Password Reset Flow Configuration

The password reset flow requires proper configuration of Supabase authentication settings. Follow these steps to fix the issue:

### 1. Configure Site URL and Redirect URLs

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings** → **URL Configuration**
3. Set the following values:

**For Development:**
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: 
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/reset-password`

**For Production:**
- **Site URL**: `https://your-domain.com`
- **Redirect URLs**: 
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/reset-password`

### 2. Email Template Configuration

1. Go to **Authentication** → **Email Templates**
2. Select **Password Reset** template
3. Update the **Action URL** to use your auth callback:

**For Development:**
```
{{ .SiteURL }}/auth/callback?next=/reset-password&type=recovery
```

**For Production:**
```
{{ .SiteURL }}/auth/callback?next=/reset-password&type=recovery
```

### 3. Verify Configuration

After making these changes:

1. Test the forgot password flow
2. Check that the email link redirects to `/auth/callback` instead of the Supabase verify endpoint
3. Verify that the reset password page receives a valid session

### 4. Alternative: Direct Reset Password URL

If the auth callback approach doesn't work, you can configure Supabase to redirect directly to the reset password page:

1. In **Email Templates** → **Password Reset**
2. Set **Action URL** to:
   ```
   {{ .SiteURL }}/reset-password?token={{ .Token }}&type=recovery
   ```

This will work with the current implementation that handles the recovery token directly.

### 5. Debugging

If you're still having issues:

1. Check the browser console for error messages
2. Verify that the Supabase project URL and keys are correct
3. Ensure the auth callback route is working properly
4. Test with the debug information displayed on the reset password page

### 6. Environment Variables

Make sure your `.env.local` has the correct Supabase configuration:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 7. Testing the Flow

1. Go to `/forgot-password`
2. Enter your email address
3. Check your email for the reset link
4. Click the link and verify it redirects to `/reset-password`
5. Enter a new password and submit
6. Verify you're redirected to login with a success message

## Common Issues

### Issue: Link redirects to Supabase verify endpoint
**Solution**: Update the Site URL and Redirect URLs in Supabase dashboard

### Issue: "Invalid reset link" error
**Solution**: Check that the auth callback is properly exchanging the code for a session

### Issue: Session not established
**Solution**: Verify the Supabase client configuration and environment variables

### Issue: Email not received
**Solution**: Check spam folder and verify email configuration in Supabase

## Support

If you continue to have issues:

1. Check the browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a fresh browser session
4. Check Supabase logs for authentication errors 