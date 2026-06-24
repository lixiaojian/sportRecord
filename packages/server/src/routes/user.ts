import { Router, type Request } from 'express';
import {
  updateProfileSchema,
  changePasswordSchema,
  updateUserByAdminSchema,
} from '@sport-record/shared';
import { validate } from '../lib/validate.js';
import { success } from '../lib/response.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { parsePagination, paginated } from '../lib/pagination.js';
import * as service from '../services/userService.js';

export const userRouter = Router();

// admin 列表
userRouter.get('/', authenticate, requireRole('admin'), async (req, res) => {
  const { page, pageSize, skip, take } = parsePagination(req.query);
  const { list, total } = await service.list(skip, take);
  success(res, paginated(list, total, { page, pageSize }));
});

// 改自己资料：固定路径 /me 必须在 /:id 之前声明，否则被 /:id 吞掉（id='me'）
userRouter.patch('/me', authenticate, validate(updateProfileSchema, 'body'), async (req, res) => {
  const item = await service.updateMe(req.user!.id, req.body);
  success(res, item);
});

userRouter.patch(
  '/me/password',
  authenticate,
  validate(changePasswordSchema, 'body'),
  async (req, res) => {
    await service.changePassword(req.user!.id, req.body);
    success(res, null);
  },
);

// admin 改用户（禁用/改角色）：:id 为 uuid
userRouter.patch(
  '/:id',
  authenticate,
  requireRole('admin'),
  validate(updateUserByAdminSchema, 'body'),
  async (req: Request<{ id: string }>, res) => {
    const item = await service.updateByAdmin(req.params.id, req.body);
    success(res, item);
  },
);

// 公开资料：任意人可查
userRouter.get('/:id/profile', async (req: Request<{ id: string }>, res) => {
  const item = await service.getProfile(req.params.id);
  success(res, item);
});
