import rateLimit from 'express-rate-limit';
import { fail } from './response.js';

/**
 * 分级限流（design.md 5.5）
 * - 登录/注册：10 次 / 15 分钟
 * - 通用 API：100 次 / 分钟
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    fail(res, 'RATE_LIMITED', '请求过于频繁，请稍后再试', 429);
  },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    fail(res, 'RATE_LIMITED', '请求过于频繁，请稍后再试', 429);
  },
});
