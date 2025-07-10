'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSendTest = async () => {
    if (!email) {
      setResult('Please enter an email address');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testEmail: email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`Success: ${data.message}`);
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="py-10">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Email Notifications</h1>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Test Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email to test"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleSendTest}
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Test Email'}
                </button>

                {result && (
                  <div className={`p-3 rounded-md ${
                    result.startsWith('Success') 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {result}
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h3 className="text-sm font-medium text-blue-900">Setup Instructions:</h3>
                <ol className="mt-2 text-sm text-blue-700 space-y-1">
                  <li>1. Sign up for a free Resend account at resend.com</li>
                  <li>2. Add your domain or use their onboarding domain</li>
                  <li>3. Get your API key from the dashboard</li>
                  <li>4. Add RESEND_API_KEY to your environment variables</li>
                  <li>5. Add RESEND_FROM_EMAIL to your environment variables</li>
                </ol>
                <p className="mt-2 text-xs text-blue-600">
                  Environment variables needed: RESEND_API_KEY, RESEND_FROM_EMAIL
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}