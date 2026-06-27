import { Router } from 'express';
import { authenticate } from '../lib/auth.js';
import { success } from '../lib/response.js';
import * as service from '../services/dashboardService.js';

export const dashboardRouter = Router();

/**
 * GET /api/dashboard
 * 获取当前登录用户的 Dashboard 统计数据
 */
dashboardRouter.get('/', authenticate, async (req, res) => {
  const data = await service.getDashboardStats(req.user!.id);
  success(res, data);
});
