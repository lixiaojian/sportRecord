import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEYLEN = 64;
const SALT_LEN = 16;

/**
 * scrypt 密码哈希（design.md 3.1）。
 * 存储格式：`<saltHex>:<hashHex>`，salt 每次随机。
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const hash = await scrypt(plain, salt, KEYLEN);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * 校验密码，使用 timingSafeEqual 防止计时攻击。
 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const hash = Buffer.from(hashHex, 'hex');
  const derived = await scrypt(plain, salt, KEYLEN);
  if (derived.length !== hash.length) return false;
  return timingSafeEqual(derived, hash);
}
