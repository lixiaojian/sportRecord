import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { trashApi, type TrashType } from './api';

export function useTrash(page: number, pageSize: number, type?: TrashType) {
  return useQuery({
    queryKey: [...queryKeys.trash, { page, pageSize, type }],
    queryFn: () => trashApi.list({ page, pageSize, type }),
  });
}

export function useRestoreTrash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id }: { type: TrashType; id: string }) => trashApi.restore(type, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.trash });
      // 恢复后相关业务列表与统计也需刷新
      qc.invalidateQueries({ queryKey: queryKeys.workouts });
      qc.invalidateQueries({ queryKey: queryKeys.matches });
      qc.invalidateQueries({ queryKey: queryKeys.events });
      qc.invalidateQueries({ queryKey: queryKeys.exercises });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function usePurgeTrash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id }: { type: TrashType; id: string }) => trashApi.purge(type, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.trash }),
  });
}
