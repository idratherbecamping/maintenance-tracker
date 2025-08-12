'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [invitationTokens, setInvitationTokens] = useState<{accessToken: string, refreshToken: string} | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Extract invitation data from URL hash WITHOUT establishing session yet
    extractInvitationData();
  }, []);

  const extractInvitationData = async () => {
    try {
      // Check if we have tokens in the URL hash (from invitation email)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (accessToken && type === 'invite') {
          // Store tokens for later use, but don't establish session yet
          setInvitationTokens({
            accessToken,
            refreshToken: refreshToken || ''
          });

          // Decode the JWT to get user info without establishing session
          try {
            const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
            setUserEmail(tokenPayload.email || '');
            setUserName(tokenPayload.user_metadata?.name || '');
          } catch (decodeError) {
            console.error('Error decoding token:', decodeError);
          }
          
          // Clean up the URL by removing the hash
          window.history.replaceState(null, '', window.location.pathname);
          return;
        }
      }

      // Check if user already has a session (fallback case)
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        setError('Invalid or expired invitation link. Please request a new invitation.');
        return;
      }

      // Get user metadata from existing session
      setUserEmail(user.email || '');
      setUserName(user.user_metadata?.name || '');
      
    } catch (err) {
      console.error('Error extracting invitation data:', err);
      setError('Invalid or expired invitation link. Please request a new invitation.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      if (!invitationTokens) {
        throw new Error('No invitation tokens found. Please request a new invitation.');
      }

      // Update password via API without establishing session first
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: invitationTokens.accessToken,
          password: password,
          refreshToken: invitationTokens.refreshToken
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to set password');
      }
      
      // Force a page refresh to clear any session conflicts, then redirect
      window.location.href = '/login?message=Password set successfully. Please sign in with your new password.';
    } catch (err: any) {
      console.error('Password update error:', err);
      setError(err.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Maintenance Tracker
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {userName ? `Hi ${userName}, ` : ''}Please set your password to get started
          </p>
          {userEmail && (
            <p className="mt-1 text-center text-sm text-gray-500">
              Account: {userEmail}
            </p>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="New password (min 8 characters)"
                minLength={8}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Confirm password"
                minLength={8}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-gray-600">
                Password must be at least 8 characters
              </span>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up...' : 'Set Password & Continue'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}