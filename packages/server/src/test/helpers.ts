import request from 'supertest';
import type { Express } from 'express';

/**
 * 测试辅助：注册一个用户并返回其 accessToken / userId。
 * 认证路由已在 createApp 内挂载，业务路由由调用方通过 mountRoutes 注入。
 */
export async function registerUser(
  app: Express,
  username: string,
  password = 'pass1234',
): Promise<{
  accessToken: string;
  userId: string;
  user: { id: string; username: string; role: string };
}> {
  const res = await request(app).post('/api/auth/register').send({ username, password });
  if (res.status !== 201) {
    throw new Error(`registerUser(${username}) failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  const { accessToken, user } = res.body.data;
  return { accessToken, userId: user.id, user };
}
