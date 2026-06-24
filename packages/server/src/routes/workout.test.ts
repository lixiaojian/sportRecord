import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { workoutRouter } from './workout.js';
import { basePrisma } from '../lib/prisma.js';
import { registerUser } from '../test/helpers.js';

const OWNER = 'wkowner';
const OTHER = 'wkother';

function app() {
  return createApp((a) => a.use('/api/workouts', workoutRouter));
}

function validBody(over: Record<string, unknown> = {}) {
  return { date: '2026-06-01', title: '晨练', ...over };
}

describe('workout 路由', () => {
  beforeEach(async () => {
    await basePrisma.workout.deleteMany({});
    await basePrisma.user.deleteMany({ where: { username: { in: [OWNER, OTHER] } } });
  });

  it('登录用户 POST 创建 → 201，归属自己', async () => {
    const a = app();
    const { accessToken, userId } = await registerUser(a, OWNER);
    const res = await request(a)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody({ isPublic: false }));
    expect(res.status).toBe(201);
    expect(res.body.data.userId).toBe(userId);
    expect(res.body.data.isPublic).toBe(false);
  });

  it('POST 无 token → 401', async () => {
    const res = await request(app()).post('/api/workouts').send(validBody());
    expect(res.status).toBe(401);
  });

  it('POST schema 校验失败 → 422', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const res = await request(a)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ date: '2026-06-01', title: '' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('isPublic 未传时取用户 defaultPublic', async () => {
    const a = app();
    const { accessToken, userId } = await registerUser(a, OWNER);
    // 改 defaultPublic=false（users 路由阶段4-8 实现，此处直接改库）
    await basePrisma.user.update({ where: { id: userId }, data: { defaultPublic: false } });
    const res = await request(a)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody());
    expect(res.status).toBe(201);
    expect(res.body.data.isPublic).toBe(false);
  });

  it('游客 GET 仅返回公开项（不含他人私有）', async () => {
    const a = app();
    const { accessToken, userId } = await registerUser(a, OWNER);
    await request(a)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody({ title: '公开课' })); // 默认 public=true
    await request(a)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody({ title: '私教课', isPublic: false }));
    void userId;

    const res = await request(a).get('/api/workouts');
    expect(res.status).toBe(200);
    const titles = res.body.data.list.map((w: { title: string }) => w.title);
    expect(titles).toContain('公开课');
    expect(titles).not.toContain('私教课');
  });

  it('登录用户 GET 含自己私有 + 公开（分页结构）', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    await request(a)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody({ title: '公开课' }));
    await request(a)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody({ title: '私教课', isPublic: false }));

    const res = await request(a).get('/api/workouts').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data).toHaveProperty('page');
    expect(res.body.data).toHaveProperty('pageSize');
  });

  it('GET/:id 公开项游客可查', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const created = await request(a)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody({ title: '公开课' }));
    const res = await request(a).get(`/api/workouts/${created.body.data.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('公开课');
  });

  it('GET/:id 他人私有 → 404（不泄漏存在性）', async () => {
    const a = app();
    const tokenA = (await registerUser(a, OWNER)).accessToken;
    const tokenB = (await registerUser(a, OTHER)).accessToken;
    const created = await request(a)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(validBody({ title: '私教课', isPublic: false }));
    const res = await request(a)
      .get(`/api/workouts/${created.body.data.id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  it('GET/:id 不存在 → 404', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const res = await request(a)
      .get('/api/workouts/00000000-0000-4000-a000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(404);
  });

  it('PATCH 自己的 → 200，更新生效', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const created = await request(a)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody());
    const res = await request(a)
      .patch(`/api/workouts/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: '改后标题' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('改后标题');
  });

  it('PATCH 别人的 → 403', async () => {
    const a = app();
    const tokenA = (await registerUser(a, OWNER)).accessToken;
    const tokenB = (await registerUser(a, OTHER)).accessToken;
    const created = await request(a)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(validBody({ isPublic: true }));
    const res = await request(a)
      .patch(`/api/workouts/${created.body.data.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: '偷改' });
    expect(res.status).toBe(403);
  });

  it('DELETE 自己的 → 200，列表不再可见', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const created = await request(a)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody());
    const del = await request(a)
      .delete(`/api/workouts/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(del.status).toBe(200);
    const list = await request(a)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(list.body.data.total).toBe(0);
  });

  it('DELETE 别人的 → 403', async () => {
    const a = app();
    const tokenA = (await registerUser(a, OWNER)).accessToken;
    const tokenB = (await registerUser(a, OTHER)).accessToken;
    const created = await request(a)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(validBody({ isPublic: true }));
    const res = await request(a)
      .delete(`/api/workouts/${created.body.data.id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });
});
