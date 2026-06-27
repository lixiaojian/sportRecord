import { z } from 'zod';

/**
 * Dashboard 相关 schema - 用于首页数据展示
 */

// 能力评分
export const abilityScoresSchema = z.object({
  attack: z.number().min(0).max(100), // 进攻能力
  defense: z.number().min(0).max(100), // 防守能力
  stability: z.number().min(0).max(100), // 技术稳定性
  stamina: z.number().min(0).max(100), // 体能水平
  tactics: z.number().min(0).max(100), // 战术意识
  mentality: z.number().min(0).max(100), // 心理素质
});
export type AbilityScores = z.infer<typeof abilityScoresSchema>;

// 训练建议
export const trainingSuggestionSchema = z.object({
  label: z.string(),
  time: z.string(),
  progress: z.number().min(0).max(100),
});
export type TrainingSuggestion = z.infer<typeof trainingSuggestionSchema>;

// 技术统计
export const techniqueStatSchema = z.object({
  name: z.string(),
  count: z.number(),
  percentage: z.number(),
});
export type TechniqueStat = z.infer<typeof techniqueStatSchema>;

// 表现趋势
export const performanceTrendSchema = z.object({
  date: z.string(),
  performance: z.number(),
  load: z.number(),
});
export type PerformanceTrend = z.infer<typeof performanceTrendSchema>;

// 比赛趋势
export const matchTrendSchema = z.object({
  date: z.string(),
  result: z.enum(['win', 'lose']),
  type: z.string(),
});
export type MatchTrend = z.infer<typeof matchTrendSchema>;

// Dashboard 统计响应
export const dashboardStatsSchema = z.object({
  // 综合评分
  overallScore: z.number(),
  scoreLevel: z.enum(['优秀', '良好', '一般', '待提升']),
  scoreChange: z.number(),

  // 能力雷达图
  abilities: abilityScoresSchema,

  // 训练概览
  training: z.object({
    totalWorkouts: z.number(),
    totalDuration: z.number(),
    totalSets: z.number(),
  }),

  // 比赛概览
  match: z.object({
    total: z.number(),
    win: z.number(),
    winRate: z.number(),
  }),

  // 今日训练建议
  suggestions: z.array(trainingSuggestionSchema),

  // 技术统计 Top 5
  techniqueStats: z.array(techniqueStatSchema),

  // 表现趋势
  performanceTrend: z.array(performanceTrendSchema),

  // 比赛趋势
  matchTrend: z.array(matchTrendSchema),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
