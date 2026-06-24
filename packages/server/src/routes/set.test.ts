import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { setRouter, workoutSetRouter } from './set.js';
import { exerciseRouter } from './exercise.js';
import { workoutRouter } from './workout.js';
import { basePrisma } from '../lib/prisma.js';
import { registerUser } from '../test/helpers.js';

const OWNER = 'setowner';
const OTHER = 'setother';

function app() {
  return createApp((a) => {
    a.use('/api/exercises', exerciseRouter);
    a.use('/api/workouts', workoutRouter);
    a.use('/api/workouts', workoutSetRouter); // 嵌套 POST /api/workouts/:id/sets
    a.use('/api/sets', setRouter); // 独立 PATCH/DELETE /api/sets/:id
  });
}

/** 建一个 workout 并返回其 id（归属 OWNER） */
async function createWorkout(token: string, title = '课') {
  const res = await request(app())
    .post('/api/workouts')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: '2026-06-01', title });
  return res.body.data.id as string;
}

/** 建一个内置 exercise 并返回 id */
async function seedExercise() {
  const e = await basePrisma.exercise.create({
    data: {
      name: '正手高远球',
      category: 'technique',
      unit: 'sets',
      isBuiltIn: true,
      creatorId: null,
    },
  });
  return e.id;
}

function validSet(exerciseId: string, over: Record<string, unknown> = {}) {
  return { exerciseId, sets: 3, reps: 12, ...over };
}

describe('set 路由', () => {
  let exerciseId: string;
  beforeEach(async () => {
    await basePrisma.set.deleteMany({});
    await basePrisma.workout.deleteMany({});
    await basePrisma.exercise.deleteMany({});
    await basePrisma.user.deleteMany({ where: { username: { in: [OWNER, OTHER] } } });
    exerciseId = await seedExercise();
  });

  it('POST 嵌套创建 → 201，归属 workout', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const wid = await createWorkout(accessToken);
    const res = await request(a)
      .post(`/api/workouts/${wid}/sets`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validSet(exerciseId));
    expect(res.status).toBe(201);
    expect(res.body.data.workoutId).toBe(wid);
    expect(res.body.data.exerciseId).toBe(exerciseId);
    expect(res.body.data.sets).toBe(3);
  });

  it('POST 无 token → 401', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const wid = await createWorkout(accessToken);
    const res = await request(a).post(`/api/workouts/${wid}/sets`).send(validSet(exerciseId));
    expect(res.status).toBe(401);
  });

  it('POST 他人 workout → 403', async () => {
    const a = app();
    const tokenA = (await registerUser(a, OWNER)).accessToken;
    const tokenB = (await registerUser(a, OTHER)).accessToken;
    const wid = await createWorkout(tokenA);
    const res = await request(a)
      .post(`/api/workouts/${wid}/sets`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send(validSet(exerciseId));
    expect(res.status).toBe(403);
  });

  it('POST 不存在的 workout → 404', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const res = await request(a)
      .post('/api/workouts/00000000-0000-4000-a000-000000000000/sets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validSet(exerciseId));
    expect(res.status).toBe(404);
  });

  it('POST schema 校验失败 → 422', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const wid = await createWorkout(accessToken);
    const res = await request(a)
      .post(`/api/workouts/${wid}/sets`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ exerciseId: 'bad', sets: -1 });
    expect(res.status).toBe(422);
  });

  it('PATCH 独立更新 → 200，更新生效', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const wid = await createWorkout(accessToken);
    const created = await request(a)
      .post(`/api/workouts/${wid}/sets`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validSet(exerciseId));
    const res = await request(a)
      .patch(`/api/sets/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reps: 15 });
    expect(res.status).toBe(200);
    expect(res.body.data.reps).toBe(15);
  });

  it('PATCH 他人 set → 403', async () => {
    const a = app();
    const tokenA = (await registerUser(a, OWNER)).accessToken;
    const tokenB = (await registerUser(a, OTHER)).accessToken;
    const wid = await createWorkout(tokenA);
    const created = await request(a)
      .post(`/api/workouts/${wid}/sets`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send(validSet(exerciseId));
    const res = await request(a)
      .patch(`/api/sets/${created.body.data.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ reps: 99 });
    expect(res.status).toBe(403);
  });

  it('DELETE 独立删除 → 200，再 PATCH 该 set → 404', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const wid = await createWorkout(accessToken);
    const created = await request(a)
      .post(`/api/workouts/${wid}/sets`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validSet(exerciseId));
    const sid = created.body.data.id;
    const del = await request(a)
      .delete(`/api/sets/${sid}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(del.status).toBe(200);
    const patch = await request(a)
      .patch(`/api/sets/${sid}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reps: 1 });
    expect(patch.status).toBe(404);
  });

  it('DELETE 他人 set → 403', async () => {
    const a = app();
    const tokenA = (await registerUser(a, OWNER)).accessToken;
    const tokenB = (await registerUser(a, OTHER)).accessToken;
    const wid = await createWorkout(tokenA);
    const created = await request(a)
      .post(`/api/workouts/${wid}/sets`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send(validSet(exerciseId));
    const res = await request(a)
      .delete(`/api/sets/${created.body.data.id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });

  it('PATCH/DELETE 无 token → 401', async () => {
    const a = app();
    const { accessToken } = await registerUser(a, OWNER);
    const wid = await createWorkout(accessToken);
    const created = await request(a)
      .post(`/api/workouts/${wid}/sets`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validSet(exerciseId));
    const sid = created.body.data.id;
    const p = await request(a).patch(`/api/sets/${sid}`).send({ reps: 1 });
    const d = await request(a).delete(`/api/sets/${sid}`);
    expect(p.status).toBe(401);
    expect(d.status).toBe(401);
  });
});
