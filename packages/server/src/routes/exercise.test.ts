import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { exerciseRouter } from './exercise.js';
import { basePrisma } from '../lib/prisma.js';

const UNIQUE = 'exuser';
const OTHER = 'exother';

function app() {
  return createApp((a) => a.use('/api/exercises', exerciseRouter));
}

/** 注册并返回 accessToken */
async function register(username: string): Promise<string> {
  const res = await request(app())
    .post('/api/auth/register')
    .send({ username, password: 'pass1234' });
  return res.body.data.accessToken as string;
}

/** 物理写入一条内置训练项 */
async function seedBuiltIn(name: string) {
  return basePrisma.exercise.create({
    data: { name, category: 'technique', unit: 'sets', isBuiltIn: true, creatorId: null },
  });
}

describe('exercise 路由', () => {
  beforeEach(async () => {
    await basePrisma.exercise.deleteMany({});
    await basePrisma.user.deleteMany({ where: { username: { in: [UNIQUE, OTHER] } } });
  });

  it('游客 GET 仅返回内置项', async () => {
    await seedBuiltIn('正手高远球');
    const res = await request(app()).get('/api/exercises');
    expect(res.status).toBe(200);
    expect(res.body.data.list).toHaveLength(1);
    expect(res.body.data.list[0].isBuiltIn).toBe(true);
    expect(res.body.data.total).toBe(1);
  });

  it('登录用户 GET 返回内置 + 自建', async () => {
    await seedBuiltIn('正手高远球');
    const token = await register(UNIQUE);
    await request(app())
      .post('/api/exercises')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '我的杀球', category: 'technique', unit: 'sets' });

    const res = await request(app()).get('/api/exercises').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.list.map((e: { name: string }) => e.name).sort()).toEqual([
      '我的杀球',
      '正手高远球',
    ]);
  });

  it('登录用户 POST 创建自建 → 201，isBuiltIn=false 且 creatorId 指向自己', async () => {
    const token = await register(UNIQUE);
    const res = await request(app())
      .post('/api/exercises')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '自定义步法', category: 'footwork', unit: 'duration' });
    expect(res.status).toBe(201);
    expect(res.body.data.isBuiltIn).toBe(false);
    expect(res.body.data.creatorId).toBeTruthy();
  });

  it('POST 无 token → 401', async () => {
    const res = await request(app())
      .post('/api/exercises')
      .send({ name: 'x', category: 'technique', unit: 'sets' });
    expect(res.status).toBe(401);
  });

  it('POST schema 校验失败 → 422', async () => {
    const token = await register(UNIQUE);
    const res = await request(app())
      .post('/api/exercises')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '', category: 'bad', unit: 'sets' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH 自己的自建 → 200，更新生效', async () => {
    const token = await register(UNIQUE);
    const created = await request(app())
      .post('/api/exercises')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '旧名', category: 'technique', unit: 'sets' });
    const id = created.body.data.id;

    const res = await request(app())
      .patch(`/api/exercises/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '新名' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('新名');
  });

  it('PATCH 内置项 → 403', async () => {
    const token = await register(UNIQUE);
    const builtin = await seedBuiltIn('正手高远球');
    const res = await request(app())
      .patch(`/api/exercises/${builtin.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '改内置' });
    expect(res.status).toBe(403);
  });

  it('PATCH 别人的自建 → 403', async () => {
    const tokenA = await register(UNIQUE);
    const tokenB = await register(OTHER);
    const created = await request(app())
      .post('/api/exercises')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'A的项', category: 'technique', unit: 'sets' });
    const res = await request(app())
      .patch(`/api/exercises/${created.body.data.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: '偷改' });
    expect(res.status).toBe(403);
  });

  it('PATCH 不存在 → 404', async () => {
    const token = await register(UNIQUE);
    const res = await request(app())
      .patch('/api/exercises/00000000-0000-4000-a000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'x' });
    expect(res.status).toBe(404);
  });

  it('DELETE 自己的自建 → 200，列表不再可见', async () => {
    const token = await register(UNIQUE);
    const created = await request(app())
      .post('/api/exercises')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '待删', category: 'technique', unit: 'sets' });
    const del = await request(app())
      .delete(`/api/exercises/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const list = await request(app()).get('/api/exercises').set('Authorization', `Bearer ${token}`);
    expect(list.body.data.list.map((e: { name: string }) => e.name)).not.toContain('待删');
  });

  it('DELETE 内置项 → 403', async () => {
    const token = await register(UNIQUE);
    const builtin = await seedBuiltIn('正手高远球');
    const res = await request(app())
      .delete(`/api/exercises/${builtin.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('PATCH/DELETE 无 token → 401', async () => {
    const id = '00000000-0000-4000-a000-000000000000';
    const p = await request(app()).patch(`/api/exercises/${id}`).send({ name: 'x' });
    const d = await request(app()).delete(`/api/exercises/${id}`);
    expect(p.status).toBe(401);
    expect(d.status).toBe(401);
  });
});
