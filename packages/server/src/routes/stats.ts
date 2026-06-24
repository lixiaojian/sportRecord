import { Router, type Request } from 'express';
import { authenticate } from '../lib/auth.js';
import { success } from '../lib/response.js';
import * as service from '../services/statsService.js';

export const statsRouter = Router();

statsRouter.get('/training', authenticate, async (req, res) => {
  const data = await service.training(req.user!.id);
  success(res, data);
});

statsRouter.get('/match', authenticate, async (req, res) => {
  const data = await service.match(req.user!.id);
  success(res, data);
});

statsRouter.get('/public/:userId', async (req: Request<{ userId: string }>, res) => {
  const data = await service.publicStats(req.params.userId);
  success(res, data);
});
