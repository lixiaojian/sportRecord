import { z } from 'zod';
import { ExerciseCategorySchema, ExerciseUnitSchema } from '../enums.js';

/**
 * 训练项（动作库）schema
 * 内置只读，用户可自建 CRUD
 */

export const createExerciseSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50),
  category: ExerciseCategorySchema,
  unit: ExerciseUnitSchema,
  note: z.string().max(500).optional(),
});
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;

export const updateExerciseSchema = createExerciseSchema.partial();
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;

export const exerciseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: ExerciseCategorySchema,
  unit: ExerciseUnitSchema,
  note: z.string().optional(),
  isBuiltIn: z.boolean(),
  creatorId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Exercise = z.infer<typeof exerciseSchema>;
