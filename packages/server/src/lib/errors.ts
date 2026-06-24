/**
 * AppError：业务错误基类，携带 HTTP 状态码与错误码。
 * 全局错误中间件捕获后统一响应 { code, message, data: null }。
 * 可选 details 携带 zod 校验详情等附加信息。
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(code: string, message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const BAD_REQUEST = (message = '请求参数错误', code = 'BAD_REQUEST') =>
  new AppError(code, message, 400);
export const UNAUTHORIZED = (message = '未登录', code = 'UNAUTHORIZED') =>
  new AppError(code, message, 401);
export const FORBIDDEN = (message = '权限不足', code = 'FORBIDDEN') =>
  new AppError(code, message, 403);
export const NOT_FOUND = (message = '资源不存在', code = 'NOT_FOUND') =>
  new AppError(code, message, 404);
export const CONFLICT = (message = '资源冲突', code = 'CONFLICT') =>
  new AppError(code, message, 409);
