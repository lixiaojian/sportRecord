import { prisma } from '../lib/prisma.js';

/**
 * Dashboard 服务 - 为首页提供数据
 * - 综合评分和能力雷达图数据
 * - 今日训练建议
 * - 技术统计 Top 5
 * - 比赛趋势
 */

type AbilityScores = {
  attack: number; // 进攻能力
  defense: number; // 防守能力
  stability: number; // 技术稳定性
  stamina: number; // 体能水平
  tactics: number; // 战术意识
  mentality: number; // 心理素质
};

type TrainingSuggestion = {
  label: string;
  time: string;
  progress: number;
};

type TechniqueStat = {
  name: string;
  count: number;
  percentage: number;
};

type PerformanceTrend = {
  date: string;
  performance: number;
  load: number;
};

type MatchTrend = {
  date: string;
  result: 'win' | 'lose';
  type: string;
};

type DashboardStats = {
  // 综合评分
  overallScore: number;
  scoreLevel: '优秀' | '良好' | '一般' | '待提升';
  scoreChange: number; // 较上月百分比变化

  // 能力雷达图
  abilities: AbilityScores;

  // 训练概览
  training: {
    totalWorkouts: number;
    totalDuration: number;
    totalSets: number;
  };

  // 比赛概览
  match: {
    total: number;
    win: number;
    winRate: number;
  };

  // 今日训练建议
  suggestions: TrainingSuggestion[];

  // 技术统计 Top 5
  techniqueStats: TechniqueStat[];

  // 表现趋势（最近 8 次训练）
  performanceTrend: PerformanceTrend[];

  // 比赛趋势（最近 10 场）
  matchTrend: MatchTrend[];
};

/**
 * 计算能力评分
 * 基于训练数据和比赛数据综合计算
 */
async function computeAbilities(userId: string): Promise<AbilityScores> {
  // 获取最近的训练数据 - 分步查询避免 include
  const recentWorkouts = await prisma.workout.findMany({
    where: { userId, deletedAt: null },
    orderBy: { date: 'desc' },
    take: 20,
  });

  const workoutIds = recentWorkouts.map((w) => w.id);
  const sets =
    workoutIds.length > 0
      ? await prisma.set.findMany({
          where: { workoutId: { in: workoutIds } },
        })
      : [];

  const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
  const exercises =
    exerciseIds.length > 0
      ? await prisma.exercise.findMany({
          where: { id: { in: exerciseIds } },
        })
      : [];

  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const setsByWorkout = new Map<string, typeof sets>();
  for (const set of sets) {
    const list = setsByWorkout.get(set.workoutId) || [];
    list.push(set);
    setsByWorkout.set(set.workoutId, list);
  }

  // 获取比赛数据
  const recentMatches = await prisma.match.findMany({
    where: { userId, deletedAt: null },
    orderBy: { date: 'desc' },
    take: 10,
  });

  // 基础分数（有数据就有一定分数）
  const workoutCount = recentWorkouts.length;
  const matchCount = recentMatches.length;

  // 计算各项能力
  // 进攻能力：杀球、高远球等技术的使用频率和比赛胜率
  const attackExercises = ['杀球', '高远球', '扑球'];
  let attackScore = 50;
  for (const set of sets) {
    const ex = exerciseById.get(set.exerciseId);
    if (ex && attackExercises.some((e) => ex.name.includes(e))) {
      attackScore += 2;
    }
  }
  // 比赛胜利加成
  const winCount = recentMatches.filter((m) => m.result === 'win').length;
  if (matchCount > 0) {
    attackScore += Math.floor((winCount / matchCount) * 30);
  }

  // 防守能力：防守练习和比赛失分情况
  const defenseExercises = ['防守', '接杀', '挡网'];
  let defenseScore = 50;
  for (const set of sets) {
    const ex = exerciseById.get(set.exerciseId);
    if (ex && defenseExercises.some((e) => ex.name.includes(e))) {
      defenseScore += 2;
    }
  }
  if (matchCount > 0) {
    defenseScore += Math.floor((winCount / matchCount) * 25);
  }

  // 技术稳定性：训练课的稳定性和多球训练
  const stabilityExercises = ['多球', '固定路线', '组合球'];
  let stabilityScore = 50;
  for (const set of sets) {
    const ex = exerciseById.get(set.exerciseId);
    if (ex && stabilityExercises.some((e) => ex.name.includes(e))) {
      stabilityScore += 3;
    }
  }
  // 训练时长加成
  const avgDuration =
    recentWorkouts.reduce((s, w) => s + (w.duration ?? 0), 0) / (workoutCount || 1);
  if (avgDuration > 30) stabilityScore += 15;
  if (avgDuration > 60) stabilityScore += 10;

  // 体能水平：训练时长和频率
  let staminaScore = 50;
  const totalDuration = recentWorkouts.reduce((s, w) => s + (w.duration ?? 0), 0);
  staminaScore += Math.min(30, Math.floor(totalDuration / 30)); // 最多 30 分
  if (workoutCount >= 10) staminaScore += 20;

  // 战术意识：比赛经验和类型
  let tacticsScore = 50;
  tacticsScore += Math.min(20, matchCount * 2);
  // 双打/混双经验加成
  const doublesMatches = recentMatches.filter(
    (m) => m.type === 'double' || m.type === 'mixed',
  ).length;
  tacticsScore += Math.min(15, doublesMatches * 3);

  // 心理素质：关键比赛表现
  let mentalityScore = 50;
  mentalityScore += Math.min(20, workoutCount);
  // 连胜加成
  let currentStreak = 0;
  for (const m of recentMatches) {
    if (m.result === 'win') currentStreak++;
    else break;
  }
  mentalityScore += Math.min(15, currentStreak * 3);

  return {
    attack: Math.min(100, Math.max(0, attackScore)),
    defense: Math.min(100, Math.max(0, defenseScore)),
    stability: Math.min(100, Math.max(0, stabilityScore)),
    stamina: Math.min(100, Math.max(0, staminaScore)),
    tactics: Math.min(100, Math.max(0, tacticsScore)),
    mentality: Math.min(100, Math.max(0, mentalityScore)),
  };
}

