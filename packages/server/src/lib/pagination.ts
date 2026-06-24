import { paginationSchema, type Pagination } from '@sport-record/shared';

/**
 * 从 query 解析分页参数，返回 { page, pageSize, skip, take }。
 * 复用 shared 的 paginationSchema（page/pageSize 经 coerce + 默认值）。
 */
export function parsePagination(query: Record<string, unknown>): Pagination & {
  skip: number;
  take: number;
} {
  const { page, pageSize } = paginationSchema.parse(query);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

/**
 * 构造分页响应载荷
 */
export function paginated<T>(list: T[], total: number, { page, pageSize }: Pagination) {
  return { list, total, page, pageSize };
}
