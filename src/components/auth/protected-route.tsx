'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'owner' | 'employee';
  requireOwner?: boolean;
}

export function ProtectedRoute({ children, requireRole, requireOwner }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (requireRole && profile?.role !== requireRole) {
        router.push('/dashboard');
        return;
      }

      if (requireOwner && profile?.role !== 'owner') {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, profile, loading, requireRole, requireOwner, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireRole && profile?.role !== requireRole) {
    return null;
  }

  if (requireOwner && profile?.role !== 'owner') {
    return null;
  }

  return <>{children}</>;
}
