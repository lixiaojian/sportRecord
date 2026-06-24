import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 测试 setup：每个测试运行前重建独立的 SQLite 临时库并执行迁移，
 * 保证测试间隔离。库文件路径写入 DATABASE_URL，由 prisma.ts 读取。
 */
// 并行运行时每个 worker（测试文件）一个独立库，避免多 worker 同时
// unlink/migrate 同一文件导致冲突。VITEST_POOL_ID 由 vitest 注入，单跑兜底 '0'。
const poolId = process.env.VITEST_POOL_ID ?? '0';
const TMP_DB = path.resolve(__dirname, `../../.test/test-${poolId}.sqlite`);

/**
 * 测试 setup：每个测试运行前重建独立的 SQLite 临时库并执行迁移，
 * 保证测试间隔离。库文件路径写入 DATABASE_URL，由 prisma.ts 读取。
 *
 * vitest 的 setupFiles 仅 import 文件、不自动调用导出函数，
 * 故在模块顶层显式执行，确保在任何测试模块（prisma/jwt）import 之前
 * 完成环境变量与临时库的准备工作。
 */
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

setup();
