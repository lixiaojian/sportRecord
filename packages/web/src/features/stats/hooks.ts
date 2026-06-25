import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { statsApi } from './api';

export function useTrainingStats(enabled = true) {
  return useQuery({ queryKey: queryKeys.statsTraining, queryFn: statsApi.training, enabled });
}

export function useMatchStats(enabled = true) {
  return useQuery({ queryKey: queryKeys.statsMatch, queryFn: statsApi.match, enabled });
}

export function usePublicStats(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.statsPublic(userId) : ['stats', 'public'],
    queryFn: () => statsApi.public(userId!),
    enabled: !!userId,
  });
}
