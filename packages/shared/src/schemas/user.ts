import { z } from 'zod';
import { RacketHandSchema, MainEventSchema, RoleSchema } from '../enums.js';

/**
 * 用户 schema
 */

// 改资料
export const updateProfileSchema = z.object({
  nickname: z.string().min(1).max(20).optional(),
  avatar: z.string().url().max(500).optional().or(z.literal('')),
  bio: z.string().max(200).optional(),
  defaultPublic: z.boolean().optional(),
  racketHand: RacketHandSchema.optional(),
  mainEvent: MainEventSchema.optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// 改密码
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, '请输入旧密码'),
    newPassword: z
      .string()
      .min(8, '密码至少 8 位')
      .max(64, '密码最多 64 位')
      .regex(/[a-zA-Z]/, '密码需包含字母')
      .regex(/[0-9]/, '密码需包含数字'),
  })
  .refine((v) => v.oldPassword !== v.newPassword, {
    message: '新密码不能与旧密码相同',
    path: ['newPassword'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// admin 改用户：禁用 / 改角色
export const updateUserByAdminSchema = z.object({
  role: RoleSchema.optional(),
  disabled: z.boolean().optional(),
});
export type UpdateUserByAdminInput = z.infer<typeof updateUserByAdminSchema>;

// 用户搜索查询参数：q 为用户名/昵称关键字，最少 1 字符
export const userSearchSchema = z.object({
  q: z.string().trim().min(1, '请输入搜索关键字').max(50),
});
export type UserSearchInput = z.infer<typeof userSearchSchema>;

// 用户搜索结果项：仅公开字段（供比赛表单选对手/搭档）
export const userSearchItemSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  nickname: z.string(),
});
export type UserSearchItem = z.infer<typeof userSearchItemSchema>;

// 用户公开资料响应
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  nickname: z.string(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  defaultPublic: z.boolean(),
  racketHand: RacketHandSchema.optional(),
  mainEvent: MainEventSchema.optional(),
  createdAt: z.string(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

// 当前登录用户（含敏感字段）
export const currentUserSchema = userProfileSchema.extend({
  role: RoleSchema,
});
export type CurrentUser = z.infer<typeof currentUserSchema>;
