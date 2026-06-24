import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'node:path';

// DATABASE_URL 形如 file:./db.sqlite，解析为绝对文件路径供 adapter 使用
const dbUrl = process.env.DATABASE_URL ?? 'file:./db.sqlite';
const dbFile = dbUrl.startsWith('file:') ? dbUrl.slice('file:'.length) : dbUrl;
const adapter = new PrismaBetterSqlite3({ url: `file:${path.resolve(dbFile)}` });

// 含软删除字段的模型；Set 无 deletedAt，不参与
const SOFT_DELETE_MODELS = new Set(['User', 'Exercise', 'Workout', 'Event', 'Match']);

const READ_OPS = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
]);

const DELETE_OPS = new Set(['delete', 'deleteMany']);

/**
 * 软删除 extension：
 *
 * - 读操作：当 where 未显式声明 deletedAt 条件时，自动追加 `deletedAt: null`，
 *   过滤掉已软删记录。回收站查询显式写 `deletedAt: { not: null }` 即可 bypass。
 * - delete/deleteMany：改写为 update { deletedAt: now }，实现软删。
 *
 * 注：曾尝试用 AsyncLocalStorage 做 withDeleted bypass，但 Prisma 7 的 query
 * extension 经 thenable 调度不传播 ALS 上下文（Node 24 实测无效），故改用
 * "显式 deletedAt 条件即 bypass" 的约定，更直接且并发安全。
 *
 * 物理删除（彻底删除）请用 basePrisma。
 */
export const basePrisma = new PrismaClient({ adapter });

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const isSoftModel = SOFT_DELETE_MODELS.has(model ?? '');

        if (isSoftModel && READ_OPS.has(operation)) {
          const a = args as { where?: Record<string, unknown> };
          const hasDeletedAtCond =
            !!a.where && Object.prototype.hasOwnProperty.call(a.where, 'deletedAt');
          if (!hasDeletedAtCond) {
            a.where = { ...a.where, deletedAt: null };
          }
        }

        if (isSoftModel && DELETE_OPS.has(operation)) {
          const where = (args as { where?: object }).where ?? {};
          const delegate = basePrisma[model as keyof typeof basePrisma] as unknown as {
            update: (a: unknown) => Promise<unknown>;
            updateMany: (a: unknown) => Promise<unknown>;
          };
          if (operation === 'delete') {
            return delegate.update({ where, data: { deletedAt: new Date() } });
          }
          return delegate.updateMany({ where, data: { deletedAt: new Date() } });
        }

        return query(args);
      },
    },
  },
});
