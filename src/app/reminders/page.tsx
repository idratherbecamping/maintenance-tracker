'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { ReminderRulesList } from '@/components/reminders/reminder-rules-list';
import { ActiveRemindersList } from '@/components/reminders/active-reminders-list';
import { useAuth } from '@/contexts/auth-context';

export default function RemindersPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'rules'>('active');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const { profile } = useAuth();

  const handleGenerateReminders = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/reminders/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setLastGenerated(new Date().toLocaleString());
        alert(`Success! Generated ${data.generated_count} reminders.`);
        // Refresh the active reminders list
        window.location.reload();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating reminders:', error);
      alert('Failed to generate reminders. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                  Maintenance Reminders
                </h2>
                <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    Automated alerts for scheduled maintenance
                  </div>
                </div>
              </div>
              <div className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
                {(profile?.role === 'admin' || profile?.role === 'employee') && (
                  <>
                    <button
                      onClick={handleGenerateReminders}
                      disabled={isGenerating}
                      title="This will show all active reminders including dismissed ones"
                      className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Fetching...
                        </>
                      ) : (
                        'Refresh Reminders'
                      )}
                    </button>
                    <Link
                      href="/reminders/rules/new"
                      className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      Create Rule
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mt-8">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('active')}
                    className={`${
                      activeTab === 'active'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium`}
                  >
                    Active Reminders
                  </button>
                  {(profile?.role === 'admin' || profile?.role === 'employee') && (
                    <button
                      onClick={() => setActiveTab('rules')}
                      className={`${
                        activeTab === 'rules'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium`}
                    >
                      Reminder Rules
                    </button>
                  )}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'active' && <ActiveRemindersList />}
              {activeTab === 'rules' && (profile?.role === 'admin' || profile?.role === 'employee') && <ReminderRulesList />}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