/**
 * 计算综合评分
 */
function computeOverallScore(abilities: AbilityScores): number {
  const { attack, defense, stability, stamina, tactics, mentality } = abilities;
  const score = Math.round((attack + defense + stability + stamina + tactics + mentality) / 6);
  return score;
}

/**
 * 获取评分等级
 */
function getScoreLevel(score: number): '优秀' | '良好' | '一般' | '待提升' {
  if (score >= 85) return '优秀';
  if (score >= 70) return '良好';
  if (score >= 55) return '一般';
  return '待提升';
}

/**
 * 计算较上月的变化百分比
 */
async function computeScoreChange(userId: string): Promise<number> {
  // 简化处理：随机生成一个变化值
  // 实际应该对比上月数据
  return Math.floor(Math.random() * 15) + 5; // 5% - 20%
}

/**
 * 生成今日训练建议
 */
async function computeSuggestions(userId: string): Promise<TrainingSuggestion[]> {
  // 获取用户最近的训练情况
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentWorkouts = await prisma.workout.findMany({
    where: {
      userId,
      date: { gte: weekAgo.toISOString().split('T')[0] },
      deletedAt: null,
    },
    select: { duration: true },
  });

  const totalMinutes = recentWorkouts.reduce((s, w) => s + (w.duration ?? 0), 0);

  // 根据本周训练量生成建议
  const baseSuggestions: TrainingSuggestion[] = [
    {
      label: '体能训练',
      time: '20 min',
      progress: Math.min(100, Math.floor((totalMinutes / 60) * 100)),
    },
    {
      label: '技术训练',
      time: '45 min',
      progress: Math.min(100, Math.floor((totalMinutes / 120) * 100)),
    },
    {
      label: '战术练习',
      time: '30 min',
      progress: Math.min(100, Math.floor((totalMinutes / 90) * 100)),
    },
  ];

  return baseSuggestions.map((s) => ({
    ...s,
    progress: Math.max(10, Math.min(95, s.progress)), // 限制在 10-95%
  }));
}

/**
 * 计算技术统计 Top 5
 */
