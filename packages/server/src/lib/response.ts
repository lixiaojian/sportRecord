import type { Response } from 'express';
import type { ZodError } from 'zod';

/**
 * 统一响应工具，对应 design.md 5.1
 * 成功：{ code: 0, message: 'ok', data }
 * 失败：{ code: 'ERROR_CODE', message, data: null }
 */
export function success<T>(res: Response, data: T, statusCode = 200): Response {
  return res.status(statusCode).json({ code: 0, message: 'ok', data });
}

export function fail(res: Response, code: string, message: string, statusCode = 400): Response {
  return res.status(statusCode).json({ code, message, data: null });
}

/**
 * zod 校验失败响应：422，data 携带字段级错误
 */
export function zodFail(res: Response, error: ZodError): Response {
  return res.status(422).json({
    code: 'VALIDATION_ERROR',
    message: '请求参数校验失败',
    data: error.issues.map((i: { path: PropertyKey[]; message: string }) => ({
      path: i.path.join('.'),
      message: i.message,
    })),
  });
}
