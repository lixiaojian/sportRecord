import { Router, type Request } from 'express';
import { createWorkoutSchema, updateWorkoutSchema } from '@sport-record/shared';
import { validate } from '../lib/validate.js';
import { success } from '../lib/response.js';
import { authenticate, optionalAuth } from '../lib/auth.js';
import { parsePagination, paginated } from '../lib/pagination.js';
import * as service from '../services/workoutService.js';

export const workoutRouter = Router();

// 列表：游客仅公开；登录含自己全部 + 他人公开
workoutRouter.get('/', optionalAuth, async (req, res) => {
  const { page, pageSize, skip, take } = parsePagination(req.query);
  const { list, total } = await service.list(req.user?.id, skip, take);
  success(res, paginated(list, total, { page, pageSize }));
});

// 创建
workoutRouter.post('/', authenticate, validate(createWorkoutSchema, 'body'), async (req, res) => {
  const item = await service.create(req.body, req.user!.id);
  success(res, item, 201);
});

// 详情：公开或自己/admin 可见
workoutRouter.get('/:id', optionalAuth, async (req: Request<{ id: string }>, res) => {
  const item = await service.getById(req.params.id, req.user?.id, req.user?.role === 'admin');
  success(res, item);
});

// 更新（所有者 / admin）
workoutRouter.patch(
  '/:id',
  authenticate,
  validate(updateWorkoutSchema, 'body'),
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

// 软删（所有者 / admin）
workoutRouter.delete('/:id', authenticate, async (req: Request<{ id: string }>, res) => {
  await service.remove(req.params.id, req.user!.id, req.user!.role === 'admin');
  success(res, null);
});
