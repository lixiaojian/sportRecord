import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 测试 setup：每个测试运行前重建独立的 SQLite 临时库并执行迁移，
 * 保证测试间隔离。库文件路径写入 DATABASE_URL，由 prisma.ts 读取。
 */
const TMP_DB = path.resolve(__dirname, '../../.test/test.sqlite');

export function setup(): void {
  // JWT 密钥：测试默认值，未显式设置时兜底
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-secret';
  fs.mkdirSync(path.dirname(TMP_DB), { recursive: true });
  if (fs.existsSync(TMP_DB)) fs.unlinkSync(TMP_DB);
  process.env.DATABASE_URL = `file:${TMP_DB}`;
  execSync('pnpm exec prisma migrate deploy', {
    stdio: 'ignore',
    cwd: path.resolve(__dirname, '../..'),
    env: { ...process.env, DATABASE_URL: `file:${TMP_DB}` },
  });
}
