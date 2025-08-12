'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  created_at: string;
}

export default function TeamPage() {
  const { profile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | React.ReactNode>('');
  const supabase = createClient();

  useEffect(() => {
    if (profile?.company_id) {
      fetchTeamMembers();
    }
  }, [profile]);

  const fetchTeamMembers = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('mt_users')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteData.email,
          name: inviteData.name,
          companyId: profile?.company_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      if (result.emailSent) {
        setSuccess(
          <div>
            <p className="font-semibold mb-2">Invitation sent successfully!</p>
            <div className="bg-green-50 border border-green-200 rounded p-3 mt-2">
              <p className="text-sm mb-1">✉️ An invitation email has been sent to:</p>
              <p className="font-medium text-green-800">{inviteData.email}</p>
              <p className="text-xs mt-2 text-green-700">
                They'll receive a link to set up their password and access the system.
              </p>
            </div>
          </div>
        );
      } else {
        setSuccess(`Invitation sent to ${inviteData.email}!`);
      }
      setInviteData({ name: '', email: '' });
      setShowInviteForm(false);
      
      // Refresh team members after a short delay
      setTimeout(() => {
        fetchTeamMembers();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInviteData({
      ...inviteData,
      [e.target.name]: e.target.value,
    });
  };

  // Only admins can manage team
  if (profile?.role !== 'admin') {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="p-6">
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">Only company admins can manage team members.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            <button
              onClick={() => setShowInviteForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + Invite Employee
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          {/* Invite Form Modal */}
          {showInviteForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                <h2 className="text-lg font-semibold mb-4">Invite Employee</h2>
                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={inviteData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={inviteData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={inviteLoading}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {inviteLoading ? 'Sending invitation email...' : 'Send Invitation'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInviteForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Team Members List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Team Members</h2>
            </div>
            <div className="divide-y">
              {loading ? (
                <div className="p-6 text-center">Loading team members...</div>
              ) : teamMembers.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No team members yet. Invite your first employee!
                </div>
              ) : (
                teamMembers.map((member) => (
                  <div key={member.id} className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        member.role === 'admin' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role === 'admin' ? 'Admin' : 'Employee'}
                      </span>
                      <span className="text-sm text-gray-500">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}