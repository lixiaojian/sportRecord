import { api } from './api';
import { useAuthStore } from '../stores/authStore';
import type { CurrentUser, LoginInput, RegisterInput } from '@sport-record/shared';

interface AuthResult {
  accessToken: string;
  user: CurrentUser;
}

/** 登录：成功后写入 store（login 本身不会触发 401 刷新，跳过） */
export async function login(body: LoginInput): Promise<AuthResult> {
  const data = await api.post<AuthResult>('/auth/login', body, { skipRefresh: true });
  useAuthStore.getState().setAuth(data);
  return data;
}

/** 注册：后端注册后直接签发，写入 store */
export async function register(body: RegisterInput): Promise<AuthResult> {
  const data = await api.post<AuthResult>('/auth/register', body, { skipRefresh: true });
  useAuthStore.getState().setAuth(data);
  return data;
}

/** 登出：清 refresh cookie + 清 store */
export async function logout(): Promise<void> {
  await api.post('/auth/logout', undefined, { skipRefresh: true });
  useAuthStore.getState().clearAuth();
}

/**
 * 启动引导：尝试用 refresh cookie 恢复会话（design.md 6.2 验收点）。
 * 失败静默清空，页面按未登录渲染。
 */
export async function bootstrapAuth(): Promise<void> {
  try {
    const data = await api.post<AuthResult>('/auth/refresh', undefined, { skipRefresh: true });
    useAuthStore.getState().setAuth(data);
  } catch {
    useAuthStore.getState().clearAuth();
  }
}
