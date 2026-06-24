import { z } from 'zod';
import { MatchTypeSchema, MatchResultSchema } from '../enums.js';
import { dateSchema } from './common.js';

/**
 * 比赛 schema
 * scores 为多局比分 [[21,15],[19,21]]，每局两个非负整数
 */

const scoreGameSchema = z
  .tuple([z.number().int().min(0), z.number().int().min(0)])
  .or(z.array(z.number().int().min(0)).length(2));

export const scoresSchema = z.array(scoreGameSchema);

export const createMatchSchema = z.object({
  eventId: z.string().uuid('请选择赛事'),
  type: MatchTypeSchema,
  date: dateSchema,
  partnerId: z.string().uuid().optional().nullable(),
  opponentIds: z.array(z.string().uuid()).default([]),
  scores: scoresSchema,
  result: MatchResultSchema,
  note: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});
export type CreateMatchInput = z.infer<typeof createMatchSchema>;

export const updateMatchSchema = createMatchSchema.partial();
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;

export const matchSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  type: MatchTypeSchema,
  date: z.string(),
  partnerId: z.string().uuid().nullable(),
  opponentIds: z.array(z.string().uuid()),
  scores: scoresSchema,
  result: MatchResultSchema,
  note: z.string().optional(),
  isPublic: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Match = z.infer<typeof matchSchema>;
