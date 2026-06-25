import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

/**
 * TanStack Query 默认配置（design.md 6.2）
 * - 401/403 不重试（鉴权错误重试无意义）
 * - 失败最多重试 1 次
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403))
          return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});
