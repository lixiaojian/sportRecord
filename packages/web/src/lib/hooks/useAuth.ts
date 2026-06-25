import { useMutation } from '@tanstack/react-query';
import { login as loginApi, register as registerApi, logout as logoutApi } from '../auth';
import { queryClient } from '../query';
import { useAuthStore } from '../../stores/authStore';
import type { LoginInput, RegisterInput } from '@sport-record/shared';

/**
 * 登录 mutation：成功写入 store。导航由调用方在 onSuccess 后处理。
 */
export function useLogin() {
  return useMutation({ mutationFn: (input: LoginInput) => loginApi(input) });
}

/**
 * 注册 mutation：成功写入 store。
 */
export function useRegister() {
  return useMutation({ mutationFn: (input: RegisterInput) => registerApi(input) });
}

/**
 * 登出 mutation：清 store + 失效所有缓存。
 */
export function useLogout() {
  return useMutation({
    mutationFn: () => logoutApi(),
    onSettled: () => {
      queryClient.clear();
    },
  });
}

/** 当前用户（store 派生，非 query） */
export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

/** 是否已登录 */
export function useIsAuthenticated() {
  return useAuthStore((s) => s.user !== null && s.accessToken !== null);
}
