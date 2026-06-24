import { Router, type Request } from 'express';
import { createExerciseSchema, updateExerciseSchema } from '@sport-record/shared';
import { validate } from '../lib/validate.js';
import { success } from '../lib/response.js';
import { authenticate, optionalAuth } from '../lib/auth.js';
import * as service from '../services/exerciseService.js';

export const exerciseRouter = Router();

// 列表：游客仅内置，登录含自建
exerciseRouter.get('/', optionalAuth, async (req, res) => {
  const items = await service.list(req.user?.id);
  success(res, { list: items, total: items.length });
});

// 创建自建
exerciseRouter.post('/', authenticate, validate(createExerciseSchema, 'body'), async (req, res) => {
  const item = await service.create(req.body, req.user!.id);
  success(res, item, 201);
});

// 更新（仅自建 + 创建者）
exerciseRouter.patch(
  '/:id',
  authenticate,
  validate(updateExerciseSchema, 'body'),
  async (req: Request<{ id: string }>, res) => {
    const item = await service.update(req.params.id, req.body, req.user!.id);
    success(res, item);
  },
);

// 软删（仅自建 + 创建者）
exerciseRouter.delete('/:id', authenticate, async (req: Request<{ id: string }>, res) => {
  await service.remove(req.params.id, req.user!.id);
  success(res, null);
});
