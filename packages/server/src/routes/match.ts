import { Router, type Request } from 'express';
import { createMatchSchema, updateMatchSchema } from '@sport-record/shared';
import { validate } from '../lib/validate.js';
import { success } from '../lib/response.js';
import { authenticate, optionalAuth } from '../lib/auth.js';
import { parsePagination, paginated } from '../lib/pagination.js';
import * as service from '../services/matchService.js';

export const matchRouter = Router();

matchRouter.get('/', optionalAuth, async (req, res) => {
  const { page, pageSize, skip, take } = parsePagination(req.query);
  const { list, total } = await service.list(req.user?.id, skip, take);
  success(res, paginated(list, total, { page, pageSize }));
});

matchRouter.post('/', authenticate, validate(createMatchSchema, 'body'), async (req, res) => {
  const item = await service.create(req.body, req.user!.id);
  success(res, item, 201);
});

matchRouter.get('/:id', optionalAuth, async (req: Request<{ id: string }>, res) => {
  const item = await service.getById(req.params.id, req.user?.id, req.user?.role === 'admin');
  success(res, item);
});

matchRouter.patch(
  '/:id',
  authenticate,
  validate(updateMatchSchema, 'body'),
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

matchRouter.delete('/:id', authenticate, async (req: Request<{ id: string }>, res) => {
  await service.remove(req.params.id, req.user!.id, req.user!.role === 'admin');
  success(res, null);
});
