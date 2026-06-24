import { z } from 'zod';
import { EventTypeSchema } from '../enums.js';
import { dateSchema } from './common.js';

/**
 * 赛事 schema
 */

export const createEventSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100),
  type: EventTypeSchema,
  startDate: dateSchema,
  endDate: dateSchema.optional(),
  location: z.string().max(200).optional(),
  note: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial();
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const eventSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: EventTypeSchema,
  startDate: z.string(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  note: z.string().optional(),
  creatorId: z.string().uuid(),
  isPublic: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Event = z.infer<typeof eventSchema>;
