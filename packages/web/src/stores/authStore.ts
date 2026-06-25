import { create } from 'zustand';
import type { CurrentUser } from '@sport-record/shared';

/**
 * 认证状态：access token 仅存内存（design.md 6.2），刷新页面经 /api/auth/refresh 恢复。
 * api.ts 在 401 刷新成功后调用 setAuth 更新 token，刷新失败调用 clearAuth。
 */
interface AuthState {
  user: CurrentUser | null;
  accessToken: string | null;
  setAuth: (payload: { user: CurrentUser; accessToken: string }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setAuth: ({ user, accessToken }) => set({ user, accessToken }),
  clearAuth: () => set({ user: null, accessToken: null }),
}));

export const isAuthenticated = (s: AuthState) => s.user !== null && s.accessToken !== null;
