import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyAccess } from './jwt.js';
import { UNAUTHORIZED, FORBIDDEN } from './errors.js';

/**
 * auth 中间件与 ACL（design.md 3.3）。
 */

export type AuthUser = {
  id: string;
  username: string;
  role: 'user' | 'admin';
};

// 扩展 Express Request，挂载当前用户
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length);
}

/** 解析 access token 并挂 req.user；失败抛 401 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next(UNAUTHORIZED('未登录', 'UNAUTHORIZED'));
    return;
  }
  try {
    const payload = verifyAccess(token);
    req.user = { id: payload.userId, username: payload.username, role: payload.role };
    next();
  } catch {
    next(UNAUTHORIZED('token 无效或已过期', 'INVALID_TOKEN'));
  }
}

/**
 * 游客也放行：无 token 时 req.user 为 undefined（游客）；
 * 有 token 但无效时仍抛 401（不静默降级，避免误用）。
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }
  try {
    const payload = verifyAccess(token);
    req.user = { id: payload.userId, username: payload.username, role: payload.role };
    next();
  } catch {
    next(UNAUTHORIZED('token 无效或已过期', 'INVALID_TOKEN'));
  }
}

/** 角色校验：需在 authenticate 之后使用 */
export function requireRole(...roles: AuthUser['role'][]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(UNAUTHORIZED('未登录', 'UNAUTHORIZED'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(FORBIDDEN('权限不足', 'FORBIDDEN'));
      return;
    }
    next();
  };
}

/**
 * ACL：判断资源是否属于指定用户。
 * resource 形如 { userId } / { creatorId }，命中任一即视为所有者。
 */
export function isOwner(
  resource: { userId?: string; creatorId?: string },
  userId: string,
): boolean {
  return resource.userId === userId || resource.creatorId === userId;
}
