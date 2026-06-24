import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma, basePrisma } from '../lib/prisma.js';
import { validate } from '../lib/validate.js';
import { BAD_REQUEST } from '../lib/errors.js';
import { z } from 'zod';
import { success } from '../lib/response.js';

const app = createApp();

describe('health', () => {
  it('GET /api/health 返回 200 + 统一结构', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 0,
      message: 'ok',
      data: expect.objectContaining({ status: 'ok' }),
    });
  });
});

describe('错误中间件', () => {
  it('AppError 返回统一结构', async () => {
    const testApp = createApp((a) => {
      a.get('/api/boom', (_req, _res, next) => {
        next(BAD_REQUEST('自定义错误', 'CUSTOM'));
      });
    });
    const res = await request(testApp).get('/api/boom');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'CUSTOM', message: '自定义错误', data: null });
  });

  it('404 兜底', async () => {
    const res = await request(app).get('/api/no-such-route');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});

describe('zod 校验中间件', () => {
  const schema = z.object({ name: z.string().min(2) });
  const testApp = createApp((a) => {
    a.post('/api/validate', validate(schema, 'body'), (req, res) => success(res, req.body));
  });

  it('校验通过', async () => {
    const res = await request(testApp).post('/api/validate').send({ name: 'alice' });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ name: 'alice' });
  });

  it('校验失败返回 422 + 字段详情', async () => {
    const res = await request(testApp).post('/api/validate').send({ name: 'a' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('软删除', () => {
  beforeEach(async () => {
    // 软删会保留行占用唯一约束，清理需物理删除（basePrisma 不走 extension）
    await basePrisma.user.deleteMany({ where: { username: 'soft-del-user' } });
    await prisma.user.create({
      data: { username: 'soft-del-user', passwordHash: 'x', nickname: 'u' },
    });
  });

  it('delete 转为软删，常规查询不可见', async () => {
    const u = await prisma.user.findFirstOrThrow({
      where: { username: 'soft-del-user' },
    });
    await prisma.user.delete({ where: { id: u.id } });

    const found = await prisma.user.findFirst({ where: { id: u.id } });
    expect(found).toBeNull();
  });

  it('显式 deletedAt 条件 bypass 过滤，可查回收站', async () => {
    const u = await prisma.user.findFirstOrThrow({
      where: { username: 'soft-del-user' },
    });
    await prisma.user.delete({ where: { id: u.id } });

    const found = await prisma.user.findFirst({
      where: { username: 'soft-del-user', deletedAt: { not: null } },
    });
    expect(found).not.toBeNull();
    expect(found?.deletedAt).not.toBeNull();
  });
});
