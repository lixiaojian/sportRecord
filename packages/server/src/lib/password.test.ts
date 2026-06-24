import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password', () => {
  it('hashPassword 返回 salt:hash 格式且与原文不同', async () => {
    const hash = await hashPassword('pass1234');
    expect(hash).not.toBe('pass1234');
    expect(hash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
  });

  it('verifyPassword 正确密码返回 true', async () => {
    const hash = await hashPassword('pass1234');
    await expect(verifyPassword('pass1234', hash)).resolves.toBe(true);
  });

  it('verifyPassword 错误密码返回 false', async () => {
    const hash = await hashPassword('pass1234');
    await expect(verifyPassword('wrong999', hash)).resolves.toBe(false);
  });

  it('相同密码两次哈希结果不同（随机 salt）', async () => {
    const a = await hashPassword('pass1234');
    const b = await hashPassword('pass1234');
    expect(a).not.toBe(b);
  });
});
