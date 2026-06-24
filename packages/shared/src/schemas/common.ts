import { z } from 'zod';

/**
 * 通用 schema：分页、统一响应、UUID、日期
 */

// UUID v4
export const uuidSchema = z.string().uuid('无效的 ID').or(z.literal('me'));

// ISO 日期字符串（YYYY-MM-DD 或完整 ISO）
export const dateSchema = z.string().min(1, '日期不能为空');

// 分页查询参数
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

// 分页响应载荷
export const paginatedDataSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    list: z.array(item),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
  });

export type PaginatedData<T> = {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
};

// 统一响应结构
// 成功：{ code: 0, message: 'ok', data }
// 失败：{ code: 'ERROR_CODE', message, data: null }
export const apiResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    code: z.union([z.literal(0), z.string()]),
    message: z.string(),
    data: data.nullable(),
  });

export type ApiResponse<T> = {
  code: 0 | string;
  message: string;
  data: T | null;
};
