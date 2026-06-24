import {
  createSetSchema,
  updateSetSchema,
  type CreateSetInput,
  type UpdateSetInput,
} from '@sport-record/shared';
import { prisma } from '../lib/prisma.js';
import { NOT_FOUND, FORBIDDEN } from '../lib/errors.js';

/**
 * 训练记录（Set）service（design.md 4.1 Set + 5.2）。
 * - Set 无 deletedAt，不走软删除；删除即物理删除
 * - 创建：校验 workout 归属（所有者或 admin）
 * - 改删：经 workout 反查归属，所有者或 admin 可操作
 */

/** 取 workout 并校验归属，不存在 404，非所有者且非 admin 403 */
async function getOwnedWorkout(workoutId: string, userId: string, isAdmin: boolean) {
  const workout = await prisma.workout.findUnique({ where: { id: workoutId } });
  if (!workout) throw NOT_FOUND('训练课不存在');
  if (workout.userId !== userId && !isAdmin) throw FORBIDDEN('无权操作该训练课');
  return workout;
}

export async function create(
  workoutId: string,
  input: CreateSetInput,
  userId: string,
  isAdmin: boolean,
) {
  await getOwnedWorkout(workoutId, userId, isAdmin);
  const data = createSetSchema.parse(input);
  return prisma.set.create({ data: { ...data, workoutId } });
}

/** 经 set → workout 反查归属 */
async function getMutableSet(id: string, userId: string, isAdmin: boolean) {
  const set = await prisma.set.findUnique({ where: { id } });
  if (!set) throw NOT_FOUND('训练记录不存在');
  const workout = await prisma.workout.findUnique({ where: { id: set.workoutId } });
  // workout 被软删仍允许操作自己的 set？按设计回收站属阶段4-6，此处 workout 不存在或归属他人即拒
  if (!workout || (workout.userId !== userId && !isAdmin)) throw FORBIDDEN('无权操作该训练记录');
  return set;
}

export async function update(id: string, input: UpdateSetInput, userId: string, isAdmin: boolean) {
  await getMutableSet(id, userId, isAdmin);
  const data = updateSetSchema.parse(input);
  return prisma.set.update({ where: { id }, data });
}

export async function remove(id: string, userId: string, isAdmin: boolean) {
  await getMutableSet(id, userId, isAdmin);
  await prisma.set.delete({ where: { id } });
}
