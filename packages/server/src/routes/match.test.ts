import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { matchRouter } from './match.js';
import { basePrisma } from '../lib/prisma.js';
import { registerUser } from '../test/helpers.js';

const OWNER = 'mtowner';
const OTHER = 'mtother';
const EVENT_ID = '00000000-0000-4000-a000-000000000001';

function app() {
  return createApp((a) => a.use('/api/matches', matchRouter));
}

function validBody(over: Record<string, unknown> = {}) {
  return {
    eventId: EVENT_ID,
    type: 'single',
    date: '2026-06-01',
    scores: [
      [21, 15],
      [19, 21],
    ],
    result: 'win',
    ...over,
  };
}

describe('match 路由', () => {
  beforeEach(async () => {
    await basePrisma.match.deleteMany({});
    await basePrisma.user.deleteMany({ where: { username: { in: [OWNER, OTHER] } } });
  });

  it('POST 创建 → 201，scores/opponentIds 返回为数组', async () => {
    const a = app();
    const { accessToken, userId } = await registerUser(a, OWNER);
    const res = await request(a)
      .post('/api/matches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody({ isPublic: false, opponentIds: [EVENT_ID] }));
    expect(res.status).toBe(201);
    expect(res.body.data.userId).toBe(userId);
    expect(res.body.data.scores).toEqual([
      [21, 15],
      [19, 21],
    ]);
    expect(Array.isArray(res.body.data.opponentIds)).toBe(true);
    expect(res.body.data.opponentIds).toHaveLength(1);
  });

  it('POST 无 token → 401', async () => {
    const res = await request(app()).post('/api/matches').send(validBody());
    expect(res.status).toBe(401);
  });

  it('POST schema 校验失败（scores 非法）→ 422', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const res = await request(a)
      .post('/api/matches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody({ scores: [[21]] }));
    expect(res.status).toBe(422);
  });

  it('opponentIds 未传默认 []', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const res = await request(a)
      .post('/api/matches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody());
    expect(res.status).toBe(201);
    expect(res.body.data.opponentIds).toEqual([]);
  });

  it('游客 GET 仅返回公开项', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    await request(a)
      .post('/api/matches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody({ result: 'win' }));
    await request(a)
      .post('/api/matches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody({ result: 'lose', isPublic: false }));
    const res = await request(a).get('/api/matches');
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
  });

  it('登录用户 GET 含自己私有 + 公开（分页）', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    await request(a)
      .post('/api/matches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody());
    await request(a)
      .post('/api/matches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody({ isPublic: false }));
    const res = await request(a).get('/api/matches').set('Authorization', `Bearer ${accessToken}`);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data).toHaveProperty('page');
  });

  it('GET/:id 公开项游客可查，scores 为数组', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const created = await request(a)
      .post('/api/matches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody());
    const res = await request(a).get(`/api/matches/${created.body.data.id}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.scores)).toBe(true);
  });

  it('GET/:id 他人私有 → 404', async () => {
    const a = app();
    const tokenA = (await registerUser(a, OWNER)).accessToken;
    const tokenB = (await registerUser(a, OTHER)).accessToken;
    const created = await request(a)
      .post('/api/matches')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(validBody({ isPublic: false }));
    const res = await request(a)
      .get(`/api/matches/${created.body.data.id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  it('PATCH 自己的 → 200，scores 更新生效', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const created = await request(a)
      .post('/api/matches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody());
    const res = await request(a)
      .patch(`/api/matches/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ scores: [[21, 0]], result: 'win' });
    expect(res.status).toBe(200);
    expect(res.body.data.scores).toEqual([[21, 0]]);
  });

  it('PATCH 别人的 → 403', async () => {
    const a = app();
    const tokenA = (await registerUser(a, OWNER)).accessToken;
    const tokenB = (await registerUser(a, OTHER)).accessToken;
    const created = await request(a)
      .post('/api/matches')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(validBody({ isPublic: true }));
    const res = await request(a)
      .patch(`/api/matches/${created.body.data.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ result: 'lose' });
    expect(res.status).toBe(403);
  });

  it('DELETE 自己的 → 200，列表不再可见', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const created = await request(a)
      .post('/api/matches')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validBody());
    const del = await request(a)
      .delete(`/api/matches/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(del.status).toBe(200);
    const list = await request(a).get('/api/matches').set('Authorization', `Bearer ${accessToken}`);
    expect(list.body.data.total).toBe(0);
  });

  it('DELETE 别人的 → 403', async () => {
    const a = app();
    const tokenA = (await registerUser(a, OWNER)).accessToken;
    const tokenB = (await registerUser(a, OTHER)).accessToken;
    const created = await request(a)
      .post('/api/matches')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(validBody({ isPublic: true }));
    const res = await request(a)
      .delete(`/api/matches/${created.body.data.id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });
});
