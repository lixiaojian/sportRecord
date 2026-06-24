import { describe, it, expect, afterEach, vi } from 'vitest';
import { signAccess, verifyAccess, signRefresh, verifyRefresh } from './jwt.js';

const payload = { userId: 'u-1', username: 'alice', role: 'user' as const };

describe('jwt', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('signAccess 返回三段式 JWT', () => {
    const token = signAccess(payload);
    expect(token.split('.')).toHaveLength(3);
  });

  it('verifyAccess 解出载荷且含 userId/username/role/type', () => {
    const token = signAccess(payload);
    const decoded = verifyAccess(token);
    expect(decoded.userId).toBe('u-1');
    expect(decoded.username).toBe('alice');
    expect(decoded.role).toBe('user');
    expect(decoded.type).toBe('access');
  });

  it('verifyAccess 拒绝 refresh token（类型不匹配）', () => {
    const refresh = signRefresh({ userId: 'u-1' });
    expect(() => verifyAccess(refresh)).toThrow();
  });

  it('verifyAccess 拒绝篡改的 token', () => {
    const token = signAccess(payload);
    const tampered = token.slice(0, -4) + 'AAAA';
    expect(() => verifyAccess(tampered)).toThrow();
  });

  it('verifyRefresh 解出 userId 且 type=refresh', () => {
    const token = signRefresh({ userId: 'u-1' });
    const decoded = verifyRefresh(token);
    expect(decoded.userId).toBe('u-1');
    expect(decoded.type).toBe('refresh');
  });

  it('verifyRefresh 拒绝 access token', () => {
    const access = signAccess(payload);
    expect(() => verifyRefresh(access)).toThrow();
  });
});
