import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    stats: (companyId: string) => ['dashboard', 'stats', companyId] as const,
    recentMaintenance: (companyId: string) => ['dashboard', 'recent-maintenance', companyId] as const,
  },
  vehicles: {
    all: ['vehicles'] as const,
    list: (companyId: string) => ['vehicles', 'list', companyId] as const,
    detail: (id: string) => ['vehicles', 'detail', id] as const,
  },
  maintenance: {
    all: ['maintenance'] as const,
    list: (companyId: string, filters?: any) => ['maintenance', 'list', companyId, filters] as const,
    history: (companyId: string, filters?: any) => ['maintenance', 'history', companyId, filters] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    data: (companyId: string, filters?: any) => ['analytics', 'data', companyId, filters] as const,
  },
  reminders: {
    all: ['reminders'] as const,
    active: (companyId: string) => ['reminders', 'active', companyId] as const,
    rules: (companyId: string) => ['reminders', 'rules', companyId] as const,
  },
} as const;