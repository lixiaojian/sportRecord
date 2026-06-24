# 工作交接 - sport-record

> 最后更新：2026-06-24 ｜ 交接人：李晓健
>
> 历史交接：`docs/handoff-old.md` 记录阶段 0→1→2 之间的早期状态（含更详细的根级配置清单与全阶段路线图概览），如需追溯更早上下文可查阅。

## 1. 进度概览与已完成工作

羽毛球训练与比赛记录分析平台（monorepo: web + server + shared）。7 阶段计划中阶段 0/1/2 已完成，下一步阶段 3。当前在 `dev` 分支，**阶段 1+2 全部改动尚未提交**（工作区 dirty）。

本次已完成：

- **阶段 1（shared 包）**：8 枚举 + 全域 zod schema + 推导类型，`pnpm --filter shared build` 产出 dist，server/web 可 import。
  - 文件：`packages/shared/src/enums.ts`、`packages/shared/src/schemas/{common,auth,user,exercise,workout,set,event,match}.ts`、`packages/shared/src/index.ts`
- **阶段 2（后端基础设施）**：Express + Prisma 7 + SQLite，6 模型、软删除、错误处理、zod 中间件、限流、分页、health 路由。
  - Prisma：`packages/server/prisma/schema.prisma`、`packages/server/prisma.config.ts`、`prisma/migrations/20260624020636_init/`（已应用）
  - lib：`packages/server/src/lib/{prisma,errors,errorHandler,response,validate,pagination,rateLimit}.ts`
  - 应用：`packages/server/src/app.ts`、`packages/server/src/routes/health.ts`、`packages/server/src/index.ts`
  - 测试：`packages/server/src/lib/infra.test.ts`（7/7 通过）、`packages/server/src/test/setup.ts`、`packages/server/vitest.config.ts`
  - 配置：`packages/server/.env.example`、`pnpm-workspace.yaml`（加 `onlyBuiltDependencies`）

验收全通过：`/api/health` 200、AppError 统一结构、404 兜底、zod 422、软删除读写过滤、7/7 测试、全包 lint 0 error、tsc 0 error。

## 2. 进行中 / 未完成任务

- [ ] **提交阶段 1+2 改动**：工作区 dirty，未 commit。用户上次未明确要求提交，待确认。
- [ ] 阶段 3：后端认证与权限（JWT/scrypt/锁定/中间件/seed/测试）—— 未开始
- [ ] 阶段 4：后端业务 CRUD API —— 未开始
- [ ] 阶段 5：前端基础设施 —— 未开始
- [ ] 阶段 6：前端业务页面 —— 未开始
- [ ] 阶段 7：收尾 —— 未开始

> 完整 7 阶段顺序与每阶段验收标准见 `docs/plan.md`：
> 0 脚手架 → 1 shared → 2 后端基础 → 3 后端认证权限 → 4 后端业务 CRUD → 5 前端基础 → 6 前端业务页面 → 7 收尾。

## 3. 下一步计划

1. 确认是否提交阶段 1+2 改动（建议拆 2 个 commit：`feat(shared): 阶段1` + `feat(server): 阶段2 基础设施`）。
2. 执行阶段 3，详见 `docs/plan.md` 阶段 3。要点：
   - 认证服务：注册（scrypt 哈希 + 强度校验 + 用户名唯一）、登录（5 次失败锁 15 分钟 + 签 access/refresh）、刷新、登出
   - JWT 工具：access 1h（verify 签名 + exp）、refresh 30d（httpOnly cookie）
   - auth 中间件：`authenticate` / `optionalAuth` / `requireRole(...roles)`
   - ACL：`isOwner(resource, userId)`
   - seed 脚本：内置动作库 + `ADMIN_USERNAME` 提权（`packages/server/prisma/seed.ts`，`prisma.config.ts` 已配 seed 命令）
   - 单测/集成：注册、登录、锁定、刷新、权限拒绝（复用 `src/test/setup.ts` 临时库）
3. 阶段 3 完成后建议跑 `security-review`（JWT/scrypt/限流/ACL）。

> 后续阶段顺序（详见 `docs/plan.md`）：3 认证权限 → 4 业务 CRUD API → 5 前端基础(路由守卫/API client/Query/Zustand/主题/布局) → 6 前端业务页面 → 7 收尾(README/回归)。

## 4. 环境与运行命令

