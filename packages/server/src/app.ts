import express from 'express';
import { apiLimiter } from './lib/rateLimit.js';
import { errorHandler, notFound } from './lib/errorHandler.js';
import { healthRouter } from './routes/health.js';

/**
 * 创建 Express app。
 * @param mountRoutes 在限流与 health 之后、兜底之前挂载业务路由，供 server 入口与测试复用。
 */
export function createApp(mountRoutes?: (app: express.Express) => void): express.Express {
  const app = express();

  app.use(express.json());
  app.use('/api', apiLimiter);

  // 路由
  app.use('/api', healthRouter);
  mountRoutes?.(app);

  // 兜底
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
