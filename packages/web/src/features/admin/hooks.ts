import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { adminUsersApi } from './api';
import type { UpdateUserByAdminInput } from '@sport-record/shared';

export function useAdminUsers(page: number, pageSize: number) {
  return useQuery({
    queryKey: [...queryKeys.users, { page, pageSize }],
    queryFn: () => adminUsersApi.list({ page, pageSize }),
  });
}

export function useUpdateUserByAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserByAdminInput }) =>
      adminUsersApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users }),
  });
}
