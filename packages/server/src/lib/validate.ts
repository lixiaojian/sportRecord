import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from './errors.js';

type Location = 'body' | 'query' | 'params';

/**
 * zod 校验中间件：校验指定位置，校验后用解析结果覆盖原位置（含 coerce/默认值）。
 * 校验失败抛 AppError，由全局错误中间件转 422。
 */
export function validate(schema: ZodTypeAny, location: Location): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const source = req[location];
    const result = schema.safeParse(source);
    if (!result.success) {
      // 用 AppError 携带 zod 详情，错误中间件识别后走 zodFail
      throw new AppError('VALIDATION_ERROR', '请求参数校验失败', 422, result.error);
    }
    req[location] = result.data;
    next();
  };
}
