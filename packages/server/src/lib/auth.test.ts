import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Request, type Response, type NextFunction } from 'express';
import { authenticate, optionalAuth, requireRole, isOwner } from './auth.js';
import { signAccess } from './jwt.js';
import { success } from './response.js';
import { basePrisma } from './prisma.js';
import { register } from '../services/authService.js';
import { errorHandler } from './errorHandler.js';

const UNIQUE = 'mwuser';

/** 构造挂载指定中间件的测试 app，GET /api/me 返回 req.user */
function makeApp(mw: (req: Request, res: Response, next: NextFunction) => void) {
  const app = express();
  app.get('/api/me', mw, (req, res) => success(res, req.user ?? null));
  app.use(errorHandler);
  return app;
}

describe('authenticate', () => {
  beforeEach(async () => {
    await basePrisma.user.deleteMany({ where: { username: UNIQUE } });
  });

  it('无 Authorization 头返回 401', async () => {
    const res = await request(makeApp(authenticate)).get('/api/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('格式错误的 token 返回 401', async () => {
    const res = await request(makeApp(authenticate))
      .get('/api/me')
      .set('Authorization', 'Bearer not-a-token');
    expect(res.status).toBe(401);
  });

  it('有效 access token 挂载 req.user', async () => {
    const user = await register({ username: UNIQUE, password: 'pass1234' });
    const token = signAccess({ userId: user.id, username: user.username, role: 'user' });
    const res = await request(makeApp(authenticate))
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: user.id, username: UNIQUE, role: 'user' });
  });

  it('非 Bearer 前缀返回 401', async () => {
    const user = await register({ username: UNIQUE, password: 'pass1234' });
    const token = signAccess({ userId: user.id, username: user.username, role: 'user' });
    const res = await request(makeApp(authenticate)).get('/api/me').set('Authorization', token);
    expect(res.status).toBe(401);
  });
});

describe('optionalAuth', () => {
  beforeEach(async () => {
    await basePrisma.user.deleteMany({ where: { username: UNIQUE } });
  });

  it('无 token 放行，req.user 为 null（游客）', async () => {
    const res = await request(makeApp(optionalAuth)).get('/api/me');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it('有效 token 挂载 req.user', async () => {
    const user = await register({ username: UNIQUE, password: 'pass1234' });
    const token = signAccess({ userId: user.id, username: user.username, role: 'user' });
    const res = await request(makeApp(optionalAuth))
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(user.id);
  });

  it('无效 token 返回 401（不静默降级为游客）', async () => {
    const res = await request(makeApp(optionalAuth))
      .get('/api/me')
      .set('Authorization', 'Bearer bad');
    expect(res.status).toBe(401);
  });
});

describe('requireRole', () => {
  beforeEach(async () => {
    await basePrisma.user.deleteMany({ where: { username: UNIQUE } });
  });

  function roleApp() {
    const app = express();
    app.get('/api/admin', authenticate, requireRole('admin'), (req, res) => success(res, req.user));
    app.use(errorHandler);
    return app;
  }

  it('普通用户访问 admin 接口返回 403', async () => {
    const user = await register({ username: UNIQUE, password: 'pass1234' });
    const token = signAccess({ userId: user.id, username: user.username, role: 'user' });
    const res = await request(roleApp()).get('/api/admin').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('admin 用户访问 admin 接口放行', async () => {
    const user = await register({ username: UNIQUE, password: 'pass1234' });
    const token = signAccess({ userId: user.id, username: user.username, role: 'admin' });
    const res = await request(roleApp()).get('/api/admin').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('isOwner', () => {
  it('userId 匹配返回 true', () => {
    expect(isOwner({ userId: 'u1' }, 'u1')).toBe(true);
  });

  it('creatorId 匹配返回 true', () => {
    expect(isOwner({ creatorId: 'u1' }, 'u1')).toBe(true);
  });

  it('不匹配返回 false', () => {
    expect(isOwner({ userId: 'u2' }, 'u1')).toBe(false);
    expect(isOwner({ creatorId: 'u2' }, 'u1')).toBe(false);
  });

  it('无 owner 字段返回 false', () => {
    expect(isOwner({}, 'u1')).toBe(false);
  });
});
