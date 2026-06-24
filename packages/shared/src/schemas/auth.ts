import { z } from 'zod';

/**
 * 认证 schema
 * 密码强度：8 位 + 字母 + 数字（design.md 3.1）
 */

const usernameSchema = z
  .string()
  .min(3, '用户名至少 3 位')
  .max(20, '用户名最多 20 位')
  .regex(/^[a-zA-Z0-9_]+$/, '用户名仅允许字母数字下划线');

const passwordSchema = z
  .string()
  .min(8, '密码至少 8 位')
  .max(64, '密码最多 64 位')
  .regex(/[a-zA-Z]/, '密码需包含字母')
  .regex(/[0-9]/, '密码需包含数字');

// 注册：昵称默认与用户名相同，由后端填充，这里可选
export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  nickname: z.string().min(1).max(20).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});
export type LoginInput = z.infer<typeof loginSchema>;

// 刷新：refresh token 走 httpOnly cookie，body 通常为空
export const refreshSchema = z.object({}).optional();
export type RefreshInput = z.infer<typeof refreshSchema>;
