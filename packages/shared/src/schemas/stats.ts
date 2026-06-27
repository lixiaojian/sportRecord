import { z } from 'zod';

/**
 * Stats 相关 schema - 用于训练和比赛统计数据
 */

// 训练统计
export const trainingStatsSchema = z.object({
  totalWorkouts: z.number(),
  totalDuration: z.number(),
  totalSets: z.number(),
  categoryRatio: z.array(
    z.object({
      category: z.string(),
      count: z.number(),
      ratio: z.number(),
    }),
  ),
  trend: z.array(
    z.object({
      period: z.string(),
      count: z.number(),
    }),
  ),
});
export type TrainingStats = z.infer<typeof trainingStatsSchema>;

// 比赛统计
export const matchStatsSchema = z.object({
  total: z.number(),
  win: z.number(),
  winRate: z.number(),
  byType: z.array(
    z.object({
      type: z.string(),
      total: z.number(),
      win: z.number(),
      winRate: z.number(),
    }),
  ),
  trend: z.array(
    z.object({
      date: z.string(),
      type: z.string(),
      result: z.string(),
    }),
  ),
  opponentWinRate: z.array(
    z.object({
      opponentId: z.string(),
      total: z.number(),
      win: z.number(),
      winRate: z.number(),
    }),
  ),
});
export type MatchStats = z.infer<typeof matchStatsSchema>;

// 公开统计响应
export const publicStatsSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    username: z.string(),
    nickname: z.string(),
    avatar: z.string().optional(),
    bio: z.string().optional(),
    defaultPublic: z.boolean(),
    racketHand: z.string().optional(),
    mainEvent: z.string().optional(),
    createdAt: z.string(),
  }),
  training: trainingStatsSchema,
  match: matchStatsSchema,
});
export type PublicStats = z.infer<typeof publicStatsSchema>;
