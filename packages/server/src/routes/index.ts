import type { Express } from 'express';
import { exerciseRouter } from './exercise.js';
import { workoutRouter } from './workout.js';

/**
 * 挂载业务路由（design.md 5.2）。
 * 阶段 4 起逐资源加入；在限流与 auth 之后、兜底之前挂载（见 app.ts createApp）。
 */
export function mountBusinessRoutes(app: Express): void {
  app.use('/api/exercises', exerciseRouter);
  app.use('/api/workouts', workoutRouter);
}
