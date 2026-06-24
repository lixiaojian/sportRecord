import { describe, it, expect, beforeEach } from 'vitest';
import { prisma, basePrisma } from '../lib/prisma.js';
import { register, login, refresh, type LoginResult, type RefreshResult } from './authService.js';

const UNIQUE = 'reguser';

async function seedUser(username = UNIQUE, password = 'pass1234') {
  return register({ username, password });
}

describe('authService.register', () => {
  beforeEach(async () => {
    await basePrisma.user.deleteMany({ where: { username: UNIQUE } });
  });

  it('注册成功：创建用户，role=user，昵称默认为用户名，密码以 scrypt 哈希存储', async () => {
    const user = await register({ username: UNIQUE, password: 'pass1234' });

    expect(user.id).toBeTruthy();
    expect(user.username).toBe(UNIQUE);
    expect(user.role).toBe('user');
    expect(user.nickname).toBe(UNIQUE); // 默认昵称 = 用户名
    expect(user.passwordHash).not.toBe('pass1234');
    expect(user.passwordHash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);

    // 库中确实存在
    const dbUser = await prisma.user.findUnique({ where: { username: UNIQUE } });
    expect(dbUser?.id).toBe(user.id);
  });

  it('提供昵称时使用提供的昵称', async () => {
    const user = await register({ username: UNIQUE, password: 'pass1234', nickname: '小明' });
    expect(user.nickname).toBe('小明');
  });

  it('用户名已存在抛 CONFLICT', async () => {
    await register({ username: UNIQUE, password: 'pass1234' });
    await expect(register({ username: UNIQUE, password: 'pass1234' })).rejects.toMatchObject({
      code: 'CONFLICT',
      statusCode: 409,
    });
  });

  it('密码强度不符（纯数字）抛 VALIDATION_ERROR', async () => {
    await expect(register({ username: UNIQUE, password: '12345678' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
    // 库中不存在
    const dbUser = await prisma.user.findUnique({ where: { username: UNIQUE } });
    expect(dbUser).toBeNull();
  });
});

describe('authService.login', () => {
  beforeEach(async () => {
    await basePrisma.user.deleteMany({ where: { username: UNIQUE } });
    await seedUser();
  });

  it('登录成功：返回 access + refresh，并重置失败计数', async () => {
    // 先制造一次失败
    await expect(login({ username: UNIQUE, password: 'wrong9999' })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
    const afterFail = await prisma.user.findUniqueOrThrow({ where: { username: UNIQUE } });
    expect(afterFail.failedAttempts).toBe(1);

    const result: LoginResult = await login({ username: UNIQUE, password: 'pass1234' });
    expect(result.accessToken.split('.')).toHaveLength(3);
    expect(result.refreshToken.split('.')).toHaveLength(3);
    expect(result.user.username).toBe(UNIQUE);
    expect(result.user.role).toBe('user');

    // 失败计数应被清零
    const after = await prisma.user.findUniqueOrThrow({ where: { username: UNIQUE } });
    expect(after.failedAttempts).toBe(0);
    expect(after.lockedUntil).toBeNull();
  });

  it('密码错误：失败计数 +1，不签发 token', async () => {
    await expect(login({ username: UNIQUE, password: 'wrong9999' })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
    });
    const after = await prisma.user.findUniqueOrThrow({ where: { username: UNIQUE } });
    expect(after.failedAttempts).toBe(1);
  });

  it('连续失败 5 次后锁定 15 分钟，期间拒绝登录', async () => {
    for (let i = 0; i < 5; i++) {
      await expect(login({ username: UNIQUE, password: 'wrong9999' })).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
      });
    }
    const locked = await prisma.user.findUniqueOrThrow({ where: { username: UNIQUE } });
    expect(locked.failedAttempts).toBe(5);
    expect(locked.lockedUntil).not.toBeNull();
    // 锁定后即使密码正确也拒绝
    await expect(login({ username: UNIQUE, password: 'pass1234' })).rejects.toMatchObject({
      code: 'ACCOUNT_LOCKED',
    });
  });

  it('用户不存在：抛 UNAUTHORIZED（不泄漏是否存在）', async () => {
    await expect(login({ username: 'nobodyuser', password: 'pass1234' })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
    });
  });

  it('被禁用用户：抛 FORBIDDEN', async () => {
    await basePrisma.user.update({
      where: { username: UNIQUE },
      data: { disabled: true },
    });
    await expect(login({ username: UNIQUE, password: 'pass1234' })).rejects.toMatchObject({
      code: 'ACCOUNT_DISABLED',
      statusCode: 403,
    });
  });
});

describe('authService.refresh', () => {
  beforeEach(async () => {
    await basePrisma.user.deleteMany({ where: { username: UNIQUE } });
    await seedUser();
  });

  it('有效 refresh token：返回新 access，user 信息正确', async () => {
    const loginResult = await login({ username: UNIQUE, password: 'pass1234' });
    const result: RefreshResult = await refresh(loginResult.refreshToken);

    expect(result.accessToken.split('.')).toHaveLength(3);
    expect(result.user.id).toBe(loginResult.user.id);
    expect(result.user.username).toBe(UNIQUE);
  });

  it('无效 refresh token 抛 UNAUTHORIZED', async () => {
    await expect(refresh('not-a-token')).rejects.toMatchObject({
      code: 'INVALID_REFRESH_TOKEN',
      statusCode: 401,
    });
  });

  it('access token 不能当作 refresh token 使用', async () => {
    const loginResult = await login({ username: UNIQUE, password: 'pass1234' });
    await expect(refresh(loginResult.accessToken)).rejects.toMatchObject({
      code: 'INVALID_REFRESH_TOKEN',
      statusCode: 401,
    });
  });

  it('refresh token 指向的用户不存在时抛 UNAUTHORIZED', async () => {
    const loginResult = await login({ username: UNIQUE, password: 'pass1234' });
    // 物理删除用户（绕过软删）
    await basePrisma.user.delete({ where: { id: loginResult.user.id } });
    await expect(refresh(loginResult.refreshToken)).rejects.toMatchObject({
      code: 'INVALID_REFRESH_TOKEN',
      statusCode: 401,
    });
  });

  it('被禁用用户不能刷新 token', async () => {
    const loginResult = await login({ username: UNIQUE, password: 'pass1234' });
    await basePrisma.user.update({
      where: { id: loginResult.user.id },
      data: { disabled: true },
    });
    await expect(refresh(loginResult.refreshToken)).rejects.toMatchObject({
      code: 'ACCOUNT_DISABLED',
      statusCode: 403,
    });
  });
});
