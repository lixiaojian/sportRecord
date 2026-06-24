import { Router } from 'express';
import { success } from '../lib/response.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  success(res, { status: 'ok', time: new Date().toISOString() });
});
