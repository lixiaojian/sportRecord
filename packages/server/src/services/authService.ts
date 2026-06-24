import {
  registerSchema,
  loginSchema,
  type RegisterInput,
  type LoginInput,
} from '@sport-record/shared';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signAccess, signRefresh, verifyRefresh } from '../lib/jwt.js';
import { CONFLICT, UNAUTHORIZED, FORBIDDEN, AppError } from '../lib/errors.js';

/**
 * 认证服务（design.md 3.1）。
 * - 注册：用户名唯一、scrypt 哈希、昵称默认=用户名
 * - 登录：失败 5 次锁 15 分钟，成功清零并签 access+refresh
 *
 * zod 校验在路由中间件层完成，service 层再做唯一性等业务校验；
 * 为防御性，service 仍对 schema 复跑一次。
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export type SafeUser = {
  id: string;
  username: string;
  nickname: string;
  role: 'user' | 'admin';
};

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
};

export type RefreshResult = {
  accessToken: string;
  user: SafeUser;
};

function toSafeUser(u: { id: string; username: string; nickname: string; role: string }): SafeUser {
  return { id: u.id, username: u.username, nickname: u.nickname, role: u.role as 'user' | 'admin' };
}

export async function register(input: RegisterInput) {
  // 防御性复校验：service 也可能被直接调用
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', '请求参数校验失败', 422, parsed.error);
  }
  const { username, password, nickname } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    throw CONFLICT('用户名已存在', 'CONFLICT');
  }

  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: {
      username,
      passwordHash,
      nickname: nickname ?? username,
      role: 'user',
    },
  });
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', '请求参数校验失败', 422, parsed.error);
  }
  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });

  // 用户不存在：仍抛 401，避免泄漏用户是否存在
  if (!user) {
    throw UNAUTHORIZED('用户名或密码错误', 'INVALID_CREDENTIALS');
  }

  if (user.disabled) {
    throw FORBIDDEN('账号已被禁用', 'ACCOUNT_DISABLED');
  }

  // 锁定检查：未到解锁时间则拒绝
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw UNAUTHORIZED('账号已锁定，请稍后再试', 'ACCOUNT_LOCKED');
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const newAttempts = user.failedAttempts + 1;
    // 达到阈值则设置锁定截止时间
    const lockedUntil =
      newAttempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: newAttempts, lockedUntil },
    });
    throw UNAUTHORIZED('用户名或密码错误', 'INVALID_CREDENTIALS');
  }

  // 成功：清零失败计数与锁定
  await prisma.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null },
  });

  const safe = toSafeUser(user);
  return {
    accessToken: signAccess({
      userId: user.id,
      username: user.username,
      role: safe.role,
    }),
    refreshToken: signRefresh({ userId: user.id }),
    user: safe,
  };
}

/**
 * 刷新 access token。
 * - 验证 refresh token 签名/类型
 * - 校验用户仍存在且未禁用
 * - refresh 不轮换：仍为无状态 JWT，不维护黑名单；refresh 30 天有效期内可反复换 access
 */
export async function refresh(refreshToken: string): Promise<RefreshResult> {
  let userId: string;
  try {
    userId = verifyRefresh(refreshToken).userId;
  } catch {
    throw UNAUTHORIZED('refresh token 无效', 'INVALID_REFRESH_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw UNAUTHORIZED('refresh token 无效', 'INVALID_REFRESH_TOKEN');
  }
  if (user.disabled) {
    throw FORBIDDEN('账号已被禁用', 'ACCOUNT_DISABLED');
  }

  const safe = toSafeUser(user);
  return {
    accessToken: signAccess({
      userId: user.id,
      username: user.username,
      role: safe.role,
    }),
    user: safe,
  };
}
