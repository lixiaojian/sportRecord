import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { eventRouter } from './event.js';
import { basePrisma } from '../lib/prisma.js';
import { registerUser } from '../test/helpers.js';

const OWNER = 'evowner';
const OTHER = 'evother';

function app() {
  return createApp((a) => a.use('/api/events', eventRouter));
}

function validBody(over: Record<string, unknown> = {}) {
  return { name: '周末俱乐部赛', type: 'club', startDate: '2026-06-01', ...over };
}

describe('event 路由', () => {
  beforeEach(async () => {
    await basePrisma.event.deleteMany({});
    await basePrisma.user.deleteMany({ where: { username: { in: [OWNER, OTHER] } } });
  });

  it('登录用户 POST 创建 → 201，creatorId 指向自己', async () => {
    const a = app();
    const { accessToken, userId } = await registerUser(a, OWNER);
    const res = await request(a)
      .post('/api/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody({ isPublic: false }));
    expect(res.status).toBe(201);
    expect(res.body.data.creatorId).toBe(userId);
    expect(res.body.data.isPublic).toBe(false);
  });

  it('POST 无 token → 401', async () => {
    const res = await request(app()).post('/api/events').send(validBody());
    expect(res.status).toBe(401);
  });

  it('POST schema 校验失败 → 422', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const res = await request(a)
      .post('/api/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '', type: 'bad', startDate: '2026-06-01' });
    expect(res.status).toBe(422);
  });

  it('游客 GET 仅返回公开项', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    await request(a)
      .post('/api/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody({ name: '公开赛' }));
    await request(a)
      .post('/api/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody({ name: '内部赛', isPublic: false }));
    const res = await request(a).get('/api/events');
    expect(res.status).toBe(200);
    const names = res.body.data.list.map((e: { name: string }) => e.name);
    expect(names).toContain('公开赛');
    expect(names).not.toContain('内部赛');
  });

  it('登录用户 GET 含自己私有 + 公开（分页）', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    await request(a)
      .post('/api/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody({ name: '公开赛' }));
    await request(a)
      .post('/api/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody({ name: '内部赛', isPublic: false }));
    const res = await request(a).get('/api/events').set('Authorization', `Bearer ${accessToken}`);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data).toHaveProperty('page');
  });

  it('GET/:id 公开项游客可查', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const created = await request(a)
      .post('/api/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody());
    const res = await request(a).get(`/api/events/${created.body.data.id}`);
    expect(res.status).toBe(200);
  });

  it('GET/:id 他人私有 → 404', async () => {
    const a = app();
    const tokenA = (await registerUser(a, OWNER)).accessToken;
    const tokenB = (await registerUser(a, OTHER)).accessToken;
    const created = await request(a)
      .post('/api/events')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(validBody({ isPublic: false }));
    const res = await request(a)
      .get(`/api/events/${created.body.data.id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  it('PATCH 自己的 → 200', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const created = await request(a)
      .post('/api/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody());
    const res = await request(a)
      .patch(`/api/events/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '改名' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('改名');
  });

  it('PATCH 别人的 → 403', async () => {
    const a = app();
    const tokenA = (await registerUser(a, OWNER)).accessToken;
    const tokenB = (await registerUser(a, OTHER)).accessToken;
    const created = await request(a)
      .post('/api/events')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(validBody({ isPublic: true }));
    const res = await request(a)
      .patch(`/api/events/${created.body.data.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: '偷改' });
    expect(res.status).toBe(403);
  });

  it('DELETE 自己的 → 200，列表不再可见', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const created = await request(a)
      .post('/api/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody());
    const del = await request(a)
      .delete(`/api/events/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(del.status).toBe(200);
    const list = await request(a).get('/api/events').set('Authorization', `Bearer ${accessToken}`);
    expect(list.body.data.total).toBe(0);
  });

  it('DELETE 别人的 → 403', async () => {
    const a = app();
    const tokenA = (await registerUser(a, OWNER)).accessToken;
    const tokenB = (await registerUser(a, OTHER)).accessToken;
    const created = await request(a)
      .post('/api/events')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(validBody({ isPublic: true }));
    const res = await request(a)
      .delete(`/api/events/${created.body.data.id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });
});
