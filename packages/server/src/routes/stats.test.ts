import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../app.js';
import { statsRouter } from './stats.js';
import { basePrisma } from '../lib/prisma.js';
import { registerUser } from '../test/helpers.js';

const OWNER = 'stowner';
const EVENT_ID = '00000000-0000-4000-a000-000000000001';

function app() {
  return createApp((a) => a.use('/api/stats', statsRouter));
}

async function makeExercise(creatorId: string, category: string) {
  return basePrisma.exercise.create({
    data: {
      id: randomUUID(),
      name: `ex-${category}`,
      category,
      unit: 'sets',
      isBuiltIn: false,
      creatorId,
    },
  });
}

async function makeWorkout(userId: string, over: Record<string, unknown> = {}) {
  return basePrisma.workout.create({
    data: {
      id: randomUUID(),
      userId,
      date: '2026-06-01',
      title: '课',
      duration: 60,
      isPublic: true,
      ...over,
    },
  });
}

async function makeSet(workoutId: string, exerciseId: string) {
  return basePrisma.set.create({
    data: { id: randomUUID(), workoutId, exerciseId, sets: 3 },
  });
}

async function makeMatch(userId: string, over: Record<string, unknown> = {}) {
  return basePrisma.match.create({
    data: {
      id: randomUUID(),
      eventId: EVENT_ID,
      userId,
      type: 'single',
      date: '2026-06-01',
      partnerId: null,
      opponentIds: JSON.stringify([]),
      scores: JSON.stringify([[21, 15]]),
      result: 'win',
      isPublic: true,
      ...over,
    },
  });
}

describe('stats 路由', () => {
  beforeEach(async () => {
    await basePrisma.set.deleteMany({});
    await basePrisma.match.deleteMany({});
    await basePrisma.workout.deleteMany({});
    await basePrisma.exercise.deleteMany({
      where: { isBuiltIn: false },
    });
    await basePrisma.user.deleteMany({ where: { username: OWNER } });
  });

  describe('GET /training', () => {
    it('无 token → 401', async () => {
      const res = await request(app()).get('/api/stats/training');
      expect(res.status).toBe(401);
    });

    it('返回训练统计字段齐全', async () => {
      const a = app();
      const { accessToken, userId } = await registerUser(a, OWNER);
      await makeWorkout(userId);
      const res = await request(a)
        .get('/api/stats/training')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalWorkouts');
      expect(res.body.data).toHaveProperty('totalDuration');
      expect(res.body.data).toHaveProperty('totalSets');
      expect(res.body.data).toHaveProperty('categoryRatio');
      expect(res.body.data).toHaveProperty('trend');
    });

    it('数据正确：次数/时长/分类占比/趋势', async () => {
      const a = app();
      const { accessToken, userId } = await registerUser(a, OWNER);
      const tech = await makeExercise(userId, 'technique');
      const foot = await makeExercise(userId, 'footwork');
      const w1 = await makeWorkout(userId, { duration: 60, date: '2026-06-01' });
      const w2 = await makeWorkout(userId, { duration: 40, date: '2026-05-15' });
      await makeSet(w1.id, tech.id);
      await makeSet(w1.id, tech.id);
      await makeSet(w2.id, foot.id);

      const res = await request(a)
        .get('/api/stats/training')
        .set('Authorization', `Bearer ${accessToken}`);
      const d = res.body.data;
      expect(d.totalWorkouts).toBe(2);
      expect(d.totalDuration).toBe(100);
      expect(d.totalSets).toBe(3);
      const techRatio = d.categoryRatio.find(
        (c: { category: string }) => c.category === 'technique',
      );
      expect(techRatio.count).toBe(2);
      expect(techRatio.ratio).toBeCloseTo(0.667, 2);
      // 5 月、6 月各一条趋势
      expect(d.trend).toHaveLength(2);
      expect(d.trend.map((t: { period: string }) => t.period)).toEqual(['2026-05', '2026-06']);
    });

    it('自己的私有训练也计入', async () => {
      const a = app();
      const { accessToken, userId } = await registerUser(a, OWNER);
      await makeWorkout(userId, { isPublic: false });
      await makeWorkout(userId, { isPublic: true });
      const res = await request(a)
        .get('/api/stats/training')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.body.data.totalWorkouts).toBe(2);
    });
  });

  describe('GET /match', () => {
    it('无 token → 401', async () => {
      const res = await request(app()).get('/api/stats/match');
      expect(res.status).toBe(401);
    });

    it('返回比赛统计字段齐全', async () => {
      const a = app();
      const { accessToken, userId } = await registerUser(a, OWNER);
      await makeMatch(userId);
      const res = await request(a)
        .get('/api/stats/match')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('win');
      expect(res.body.data).toHaveProperty('winRate');
      expect(res.body.data).toHaveProperty('byType');
      expect(res.body.data).toHaveProperty('trend');
      expect(res.body.data).toHaveProperty('opponentWinRate');
    });

    it('数据正确：胜率/单双打/对手胜率/走势', async () => {
      const a = app();
      const { accessToken, userId } = await registerUser(a, OWNER);
      const oppA = randomUUID();
      const oppB = randomUUID();
      await makeMatch(userId, {
        type: 'single',
        result: 'win',
        date: '2026-06-01',
        opponentIds: JSON.stringify([oppA]),
      });
      await makeMatch(userId, {
        type: 'single',
        result: 'lose',
        date: '2026-06-05',
        opponentIds: JSON.stringify([oppA]),
      });
      await makeMatch(userId, {
        type: 'double',
        result: 'win',
        date: '2026-06-10',
        opponentIds: JSON.stringify([oppB]),
      });

      const res = await request(a)
        .get('/api/stats/match')
        .set('Authorization', `Bearer ${accessToken}`);
      const d = res.body.data;
      expect(d.total).toBe(3);
      expect(d.win).toBe(2);
      expect(d.winRate).toBeCloseTo(0.667, 2);
      const single = d.byType.find((t: { type: string }) => t.type === 'single');
      expect(single).toEqual({ type: 'single', total: 2, win: 1, winRate: 0.5 });
      const opp = d.opponentWinRate.find((o: { opponentId: string }) => o.opponentId === oppA);
      expect(opp).toEqual({ opponentId: oppA, total: 2, win: 1, winRate: 0.5 });
      // 走势按时间升序
      expect(d.trend.map((t: { result: string }) => t.result)).toEqual(['win', 'lose', 'win']);
    });
  });

  describe('GET /public/:userId', () => {
    it('游客可查公开统计', async () => {
      const a = app();
      const { userId } = await registerUser(a, OWNER);
      await makeWorkout(userId, { isPublic: true });
      await makeMatch(userId, { isPublic: true });
      const res = await request(a).get(`/api/stats/public/${userId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(userId);
      expect(res.body.data.training.totalWorkouts).toBe(1);
      expect(res.body.data.match.total).toBe(1);
    });

    it('只统计公开数据，私有不计', async () => {
      const a = app();
      const { userId } = await registerUser(a, OWNER);
      await makeWorkout(userId, { isPublic: true });
      await makeWorkout(userId, { isPublic: false });
      await makeMatch(userId, { isPublic: true });
      await makeMatch(userId, { isPublic: false });
      const res = await request(a).get(`/api/stats/public/${userId}`);
      expect(res.body.data.training.totalWorkouts).toBe(1);
      expect(res.body.data.match.total).toBe(1);
    });

    it('用户不存在 → 404', async () => {
      const res = await request(app()).get(`/api/stats/public/${randomUUID()}`);
      expect(res.status).toBe(404);
    });
  });
});
