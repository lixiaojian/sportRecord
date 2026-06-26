import {
  updateProfileSchema,
  changePasswordSchema,
  updateUserByAdminSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type UpdateUserByAdminInput,
  type UserSearchItem,
} from '@sport-record/shared';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { NOT_FOUND, UNAUTHORIZED } from '../lib/errors.js';

/**
 * 用户管理与资料 service（design.md 5.2 用户路由 + 4.1 User）。
 *
 * - admin 列表 / 禁用 / 改角色：仅 admin
 * - 公开资料：任意人可查，仅公开字段
 * - 改资料 / 改密：仅本人
 *
 * 任何对外返回均排除 passwordHash。
 */

// 公开资料字段（不含 role / disabled / 密码等敏感字段）
const PROFILE_SELECT = {
  id: true,
  username: true,
  nickname: true,
  avatar: true,
  bio: true,
  defaultPublic: true,
  racketHand: true,
  mainEvent: true,
  createdAt: true,
} as const;

// admin 视角字段（含管理用字段，仍不含密码）
const ADMIN_SELECT = {
  ...PROFILE_SELECT,
  role: true,
  disabled: true,
  updatedAt: true,
} as const;

/** admin 列表：分页 */
export async function list(skip: number, take: number) {
  const where = { deletedAt: null };
  const [list, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      select: ADMIN_SELECT,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  return { list, total };
}

/** admin 改用户：禁用 / 改角色 */
export async function updateByAdmin(id: string, input: UpdateUserByAdminInput) {
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw NOT_FOUND('用户不存在');
  const data = updateUserByAdminSchema.parse(input);
  return prisma.user.update({ where: { id }, data, select: ADMIN_SELECT });
}

/** 公开资料：任意人可查 */
export async function getProfile(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: PROFILE_SELECT });
  if (!user) throw NOT_FOUND('用户不存在');
  return user;
}

/** 搜索用户：按用户名/昵称模糊匹配，排除自己，仅公开字段，最多 limit 条 */
export async function search(keyword: string, currentUserId: string, limit = 10) {
  const where = {
    deletedAt: null,
    disabled: false,
    id: { not: currentUserId },
    OR: [{ username: { contains: keyword } }, { nickname: { contains: keyword } }],
  };
  const rows = await prisma.user.findMany({
    where,
    select: { id: true, username: true, nickname: true },
    take: limit,
    orderBy: { username: 'asc' },
  });
  return rows as UserSearchItem[];
}

/** 改自己资料 */
export async function updateMe(userId: string, input: UpdateProfileInput) {
  const data = updateProfileSchema.parse(input);
  return prisma.user.update({ where: { id: userId }, data, select: PROFILE_SELECT });
}

/** 改密码：校验旧密码，旧密码错误 401 */
export async function changePassword(userId: string, input: ChangePasswordInput) {
  const data = changePasswordSchema.parse(input);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) throw NOT_FOUND('用户不存在');

  const ok = await verifyPassword(data.oldPassword, user.passwordHash);
  if (!ok) throw UNAUTHORIZED('旧密码错误', 'INVALID_CREDENTIALS');

  const passwordHash = await hashPassword(data.newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return null;
}
