import jwt from 'jsonwebtoken';

/**
 * JWT 工具（design.md 3.2）
 * - access：1 小时，载荷含 userId/username/role/type=access
 * - refresh：30 天，载荷含 userId/type=refresh
 *
 * 密钥读 JWT_SECRET env，缺失时启动期直接抛错（fail fast），
 * 不默认弱密钥。type 字段用于防止 access/refresh 互用。
 */

const ACCESS_TTL = '1h';
const REFRESH_TTL = '30d';

export type AccessPayload = {
  userId: string;
  username: string;
  role: 'user' | 'admin';
  type: 'access';
};

export type RefreshPayload = {
  userId: string;
  type: 'refresh';
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET 未配置');
  return secret;
}

export function signAccess(p: Omit<AccessPayload, 'type'>): string {
  return jwt.sign({ ...p, type: 'access' }, getSecret(), { expiresIn: ACCESS_TTL });
}

export function verifyAccess(token: string): AccessPayload {
  const decoded = jwt.verify(token, getSecret()) as jwt.JwtPayload;
  if (decoded.type !== 'access') throw new jwt.JsonWebTokenError('非 access token');
  return decoded as unknown as AccessPayload;
}

export function signRefresh(p: Omit<RefreshPayload, 'type'>): string {
  return jwt.sign({ ...p, type: 'refresh' }, getSecret(), { expiresIn: REFRESH_TTL });
}

export function verifyRefresh(token: string): RefreshPayload {
  const decoded = jwt.verify(token, getSecret()) as jwt.JwtPayload;
  if (decoded.type !== 'refresh') throw new jwt.JsonWebTokenError('非 refresh token');
  return decoded as unknown as RefreshPayload;
}