- 依赖安装：`pnpm install`
- 启动后端（dev）：`pnpm --filter server dev`（默认 `PORT=3000`，`DATABASE_URL=file:./db.sqlite`）
- 启动全栈：`pnpm dev`（web 尚未初始化 Vite，阶段 5 起可用）
- 构建 shared：`pnpm --filter shared build`
- 测试：`pnpm --filter server test`（自动建临时库 `.test/test.sqlite`）
- lint / 类型检查：`pnpm lint` / `pnpm -r exec tsc --noEmit`
- 数据库迁移：`pnpm --filter server db:migrate`（需 `DATABASE_URL`，默认 `file:./db.sqlite`）
- 生成 client：`pnpm --filter server db:generate`
- 关键文件：
  - 设计：`docs/design.md`；计划：`docs/plan.md`（**必读，勿在交接文档里重复其内容，用路径引用**）
  - 软删除实现：`packages/server/src/lib/prisma.ts`
  - 错误/响应：`packages/server/src/lib/{errors,errorHandler,response}.ts`
  - 校验/分页/限流：`packages/server/src/lib/{validate,pagination,rateLimit}.ts`
- 依赖注意：
  - 本机 node v24.16.0、pnpm 10.33.2（`.nvmrc` 写 20，能跑）
  - Prisma 7：`@prisma/client@7.8.0` + `@prisma/adapter-better-sqlite3` + `better-sqlite3`（native，已配 `onlyBuiltDependencies`）
  - zod：shared `^3.23.8`，server `^3.25.76`
  - Express 5、TypeScript 6.0.3

## 5. 备注（接手者必读）

### 软删除 bypass 方案的偏离

`docs/plan.md` 阶段 2 写"Prisma 软删除中间件 + 回收站 bypass"。原计划用 `AsyncLocalStorage` 做 `withDeleted()` bypass，但 **Prisma 7 的 query extension 经 thenable 调度，在 Node 24 实测不传播 ALS 上下文**（已知 issue prisma/prisma#20104）。

实际采用的方案（见 `packages/server/src/lib/prisma.ts` 顶部注释）：

- **读操作**：where 未显式声明 `deletedAt` 条件时自动追加 `deletedAt: null`。
- **bypass 约定**：回收站查询显式写 `where: { deletedAt: { not: null } }` 即跳过自动过滤。
- **delete/deleteMany**：改写为 `update { deletedAt: now }` 软删。
- **物理删除**：用导出的 `basePrisma`（原始 client，不走 extension）。

阶段 4 做回收站接口时，按此约定写查询；若需要 `withDeleted()` 式 API，可在 service 层包一层或直接用 `basePrisma`。

### Prisma 7 配置变化

- `schema.prisma` 的 `datasource` 块**只剩 `provider`**，`url` 已移到 `prisma.config.ts` 的 `datasource.url`（读 `DATABASE_URL` env）。
- `prisma migrate dev` / `generate` 需在 `packages/server` 目录下执行，会自动读 `prisma.config.ts`。

### 其他

- `packages/server/src/app.ts` 的 `createApp(mountRoutes?)` 接受路由挂载回调，供 server 入口与测试复用；阶段 3+ 的业务路由应通过此参数挂载，在 `notFound`/`errorHandler` 之前。
- server/web 的 `src/index.ts` 当前仍是阶段 1 的 import 冒烟占位（web 阶段 5、server 已被阶段 2 覆盖为真实入口）。
- `db.sqlite` 被 `.gitignore` 忽略，迁移文件已提交。
- `superpowers:test-driven-development` / `tdd` skill 适合阶段 3；`security-review` 适合阶段 3 收尾。

### 技术栈关键决策（已定，不再讨论，详见 `docs/design.md`）

- 前端：Vite + React 18 + TS，React Router v6(loader+守卫)，TanStack Query + Zustand，shadcn/ui + Tailwind，Recharts，RHF + Zod，date-fns
- 后端：Express 5 + Prisma 7 + SQLite，JWT(access 1h 内存 / refresh 30d httpOnly cookie)，scrypt 密码哈希，zod 校验中间件，全局错误中间件，express-rate-limit 分级限流
- 角色三级：游客 / user / admin（RBAC + ACL）；公开默认开关（用户级默认公开 true，单条可覆盖设私有）；游客只读公开数据
- 软删除：全实体 `deletedAt` + Prisma extension 过滤 + 回收站（user 自己 / admin 全局），可恢复或彻底删除
- admin 初始化：`.env` 的 `ADMIN_USERNAME` 命中已注册用户即 seed 提权
- 纯在线（放弃 IndexedDB）；同源部署（dev Vite proxy `/api`→3000，生产 Express 托管静态）；暂不做 PWA、暂不部署、不记日志
- 包管理：pnpm workspace，`packageManager` 锁 `pnpm@10.33.2`；根级配置含 `eslint.config.js`(flat)、`.prettierrc.json`、`.prettierrcignore`、`.lintstagedrc.json`、`commitlint.config.js`、`.husky/{pre-commit,commit-msg}`、`.nvmrc`(node 20)、`.gitignore`
