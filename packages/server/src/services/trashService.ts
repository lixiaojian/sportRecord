import { basePrisma } from '../lib/prisma.js';
import { NOT_FOUND, FORBIDDEN, AppError } from '../lib/errors.js';

/**
 * 回收站 service（design.md 4.3 + 5.2 回收站）。
 *
 * 软删除实体的 deletedAt != null 记录在此呈现。prisma 扩展会自动追加
 * `deletedAt: null` 过滤，故此处必须用 basePrisma（不经软删扩展）并显式写
 * `deletedAt: { not: null }` 才能查到回收站数据。
 *
 * - 列表：用户看自己软删项；admin 看全局。可按 type 过滤
 * - 恢复：置 deletedAt = null（仅归属者/admin）
 * - 彻底删除：物理删除（仅归属者/admin）
 *
 * 归属字段按模型不同：Exercise/Event 用 creatorId，Workout/Match 用 userId。
 */

/** 回收站支持的资源类型（与 design.md 5.2 路由 :type 对应） */
export const TRASH_TYPES = ['exercise', 'workout', 'event', 'match'] as const;
export type TrashType = (typeof TRASH_TYPES)[number];

type ModelKey = 'exercise' | 'workout' | 'event' | 'match';

const MODEL_BY_TYPE: Record<TrashType, ModelKey> = {
  exercise: 'exercise',
  workout: 'workout',
  event: 'event',
  match: 'match',
};

/** 各类型归属字段名（用于按所属者过滤） */
const OWNER_FIELD: Record<TrashType, 'creatorId' | 'userId'> = {
  exercise: 'creatorId',
  event: 'creatorId',
  workout: 'userId',
  match: 'userId',
};

/**
 * 统一的软删实体委托接口。Prisma 各 model 的 findMany/count/findUnique/
 * update/delete 签名各异，这里收窄为回收站用到的最小子集，避免联合类型不可调用。
 */
type TrashDelegate = {
  findMany(args: Record<string, unknown>): Promise<Record<string, unknown>[]>;
  count(args: Record<string, unknown>): Promise<number>;
  findUnique(args: { where: { id: string } }): Promise<Record<string, unknown> | null>;
  update(args: {
    where: { id: string };
    data: Record<string, unknown>;
  }): Promise<Record<string, unknown>>;
  delete(args: { where: { id: string } }): Promise<Record<string, unknown>>;
};

function delegate(type: TrashType): TrashDelegate {
  return basePrisma[MODEL_BY_TYPE[type]] as unknown as TrashDelegate;
}

export type TrashItem = {
  id: string;
  type: TrashType;
  deletedAt: Date;
  [key: string]: unknown;
};

/**
 * 列出回收站。
 * @param userId 当前用户
 * @param isAdmin admin 看全局，否则仅自己的软删项
 * @param type 可选类型过滤
 */
export async function list(
  userId: string,
  isAdmin: boolean,
  type?: TrashType,
  skip = 0,
  take = 20,
): Promise<{ list: TrashItem[]; total: number }> {
  const types: TrashType[] = type ? [type] : ([...TRASH_TYPES] as TrashType[]);
  const list: TrashItem[] = [];
  let total = 0;

  for (const t of types) {
    const ownerField = OWNER_FIELD[t];
    const where: Record<string, unknown> = { deletedAt: { not: null } };
    if (!isAdmin) where[ownerField] = userId;

    const model = delegate(t);
    const [rows, count] = await Promise.all([
      model.findMany({ where, skip, take, orderBy: { deletedAt: 'desc' } }),
      model.count({ where }),
    ]);
    for (const row of rows) {
      list.push({ ...row, id: row.id as string, type: t, deletedAt: row.deletedAt as Date });
    }
    total += count;
  }

  // 多类型合并后按删除时间倒序
  list.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
  return { list, total };
}

/** 取一条软删项并校验归属；不存在抛 404，无权抛 403 */
async function getOwnedSoftDeleted(type: TrashType, id: string, userId: string, isAdmin: boolean) {
  const model = delegate(type);
  const item = await model.findUnique({ where: { id } });
  if (!item || item.deletedAt === null) throw NOT_FOUND('回收站项不存在');
  const ownerField = OWNER_FIELD[type];
  const ownerId = item[ownerField] as string | null;
  if (!isAdmin && ownerId !== userId) throw FORBIDDEN('无权操作该回收站项');
  return item;
}

export async function restore(type: TrashType, id: string, userId: string, isAdmin: boolean) {
  await getOwnedSoftDeleted(type, id, userId, isAdmin);
  return delegate(type).update({ where: { id }, data: { deletedAt: null } });
}

export async function purge(type: TrashType, id: string, userId: string, isAdmin: boolean) {
  await getOwnedSoftDeleted(type, id, userId, isAdmin);
  // 彻底删除：物理删除，绕过软删扩展
  await delegate(type).delete({ where: { id } });
}

/** 校验 type 路径参数，非法抛 422 */
export function parseTrashType(raw: string): TrashType {
  if (!TRASH_TYPES.includes(raw as TrashType)) {
    throw new AppError('VALIDATION_ERROR', `不支持的资源类型: ${raw}`, 422);
  }
  return raw as TrashType;
}
