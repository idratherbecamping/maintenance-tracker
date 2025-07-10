'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'admin' | 'employee';
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireRole, requireAdmin }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('ProtectedRoute: No user found, redirecting to login');
        router.push('/login');
        return;
      }

      if (requireRole && profile?.role !== requireRole) {
        console.log('ProtectedRoute: Role mismatch, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }

      if (requireAdmin && profile?.role !== 'admin') {
        console.log('ProtectedRoute: Not admin, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }
    }
  }, [user, profile, loading, requireRole, requireAdmin, router]);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('ProtectedRoute: Loading timeout, forcing redirect to login');
        router.push('/login');
      }
    }, 3000); // 3 second timeout

    return () => clearTimeout(timeout);
  }, [loading, router]);

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

  if (requireAdmin && profile?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
