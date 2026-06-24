import { Router, type Request } from 'express';
import { createSetSchema, updateSetSchema } from '@sport-record/shared';
import { validate } from '../lib/validate.js';
import { success } from '../lib/response.js';
import { authenticate } from '../lib/auth.js';
import * as service from '../services/setService.js';

/**
 * Set 路由（design.md 5.2）：
 * - workoutSetRouter 挂在 /api/workouts，提供 POST /:id/sets（嵌套创建）
 * - setRouter 挂在 /api/sets，提供独立 PATCH/DELETE /:id
 */
export const workoutSetRouter = Router();
export const setRouter = Router();

// 嵌套创建：POST /api/workouts/:id/sets
workoutSetRouter.post(
  '/:id/sets',
  authenticate,
  validate(createSetSchema, 'body'),
  async (req: Request<{ id: string }>, res) => {
    const item = await service.create(
      req.params.id,
      req.body,
      req.user!.id,
      req.user!.role === 'admin',
    );
    success(res, item, 201);
  },
);

// 独立更新：PATCH /api/sets/:id
setRouter.patch(
  '/:id',
  authenticate,
  validate(updateSetSchema, 'body'),
  async (req: Request<{ id: string }>, res) => {
    const item = await service.update(
      req.params.id,
      req.body,
      req.user!.id,
      req.user!.role === 'admin',
    );
    success(res, item);
  },
);

// 独立删除：DELETE /api/sets/:id（物理删除，Set 无软删）
setRouter.delete('/:id', authenticate, async (req: Request<{ id: string }>, res) => {
  await service.remove(req.params.id, req.user!.id, req.user!.role === 'admin');
  success(res, null);
});
