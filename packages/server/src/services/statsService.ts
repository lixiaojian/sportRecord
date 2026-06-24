import { prisma } from '../lib/prisma.js';
import { NOT_FOUND } from '../lib/errors.js';

/**
 * 统计 service（design.md 第 7 章 + 5.2 统计路由）。
 *
 * - 训练统计：自己的训练课全部计入（含私有）；公开统计只计 isPublic
 * - 比赛统计：同上
 * - 公开统计：任意人可查，仅公开数据 + 用户公开资料
 *
 * Set 经 workoutId 归属用户；分类需 join Exercise.category。
 * Match.scores/opponentIds 为 JSON 字符串，需 parse。
 */

const MONTH_RE = /^(\d{4}-\d{2})/;

function toMonth(date: string): string {
  const m = MONTH_RE.exec(date);
  return m ? m[1] : date;
}

function rate(win: number, total: number): number {
  return total === 0 ? 0 : Number((win / total).toFixed(3));
}

type TrainingStats = {
  totalWorkouts: number;
  totalDuration: number;
  totalSets: number;
  categoryRatio: { category: string; count: number; ratio: number }[];
  trend: { period: string; count: number }[];
};

type MatchStats = {
  total: number;
  win: number;
  winRate: number;
  byType: { type: string; total: number; win: number; winRate: number }[];
  trend: { date: string; type: string; result: string }[];
  opponentWinRate: { opponentId: string; total: number; win: number; winRate: number }[];
};

async function computeTraining(userId: string, publicOnly: boolean): Promise<TrainingStats> {
  const where = publicOnly ? { userId, isPublic: true } : { userId };
  const workouts = await prisma.workout.findMany({
    where,
    select: { id: true, date: true, duration: true },
  });

  const totalWorkouts = workouts.length;
  const totalDuration = workouts.reduce((s, w) => s + (w.duration ?? 0), 0);

  const workoutIds = workouts.map((w) => w.id);
  const sets = workoutIds.length
    ? await prisma.set.findMany({
        where: { workoutId: { in: workoutIds } },
        select: { exerciseId: true },
      })
    : [];
  const totalSets = sets.length;

  // 分类占比：按 Exercise.category 聚合 sets
  const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
  const exercises = exerciseIds.length
    ? await prisma.exercise.findMany({
        where: { id: { in: exerciseIds } },
        select: { id: true, category: true },
      })
    : [];
  const categoryById = new Map(exercises.map((e) => [e.id, e.category]));
  const countByCategory = new Map<string, number>();
  for (const s of sets) {
    const cat = categoryById.get(s.exerciseId) ?? 'unknown';
    countByCategory.set(cat, (countByCategory.get(cat) ?? 0) + 1);
  }
  const categoryRatio = [...countByCategory.entries()]
    .map(([category, count]) => ({
      category,
      count,
      ratio: totalSets === 0 ? 0 : Number((count / totalSets).toFixed(3)),
    }))
    .sort((a, b) => b.count - a.count);

  // 趋势：按月聚合训练课数
  const countByMonth = new Map<string, number>();
  for (const w of workouts) {
    const period = toMonth(w.date);
    countByMonth.set(period, (countByMonth.get(period) ?? 0) + 1);
  }
  const trend = [...countByMonth.entries()]
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period));

  return { totalWorkouts, totalDuration, totalSets, categoryRatio, trend };
}

async function computeMatch(userId: string, publicOnly: boolean): Promise<MatchStats> {
  const where = publicOnly ? { userId, isPublic: true } : { userId };
  const matches = await prisma.match.findMany({
    where,
    select: { id: true, type: true, date: true, result: true, opponentIds: true },
    orderBy: { date: 'asc' },
  });

  const total = matches.length;
  const win = matches.filter((m) => m.result === 'win').length;
  const winRate = rate(win, total);

  // 按类型分组
  const byTypeMap = new Map<string, { total: number; win: number }>();
  for (const m of matches) {
    const entry = byTypeMap.get(m.type) ?? { total: 0, win: 0 };
    entry.total += 1;
    if (m.result === 'win') entry.win += 1;
    byTypeMap.set(m.type, entry);
  }
  const byType = [...byTypeMap.entries()].map(([type, v]) => ({
    type,
    total: v.total,
    win: v.win,
    winRate: rate(v.win, v.total),
  }));

  // 走势：按日期升序的战绩序列
  const trend = matches.map((m) => ({ date: m.date, type: m.type, result: m.result }));

  // 对手胜率
  const oppMap = new Map<string, { total: number; win: number }>();
  for (const m of matches) {
    const ids = JSON.parse(m.opponentIds || '[]') as string[];
    for (const oppId of ids) {
      const entry = oppMap.get(oppId) ?? { total: 0, win: 0 };
      entry.total += 1;
      if (m.result === 'win') entry.win += 1;
      oppMap.set(oppId, entry);
    }
  }
  const opponentWinRate = [...oppMap.entries()].map(([opponentId, v]) => ({
    opponentId,
    total: v.total,
    win: v.win,
    winRate: rate(v.win, v.total),
  }));

  return { total, win, winRate, byType, trend, opponentWinRate };
}

/** 自己的训练统计（含私有） */
export async function training(userId: string) {
  return computeTraining(userId, false);
}

/** 自己的比赛统计（含私有） */
export async function match(userId: string) {
  return computeMatch(userId, false);
}

/** 公开统计：任意人可查，仅公开数据 + 用户公开资料 */
export async function publicStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      nickname: true,
      avatar: true,
      bio: true,
      defaultPublic: true,
      racketHand: true,
      mainEvent: true,
      createdAt: true,
    },
  });
  if (!user) throw NOT_FOUND('用户不存在');

  const [trainingData, matchData] = await Promise.all([
    computeTraining(userId, true),
    computeMatch(userId, true),
  ]);
  return { user, training: trainingData, match: matchData };
}
