import {
  createEventSchema,
  updateEventSchema,
  type CreateEventInput,
  type UpdateEventInput,
} from '@sport-record/shared';
import { prisma } from '../lib/prisma.js';
import { isOwner } from '../lib/auth.js';
import { NOT_FOUND, FORBIDDEN } from '../lib/errors.js';

/**
 * 赛事 service（design.md 4.1 Event + 5.2 + 3.4 公开机制）。
 * 与 Workout 类似，归属字段为 creatorId。
 * - 列表：游客仅公开；登录 自己全部 + 他人公开
 * - 详情：公开或归属自己/admin 可见，否则 404
 * - 改删：仅创建者（admin 可改任意）
 * - isPublic 未显式传入时取用户 defaultPublic
 */

export async function list(userId: string | undefined, skip: number, take: number) {
  const where = userId ? { OR: [{ creatorId: userId }, { isPublic: true }] } : { isPublic: true };
  const [list, total] = await Promise.all([
    prisma.event.findMany({ where, skip, take, orderBy: { startDate: 'desc' } }),
    prisma.event.count({ where }),
  ]);
  return { list, total };
}

export async function create(input: CreateEventInput, userId: string) {
  const data = createEventSchema.parse(input);
  if (data.isPublic === undefined) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { defaultPublic: true },
    });
    data.isPublic = user?.defaultPublic ?? true;
  }
  return prisma.event.create({ data: { ...data, creatorId: userId } });
}

export async function getById(id: string, userId: string | undefined, isAdmin: boolean) {
  const item = await prisma.event.findUnique({ where: { id } });
  if (!item) throw NOT_FOUND('赛事不存在');
  const visible = item.isPublic || (userId !== undefined && isOwner(item, userId)) || isAdmin;
  if (!visible) throw NOT_FOUND('赛事不存在');
  return item;
}

async function getMutable(id: string, userId: string, isAdmin: boolean) {
  const item = await prisma.event.findUnique({ where: { id } });
  if (!item) throw NOT_FOUND('赛事不存在');
  if (!isOwner(item, userId) && !isAdmin) throw FORBIDDEN('无权操作该赛事');
  return item;
}

export async function update(
  id: string,
  input: UpdateEventInput,
  userId: string,
  isAdmin: boolean,
) {
  await getMutable(id, userId, isAdmin);
  const data = updateEventSchema.parse(input);
  return prisma.event.update({ where: { id }, data });
}

export async function remove(id: string, userId: string, isAdmin: boolean) {
  await getMutable(id, userId, isAdmin);
  await prisma.event.delete({ where: { id } });
}
