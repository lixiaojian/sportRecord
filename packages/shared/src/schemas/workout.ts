import { z } from 'zod';
import { dateSchema } from './common.js';
import { setSchema } from './set.js';

/**
 * 训练课 schema
 */

export const createWorkoutSchema = z.object({
  date: dateSchema,
  title: z.string().min(1, '标题不能为空').max(100),
  feeling: z.string().max(50).optional(),
  duration: z.number().int().min(0).max(600).optional(),
  note: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});
export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

export const updateWorkoutSchema = createWorkoutSchema.partial();
export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;

export const workoutSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string(),
  title: z.string(),
  feeling: z.string().optional(),
  duration: z.number().int().nullable(),
  note: z.string().optional(),
  isPublic: z.boolean(),
  sets: z.array(setSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Workout = z.infer<typeof workoutSchema>;
