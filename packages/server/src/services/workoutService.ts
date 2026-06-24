import {
  createWorkoutSchema,
  updateWorkoutSchema,
  type CreateWorkoutInput,
  type UpdateWorkoutInput,
} from '@sport-record/shared';
import { prisma } from '../lib/prisma.js';
import { isOwner } from '../lib/auth.js';
import { NOT_FOUND, FORBIDDEN } from '../lib/errors.js';

/**
 * 训练课 service（design.md 4.1 Workout + 5.2 + 3.4 公开机制）。
 * - 列表：游客仅公开；登录用户 自己全部 + 他人公开
 * - 详情：公开或归属自己/admin 可见，否则 404（不泄漏存在性）
 * - 改删：仅所有者（admin 可改任意）
 * - isPublic 未显式传入时取用户 defaultPublic
 */

export async function list(userId: string | undefined, skip: number, take: number) {
  const where = userId ? { OR: [{ userId }, { isPublic: true }] } : { isPublic: true };
  const [list, total] = await Promise.all([
    prisma.workout.findMany({ where, skip, take, orderBy: { date: 'desc' } }),
    prisma.workout.count({ where }),
  ]);
  return { list, total };
}

export async function create(input: CreateWorkoutInput, userId: string) {
  const data = createWorkoutSchema.parse(input);
  // isPublic 未传 → 取用户 defaultPublic（design 3.4）
  if (data.isPublic === undefined) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { defaultPublic: true },
    });
    data.isPublic = user?.defaultPublic ?? true;
  }
  return prisma.workout.create({ data: { ...data, userId } });
}

/** 详情：可见性校验，无权 → 404 */
export async function getById(id: string, userId: string | undefined, isAdmin: boolean) {
  const item = await prisma.workout.findUnique({ where: { id } });
  if (!item) throw NOT_FOUND('训练课不存在');
  const visible = item.isPublic || (userId !== undefined && isOwner(item, userId)) || isAdmin;
  if (!visible) throw NOT_FOUND('训练课不存在');
  return item;
}

/** 取得可改删的资源：不存在 404，非所有者且非 admin 403 */
async function getMutable(id: string, userId: string, isAdmin: boolean) {
  const item = await prisma.workout.findUnique({ where: { id } });
  if (!item) throw NOT_FOUND('训练课不存在');
  if (!isOwner(item, userId) && !isAdmin) throw FORBIDDEN('无权操作该训练课');
  return item;
}

export async function update(
  id: string,
  input: UpdateWorkoutInput,
  userId: string,
  isAdmin: boolean,
) {
  await getMutable(id, userId, isAdmin);
  const data = updateWorkoutSchema.parse(input);
  return prisma.workout.update({ where: { id }, data });
}

export async function remove(id: string, userId: string, isAdmin: boolean) {
  await getMutable(id, userId, isAdmin);
  await prisma.workout.delete({ where: { id } });
}