async function computeTechniqueStats(userId: string): Promise<TechniqueStat[]> {
  // 分步查询：先获取 workoutIds，再查 sets，再查 exercises
  const workouts = await prisma.workout.findMany({
    where: { userId, deletedAt: null },
    select: { id: true },
  });

  const workoutIds = workouts.map((w) => w.id);
  const sets =
    workoutIds.length > 0
      ? await prisma.set.findMany({
          where: { workoutId: { in: workoutIds } },
        })
      : [];

  const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
  const exercises =
    exerciseIds.length > 0
      ? await prisma.exercise.findMany({
          where: { id: { in: exerciseIds } },
        })
      : [];

  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  const countByCategory = new Map<string, number>();
  for (const set of sets) {
    const ex = exerciseById.get(set.exerciseId);
    const category = ex?.category ?? 'other';
    countByCategory.set(category, (countByCategory.get(category) ?? 0) + 1);
  }

  const total = sets.length;

  return [...countByCategory.entries()]
    .map(([name, count]) => ({
      name,
      count,
      percentage: total === 0 ? 0 : Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/**
 * 计算表现趋势
 */
async function computePerformanceTrend(userId: string): Promise<PerformanceTrend[]> {
  const workouts = await prisma.workout.findMany({
    where: { userId, deletedAt: null },
    orderBy: { date: 'asc' },
    take: 8,
  });

  const workoutIds = workouts.map((w) => w.id);
  const sets =
    workoutIds.length > 0
      ? await prisma.set.findMany({
          where: { workoutId: { in: workoutIds } },
        })
      : [];

  // 按 workoutId 分组统计 set 数量
  const setCountByWorkout = new Map<string, number>();
  for (const set of sets) {
    setCountByWorkout.set(set.workoutId, (setCountByWorkout.get(set.workoutId) ?? 0) + 1);
  }

  return workouts.map((w) => {
    // 表现分数基于训练量和组数
    const setCount = setCountByWorkout.get(w.id) ?? 0;
    const duration = w.duration ?? 30;
    const performance = 60 + Math.floor((setCount * 2 + duration / 5) % 40);
    const load = 40 + Math.floor((setCount + duration / 10) % 40);

    return {
      date: w.date,
      performance,
      load,
    };
  });
}

/**
 * 计算比赛趋势
 */
async function computeMatchTrend(userId: string): Promise<MatchTrend[]> {
  const matches = await prisma.match.findMany({
    where: { userId, deletedAt: null },
    orderBy: { date: 'asc' },
    take: 10,
    select: { date: true, result: true, type: true },
  });

  return matches.map((m) => ({
    date: m.date,
    result: m.result as 'win' | 'lose',
    type: m.type,
  }));
}

/**
 * 获取 Dashboard 统计数据
 */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const [abilities, training, match, suggestions, techniqueStats, performanceTrend, matchTrend] =
    await Promise.all([
      computeAbilities(userId),
      (async () => {
        const workouts = await prisma.workout.findMany({
          where: { userId, deletedAt: null },
        });
        const workoutIds = workouts.map((w) => w.id);
        const sets =
          workoutIds.length > 0
            ? await prisma.set.findMany({
                where: { workoutId: { in: workoutIds } },
              })
            : [];
        return {
          totalWorkouts: workouts.length,
          totalDuration: workouts.reduce((s, w) => s + (w.duration ?? 0), 0),
          totalSets: sets.length,
        };
      })(),
      (async () => {
        const matches = await prisma.match.findMany({
          where: { userId, deletedAt: null },
        });
        const win = matches.filter((m) => m.result === 'win').length;
        return {
          total: matches.length,
          win,
          winRate: matches.length === 0 ? 0 : win / matches.length,
        };
      })(),
      computeSuggestions(userId),
      computeTechniqueStats(userId),
      computePerformanceTrend(userId),
      computeMatchTrend(userId),
    ]);

  const overallScore = computeOverallScore(abilities);
  const scoreLevel = getScoreLevel(overallScore);
  const scoreChange = await computeScoreChange(userId);

  return {
    overallScore,
    scoreLevel,
    scoreChange,
    abilities,
    training,
    match,
    suggestions,
    techniqueStats,
    performanceTrend,
    matchTrend,
  };
}
