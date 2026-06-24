import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { basePrisma } from '../lib/prisma.js';

const UNIQUE = 'routeuser';

function app() {
  // authRouter 已在 createApp 内挂载到 /api/auth
  return createApp();
}

describe('auth 路由', () => {
  beforeEach(async () => {
    await basePrisma.user.deleteMany({ where: { username: UNIQUE } });
  });

  it('注册：201，返回 access + user，设置 httpOnly refresh cookie', async () => {
    const res = await request(app())
      .post('/api/auth/register')
      .send({ username: UNIQUE, password: 'pass1234' });
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.username).toBe(UNIQUE);
    expect(res.body.data.user.role).toBe('user');
    // 不在 body 里返回 refreshToken
    expect(res.body.data.refreshToken).toBeUndefined();

    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookie = String(setCookie);
    expect(cookie).toMatch(/refresh=/);
    expect(cookie).toMatch(/httponly/i);
  });

  it('注册 schema 校验失败 → 422', async () => {
    const res = await request(app())
      .post('/api/auth/register')
      .send({ username: 'ab', password: 'short' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('重复注册 → 409', async () => {
    await request(app())
      .post('/api/auth/register')
      .send({ username: UNIQUE, password: 'pass1234' });
    const res = await request(app())
      .post('/api/auth/register')
      .send({ username: UNIQUE, password: 'pass1234' });
    expect(res.status).toBe(409);
  });

  it('登录：200，返回 access + 设置 cookie', async () => {
    await request(app())
      .post('/api/auth/register')
      .send({ username: UNIQUE, password: 'pass1234' });
    const res = await request(app())
      .post('/api/auth/login')
      .send({ username: UNIQUE, password: 'pass1234' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('登录密码错误 → 401', async () => {
    const res = await request(app())
      .post('/api/auth/login')
      .send({ username: UNIQUE, password: 'wrong9999' });
    expect(res.status).toBe(401);
  });

  it('全流程：register → me → refresh → logout，cookie 跨请求持久', async () => {
    const agent = request.agent(app());
    const reg = await agent
      .post('/api/auth/register')
      .send({ username: UNIQUE, password: 'pass1234' });
    const access = reg.body.data.accessToken as string;

    const me = await agent.get('/api/auth/me').set('Authorization', `Bearer ${access}`);
    expect(me.status).toBe(200);
    expect(me.body.data.username).toBe(UNIQUE);

    const rf = await agent.post('/api/auth/refresh');
    expect(rf.status).toBe(200);
    expect(rf.body.data.accessToken).toBeTruthy();

    const lo = await agent.post('/api/auth/logout');
    expect(lo.status).toBe(200);

    // logout 后 cookie 被清，refresh 失败
    const rf2 = await agent.post('/api/auth/refresh');
    expect(rf2.status).toBe(401);
  });

  it('me 无 token → 401', async () => {
    const res = await request(app()).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('refresh 无 cookie → 401', async () => {
    const res = await request(app()).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('登录失败 5 次后锁定，正确密码也 401', async () => {
    await request(app())
      .post('/api/auth/register')
      .send({ username: UNIQUE, password: 'pass1234' });
    for (let i = 0; i < 5; i++) {
      const r = await request(app())
        .post('/api/auth/login')
        .send({ username: UNIQUE, password: 'wrong9999' });
      expect(r.status).toBe(401);
    }
    const r = await request(app())
      .post('/api/auth/login')
      .send({ username: UNIQUE, password: 'pass1234' });
    expect(r.status).toBe(401);
    expect(r.body.code).toBe('ACCOUNT_LOCKED');
  });
});
