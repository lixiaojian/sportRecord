import type { ApiResponse, CurrentUser } from '@sport-record/shared';
import { useAuthStore } from '../stores/authStore';

/**
 * API client（design.md 5.1 / 6.2）
 * - 统一前缀 /api，credentials: include 带 refresh cookie
 * - 自动带 Authorization: Bearer <accessToken>
 * - 解析统一响应 { code, message, data }：code===0 返回 data，否则抛 ApiError
 * - 401（INVALID_TOKEN）自动刷新一次后重试；刷新失败抛 ApiError 由调用方/守卫处理
 */

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE = '/api';

/** 并发刷新去重：多个 401 共享同一次 refresh */
let refreshPromise: Promise<string | null> | null = null;

function refresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const json: ApiResponse<{ accessToken: string; user: CurrentUser }> = await res.json();
    if (json.code !== 0 || !json.data) return null;
    useAuthStore.getState().setAuth({
      accessToken: json.data.accessToken,
      user: json.data.user,
    });
    return json.data.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function parseBody<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json();
  if (json.code === 0) return json.data as T;
  throw new ApiError(String(json.code), json.message, res.status, json.data);
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** 跳过 401 自动刷新（refresh 自身用） */
  skipRefresh?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, skipRefresh, ...rest } = options;
  const finalHeaders = new Headers(headers);
  if (body !== undefined && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) finalHeaders.set('Authorization', `Bearer ${accessToken}`);

  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
  });

  if (res.status === 401 && !skipRefresh) {
    const newToken = await refresh();
    if (!newToken) {
      useAuthStore.getState().clearAuth();
      throw new ApiError('INVALID_REFRESH_TOKEN', '会话已过期，请重新登录', 401);
    }
    finalHeaders.set('Authorization', `Bearer ${newToken}`);
    const retry = await fetch(`${BASE}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
    });
    return parseBody<T>(retry);
  }

  return parseBody<T>(res);
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

// ===== API 方法 =====

// Dashboard
export async function getDashboardStats() {
  return api.get<import('@sport-record/shared').DashboardStats>('/dashboard');
}

// 训练统计
export async function getTrainingStats() {
  return api.get<import('@sport-record/shared').TrainingStats>('/stats/training');
}

// 比赛统计
export async function getMatchStats() {
  return api.get<import('@sport-record/shared').MatchStats>('/stats/match');
}

// 用户公开资料
export async function getUserProfile(userId: string) {
  return api.get<import('@sport-record/shared').UserProfile>(`/users/${userId}/profile`);
}

// 用户搜索
export async function searchUsers(q: string) {
  return api.get<import('@sport-record/shared').UserSearchItem[]>(
    `/users/search?q=${encodeURIComponent(q)}`,
  );
}
