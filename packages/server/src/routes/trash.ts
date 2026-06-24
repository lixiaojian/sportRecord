import { Router, type Request } from 'express';
import { authenticate } from '../lib/auth.js';
import { success } from '../lib/response.js';
import { parsePagination, paginated } from '../lib/pagination.js';
import * as service from '../services/trashService.js';

export const trashRouter = Router();

trashRouter.get('/', authenticate, async (req, res) => {
  const { page, pageSize, skip, take } = parsePagination(req.query);
  const typeRaw = typeof req.query.type === 'string' ? req.query.type : undefined;
  const type = typeRaw ? service.parseTrashType(typeRaw) : undefined;
  const { list, total } = await service.list(
    req.user!.id,
    req.user!.role === 'admin',
    type,
    skip,
    take,
  );
  success(res, paginated(list, total, { page, pageSize }));
});

trashRouter.post(
  '/:type/:id/restore',
  authenticate,
  async (req: Request<{ type: string; id: string }>, res) => {
    const type = service.parseTrashType(req.params.type);
    const item = await service.restore(
      type,
      req.params.id,
      req.user!.id,
      req.user!.role === 'admin',
    );
    success(res, item);
  },
);

trashRouter.delete(
  '/:type/:id',
  authenticate,
  async (req: Request<{ type: string; id: string }>, res) => {
    const type = service.parseTrashType(req.params.type);
    await service.purge(type, req.params.id, req.user!.id, req.user!.role === 'admin');
    success(res, null);
  },
);
