import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../app.js';
import { userRouter } from './user.js';
import { basePrisma } from '../lib/prisma.js';
import { registerUser } from '../test/helpers.js';

const ME = 'usme';
const OTHER = 'usother';
const ADMIN = 'usadmin';

function app() {
  return createApp((a) => a.use('/api/users', userRouter));
}

async function makeAdmin(a: Express, username: string) {
  const { userId } = await registerUser(a, username);
  await basePrisma.user.update({ where: { id: userId }, data: { role: 'admin' } });
  const res = await request(a).post('/api/auth/login').send({ username, password: 'pass1234' });
  return { accessToken: res.body.data.accessToken as string, userId };
}

describe('user 路由', () => {
  beforeEach(async () => {
    await basePrisma.user.deleteMany({ where: { username: { in: [ME, OTHER, ADMIN] } } });
  });

  describe('GET /（admin 列表）', () => {
    it('无 token → 401', async () => {
      const res = await request(app()).get('/api/users');
      expect(res.status).toBe(401);
    });

    it('普通用户 → 403', async () => {
      const a = app();
      const { accessToken } = await registerUser(a, ME);
      const res = await request(a).get('/api/users').set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(403);
    });

    it('admin → 200，返回分页用户列表', async () => {
      const a = app();
      await registerUser(a, ME);
      const admin = await makeAdmin(a, ADMIN);
      const res = await request(a)
        .get('/api/users')
        .set('Authorization', `Bearer ${admin.accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('list');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data.total).toBeGreaterThanOrEqual(2);
      // 不含密码哈希
      expect(res.body.data.list[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('PATCH /:id（admin 禁用/改角色）', () => {
    it('admin 禁用用户 → 200，disabled 生效', async () => {
      const a = app();
      const { userId } = await registerUser(a, ME);
      const admin = await makeAdmin(a, ADMIN);
      const res = await request(a)
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ disabled: true });
      expect(res.status).toBe(200);
      expect(res.body.data.disabled).toBe(true);
    });

    it('admin 改角色 → 200', async () => {
      const a = app();
      const { userId } = await registerUser(a, ME);
      const admin = await makeAdmin(a, ADMIN);
      const res = await request(a)
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ role: 'admin' });
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('admin');
    });

    it('普通用户 → 403', async () => {
      const a = app();
      const me = await registerUser(a, ME);
      const other = await registerUser(a, OTHER);
      const res = await request(a)
        .patch(`/api/users/${other.userId}`)
        .set('Authorization', `Bearer ${me.accessToken}`)
        .send({ disabled: true });
      expect(res.status).toBe(403);
    });

    it('不存在 → 404', async () => {
      const a = app();
      const admin = await makeAdmin(a, ADMIN);
      const res = await request(a)
        .patch('/api/users/00000000-0000-4000-a000-000000000099')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ disabled: true });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /:id/profile（公开资料）', () => {
    it('游客可查公开资料', async () => {
      const a = app();
      const { userId } = await registerUser(a, ME);
      const res = await request(a).get(`/api/users/${userId}/profile`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(userId);
      expect(res.body.data.username).toBe(ME);
      expect(res.body.data).not.toHaveProperty('passwordHash');
      expect(res.body.data).not.toHaveProperty('role');
    });

    it('不存在 → 404', async () => {
      const res = await request(app()).get(
        '/api/users/00000000-0000-4000-a000-000000000099/profile',
      );
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /me（改资料）', () => {
    it('改自己资料 → 200', async () => {
      const a = app();
      const { accessToken } = await registerUser(a, ME);
      const res = await request(a)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ nickname: '新昵称', bio: '简介' });
      expect(res.status).toBe(200);
      expect(res.body.data.nickname).toBe('新昵称');
      expect(res.body.data.bio).toBe('简介');
    });

    it('无 token → 401', async () => {
      const res = await request(app()).patch('/api/users/me').send({ nickname: 'x' });
      expect(res.status).toBe(401);
    });

    it('schema 校验失败 → 422', async () => {
      const a = app();
      const { accessToken } = await registerUser(a, ME);
      const res = await request(a)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ avatar: 'not-a-url' });
      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /me/password（改密）', () => {
    it('旧密码正确 → 200，可用新密码登录', async () => {
      const a = app();
      const { accessToken } = await registerUser(a, ME);
      const res = await request(a)
        .patch('/api/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ oldPassword: 'pass1234', newPassword: 'newpass99' });
      expect(res.status).toBe(200);
      const login = await request(a)
        .post('/api/auth/login')
        .send({ username: ME, password: 'newpass99' });
      expect(login.status).toBe(200);
    });

    it('旧密码错误 → 401', async () => {
      const a = app();
      const { accessToken } = await registerUser(a, ME);
      const res = await request(a)
        .patch('/api/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ oldPassword: 'wrong0000', newPassword: 'newpass99' });
      expect(res.status).toBe(401);
    });

    it('新旧相同 → 422', async () => {
      const a = app();
      const { accessToken } = await registerUser(a, ME);
      const res = await request(a)
        .patch('/api/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ oldPassword: 'pass1234', newPassword: 'pass1234' });
      expect(res.status).toBe(422);
    });
  });

  describe('GET /search（用户搜索）', () => {
    it('无 token → 401', async () => {
      const res = await request(app()).get('/api/users/search?q=oth');
      expect(res.status).toBe(401);
    });

    it('无 q → 422', async () => {
      const a = app();
      const { accessToken } = await registerUser(a, ME);
      const res = await request(a)
        .get('/api/users/search')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(422);
    });

    it('按用户名模糊匹配 → 200，返回列表且不含自己/不含敏感字段', async () => {
      const a = app();
      const me = await registerUser(a, ME);
      await registerUser(a, OTHER);
      const res = await request(a)
        .get('/api/users/search?q=oth')
        .set('Authorization', `Bearer ${me.accessToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      const list = res.body.data as { username: string }[];
      expect(list.some((u) => u.username === OTHER)).toBe(true);
      expect(list.some((u) => u.username === ME)).toBe(false);
      expect(list[0]).not.toHaveProperty('passwordHash');
      expect(list[0]).not.toHaveProperty('role');
    });
  });
});
