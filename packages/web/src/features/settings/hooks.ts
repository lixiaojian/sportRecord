import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from './api';
import { useAuthStore } from '../../stores/authStore';
import type { ChangePasswordInput, UpdateProfileInput } from '@sport-record/shared';

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (body: UpdateProfileInput) => usersApi.updateMe(body),
    onSuccess: (profile) => {
      // 同步更新 store 中的当前用户（保留 role）
      const cur = useAuthStore.getState().user;
      if (cur) {
        setAuth({
          user: { ...cur, ...profile },
          accessToken: useAuthStore.getState().accessToken!,
        });
      }
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordInput) => usersApi.changePassword(body),
  });
}
