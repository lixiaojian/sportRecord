import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api';

/**
 * Dashboard 数据查询
 */
export function useDashboardStats(enabled: boolean = true) {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 分钟
  });
}
