import {
  createExerciseSchema,
  updateExerciseSchema,
  type CreateExerciseInput,
  type UpdateExerciseInput,
} from '@sport-record/shared';
import { prisma } from '../lib/prisma.js';
import { NOT_FOUND, FORBIDDEN } from '../lib/errors.js';

/**
 * 训练项（动作库）service（design.md 4.1 Exercise + 5.2 训练项路由）。
 * - 内置项（isBuiltIn=true）只读，不可改删
 * - 用户自建项归属 creatorId，仅创建者可改删
 */
export async function list(userId?: string) {
  // 游客仅内置；登录用户内置 + 自建
  const where = userId ? { OR: [{ isBuiltIn: true }, { creatorId: userId }] } : { isBuiltIn: true };
  const items = await prisma.exercise.findMany({
    where,
    orderBy: [{ isBuiltIn: 'desc' }, { createdAt: 'asc' }],
  });
  return items;
}

export async function create(input: CreateExerciseInput, userId: string) {
  const data = createExerciseSchema.parse(input);
  return prisma.exercise.create({
    data: { ...data, isBuiltIn: false, creatorId: userId },
  });
}

/** 取自建项并校验归属；内置或他人项抛 403，不存在抛 404 */
async function getOwned(id: string, userId: string) {
  const item = await prisma.exercise.findUnique({ where: { id } });
  if (!item) throw NOT_FOUND('训练项不存在');
  if (item.isBuiltIn || item.creatorId !== userId) throw FORBIDDEN('无权操作该训练项');
  return item;
}

export async function update(id: string, input: UpdateExerciseInput, userId: string) {
  await getOwned(id, userId);
  const data = updateExerciseSchema.parse(input);
  return prisma.exercise.update({ where: { id }, data });
}

export async function remove(id: string, userId: string) {
  await getOwned(id, userId);
  await prisma.exercise.delete({ where: { id } });
}
