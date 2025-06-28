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
  const { profile } = useAuth();

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
                {profile?.role === 'owner' && (
                  <Link
                    href="/reminders/rules/new"
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Create Rule
                  </Link>
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
                  {profile?.role === 'owner' && (
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
              {activeTab === 'rules' && profile?.role === 'owner' && <ReminderRulesList />}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}