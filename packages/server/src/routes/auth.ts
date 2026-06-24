import { Router } from 'express';
import { registerSchema, loginSchema } from '@sport-record/shared';
import { validate } from '../lib/validate.js';
import { success } from '../lib/response.js';
import { authenticate } from '../lib/auth.js';
import { register, login, refresh } from '../services/authService.js';
import { UNAUTHORIZED } from '../lib/errors.js';

export const authRouter = Router();

/**
 * refresh cookie 配置（design.md 3.2）。
 * - httpOnly：防 JS 读取
 * - sameSite=lax：防 CSRF（跨站 POST 不带 cookie）
 * - secure：生产同源部署走 https；dev 本地 http 关闭，由 NODE_ENV 控制
 * - path=/api/auth：仅认证接口需要，缩小暴露面
 */
const REFRESH_COOKIE = 'refresh';
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 天

function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
    path: '/api/auth',
    maxAge: REFRESH_TTL_MS,
  };
}

/** 从请求中取 refresh cookie，缺失抛 401 */
function readRefreshCookie(req: { cookies?: Record<string, string> }): string {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw UNAUTHORIZED('refresh token 无效', 'INVALID_REFRESH_TOKEN');
  return token;
}

authRouter.post('/register', validate(registerSchema, 'body'), async (req, res) => {
  const user = await register(req.body);
  const result = await login({ username: user.username, password: req.body.password });
  res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());
  success(res, { accessToken: result.accessToken, user: result.user }, 201);
});

authRouter.post('/login', validate(loginSchema, 'body'), async (req, res) => {
  const result = await login(req.body);
  res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());
  success(res, { accessToken: result.accessToken, user: result.user });
});

authRouter.post('/refresh', async (req, res) => {
  const token = readRefreshCookie(req);
  const result = await refresh(token);
  success(res, { accessToken: result.accessToken, user: result.user });
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  success(res, null);
});

authRouter.get('/me', authenticate, async (req, res) => {
  success(res, {
    id: req.user!.id,
    username: req.user!.username,
    role: req.user!.role,
  });
});
