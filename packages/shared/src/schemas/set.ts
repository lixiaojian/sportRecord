import { z } from 'zod';

/**
 * 训练记录（Set）schema
 * 多单位动态字段：按训练项 unit 决定填哪个字段，故业务字段全部可选
 */

export const createSetSchema = z.object({
  exerciseId: z.string().uuid('请选择训练项'),
  sets: z.number().int().min(0).optional(),
  reps: z.number().int().min(0).optional(),
  duration: z.number().int().min(0).optional(),
  distance: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  note: z.string().max(200).optional(),
});
export type CreateSetInput = z.infer<typeof createSetSchema>;

export const updateSetSchema = createSetSchema.partial();
export type UpdateSetInput = z.infer<typeof updateSetSchema>;

export const setSchema = z.object({
  id: z.string().uuid(),
  workoutId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  sets: z.number().int().nullable(),
  reps: z.number().int().nullable(),
  duration: z.number().int().nullable(),
  distance: z.number().nullable(),
  weight: z.number().nullable(),
  note: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Set = z.infer<typeof setSchema>;
