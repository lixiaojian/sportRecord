import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import type { Express } from 'express';
import { createApp } from '../app.js';
import { trashRouter } from './trash.js';
import { basePrisma } from '../lib/prisma.js';
import { registerUser } from '../test/helpers.js';

const OWNER = 'trowner';
const OTHER = 'trother';
const ADMIN = 'tradmin';

function app() {
  return createApp((a) => a.use('/api/trash', trashRouter));
}

/** 升级为 admin 并重新登录，拿带 admin role 的 token */
async function makeAdmin(a: Express, username: string) {
  const { userId } = await registerUser(a, username);
  await basePrisma.user.update({ where: { id: userId }, data: { role: 'admin' } });
  const res = await request(a).post('/api/auth/login').send({ username, password: 'pass1234' });
  return { accessToken: res.body.data.accessToken as string, userId };
}

/** 直接用 basePrisma 插入一条已软删的 Workout（绕过路由，构造回收站初始态） */
async function softDeleteWorkout(userId: string, title = '已删课') {
  const id = randomUUID();
  await basePrisma.workout.create({
    data: { id, userId, date: '2026-06-01', title, deletedAt: new Date() },
  });
  return id;
}

describe('trash 路由', () => {
  beforeEach(async () => {
    await basePrisma.match.deleteMany({});
    await basePrisma.event.deleteMany({});
    await basePrisma.workout.deleteMany({});
    await basePrisma.exercise.deleteMany({});
    await basePrisma.user.deleteMany({ where: { username: { in: [OWNER, OTHER, ADMIN] } } });
  });

  it('GET 无 token → 401', async () => {
    const res = await request(app()).get('/api/trash');
    expect(res.status).toBe(401);
  });

  it('GET 用户只看自己的软删项', async () => {
    const a = app();
    const owner = await registerUser(a, OWNER);
    const other = await registerUser(a, OTHER);
    await softDeleteWorkout(owner.userId);
    await softDeleteWorkout(other.userId);
    const res = await request(a)
      .get('/api/trash')
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.list[0].type).toBe('workout');
  });

  it('GET admin 看全局', async () => {
    const a = app();
    const owner = await registerUser(a, OWNER);
    const admin = await makeAdmin(a, ADMIN);
    await softDeleteWorkout(owner.userId);
    const res = await request(a)
      .get('/api/trash')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.body.data.total).toBe(1);
  });

  it('GET ?type=workout 按类型过滤', async () => {
    const a = app();
    const { accessToken, userId } = await registerUser(a, OWNER);
    await softDeleteWorkout(userId);
    await basePrisma.event.create({
      data: {
        id: randomUUID(),
        name: '删赛',
        type: 'club',
        startDate: '2026-06-01',
        creatorId: userId,
        deletedAt: new Date(),
      },
    });
    const res = await request(a)
      .get('/api/trash?type=workout')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.list[0].type).toBe('workout');
  });

  it('GET 不含未软删项', async () => {
    const a = app();
    const { accessToken, userId } = await registerUser(a, OWNER);
    await basePrisma.workout.create({
      data: { id: randomUUID(), userId, date: '2026-06-01', title: '正常课' },
    });
    const res = await request(a).get('/api/trash').set('Authorization', `Bearer ${accessToken}`);
    expect(res.body.data.total).toBe(0);
  });

  it('POST restore 自己的 → 200，恢复后 trash 不再含', async () => {
    const a = app();
    const { accessToken, userId } = await registerUser(a, OWNER);
    const id = await softDeleteWorkout(userId);
    const res = await request(a)
      .post(`/api/trash/workout/${id}/restore`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    const row = await basePrisma.workout.findUnique({ where: { id } });
    expect(row?.deletedAt).toBeNull();
    const list = await request(a).get('/api/trash').set('Authorization', `Bearer ${accessToken}`);
    expect(list.body.data.total).toBe(0);
  });

  it('POST restore 别人的 → 403', async () => {
    const a = app();
    const owner = await registerUser(a, OWNER);
    const other = await registerUser(a, OTHER);
    const id = await softDeleteWorkout(owner.userId);
    const res = await request(a)
      .post(`/api/trash/workout/${id}/restore`)
      .set('Authorization', `Bearer ${other.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('POST restore 不存在 → 404', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const res = await request(a)
      .post(`/api/trash/workout/${randomUUID()}/restore`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(404);
  });

  it('POST restore 非法 type → 422', async () => {
    const a = app();
    const { accessToken, userId } = await registerUser(a, OWNER);
    const id = await softDeleteWorkout(userId);
    const res = await request(a)
      .post(`/api/trash/badtype/${id}/restore`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(422);
  });

  it('DELETE 自己的 → 200，彻底删除（物理）', async () => {
    const a = app();
    const { accessToken, userId } = await registerUser(a, OWNER);
    const id = await softDeleteWorkout(userId);
    const res = await request(a)
      .delete(`/api/trash/workout/${id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    const row = await basePrisma.workout.findUnique({ where: { id } });
    expect(row).toBeNull();
  });

  it('DELETE 别人的 → 403', async () => {
    const a = app();
    const owner = await registerUser(a, OWNER);
    const other = await registerUser(a, OTHER);
    const id = await softDeleteWorkout(owner.userId);
    const res = await request(a)
      .delete(`/api/trash/workout/${id}`)
      .set('Authorization', `Bearer ${other.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('admin 可恢复他人软删项', async () => {
    const a = app();
    const owner = await registerUser(a, OWNER);
    const admin = await makeAdmin(a, ADMIN);
    const id = await softDeleteWorkout(owner.userId);
    const res = await request(a)
      .post(`/api/trash/workout/${id}/restore`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
  });
});
