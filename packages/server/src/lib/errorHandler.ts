import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './errors.js';
import { fail, zodFail } from './response.js';

/**
 * 全局错误处理中间件（4 参数签名，Express 识别为错误处理器）。
 * - AppError：用其 code/statusCode/details
 * - ZodError：转 422 字段级错误
 * - 其他：500 INTERNAL_ERROR，不向前端泄漏内部信息
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (err.details instanceof ZodError) {
      zodFail(res, err.details);
      return;
    }
    fail(res, err.code, err.message, err.statusCode);
    return;
  }

  if (err instanceof ZodError) {
    zodFail(res, err);
    return;
  }

  // 未识别错误，记到 stderr（design 约定不记日志，但启动期异常需可见）
  console.error(err);
  fail(res, 'INTERNAL_ERROR', '服务器内部错误', 500);
}

/**
 * 404 兜底：未匹配路由
 */
export function notFound(_req: Request, res: Response): void {
  fail(res, 'NOT_FOUND', '路由不存在', 404);
}
