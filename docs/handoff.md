# 工作交接 - sport-record

> 最后更新：2026-06-24 ｜ 交接人：李晓健
>
> 历史交接：`docs/handoff-old.md` 记录阶段 0→1→2 之间的早期状态（含更详细的根级配置清单与全阶段路线图概览），如需追溯更早上下文可查阅。

## 1. 进度概览与已完成工作

羽毛球训练与比赛记录分析平台（monorepo: web + server + shared）。7 阶段计划中阶段 0/1/2/3 已完成，下一步阶段 4。当前在 `dev` 分支，阶段 1/2/3 已分别提交（`feat(shared)`、`feat(server): 阶段2`、`feat(server): 阶段3 认证与权限`），工作区干净。

本次已完成（阶段 3：后端认证与权限，全程 TDD）：

- **密码工具** `lib/password.ts`：scrypt 哈希（随机 salt，`saltHex:hashHex` 存储）+ `timingSafeEqual` 校验。
- **JWT 工具** `lib/jwt.ts`：access 1h / refresh 30d，载荷带 `type` 字段防互用，`JWT_SECRET` 缺失 fail fast。
- **认证服务** `services/authService.ts`：
  - `register`：用户名唯一、scrypt 哈希、昵称默认=用户名、role=user；防御性复跑 zod schema。
  - `login`：5 次失败锁 15 分钟（`ACCOUNT_LOCKED`）、禁用账号 `ACCOUNT_DISABLED`、成功清零计数并签 access+refresh；用户不存在与密码错统一 `INVALID_CREDENTIALS`（不泄漏存在性）。
  - `refresh`：验 refresh token、校验用户存在且未禁用、签新 access（不轮换 refresh，无状态 JWT 不维护黑名单）。
- **auth 中间件 + ACL** `lib/auth.ts`：`authenticate`（挂 `req.user`）、`optionalAuth`（游客放行，但 token 无效仍 401 不静默降级）、`requireRole(...roles)`、`isOwner(resource, userId)`（命中 `userId`/`creatorId` 任一）。通过 module augmentation 扩展 Express `Request.user`。
- **auth 路由** `routes/auth.ts`：`POST /api/auth/{register,login,refresh,logout}` + `GET /api/auth/me`，refresh 走 httpOnly cookie（sameSite=lax, secure=prod, path=/api/auth）。`app.ts` 已挂载 cookie-parser 与 authRouter。
- **seed 脚本** `prisma/seed.ts`：20 项内置动作库（5 分类，幂等 findFirst 去重）+ `ADMIN_USERNAME` 命中已注册用户提权（密码不硬编码）。
- 测试：53/53 通过（password 4、jwt 7、authService 15、auth 中间件 13、auth 路由 9、infra 5），全流程覆盖注册→me→refresh→logout、5 次锁定、401/403、cookie 持久。
- 新增依赖：`jsonwebtoken` + `@types/jsonwebtoken`、`cookie-parser` + `@types/cookie-parser`、`@types/express-serve-static-core`（module augmentation 必需，pnpm 默认不提升该 transitive type）。

验收全通过：tsc 0 error、lint 0 error、`pnpm --filter server test` 53/53、seed 脚本 dev db 实跑 + 幂等 + admin 提权验证通过。

## 2. 进行中 / 未完成任务

- [x] 阶段 1+2 改动已提交（2 个 commit）
- [x] 阶段 3：后端认证与权限 —— 已完成
- [ ] **提交阶段 3 改动**：已就绪，待用户确认后提交（建议 commit `feat(server): 阶段3 认证与权限`）
- [ ] 阶段 4：后端业务 CRUD API —— 未开始
- [ ] 阶段 5：前端基础设施 —— 未开始
- [ ] 阶段 6：前端业务页面 —— 未开始
- [ ] 阶段 7：收尾 —— 未开始

> 完整 7 阶段顺序与每阶段验收标准见 `docs/plan.md`：
> 0 脚手架 → 1 shared → 2 后端基础 → 3 后端认证权限 → 4 后端业务 CRUD → 5 前端基础 → 6 前端业务页面 → 7 收尾。

## 3. 下一步计划

1. 确认提交阶段 3 改动（工作区已干净就绪）。
2. 执行阶段 4，详见 `docs/plan.md` 阶段 4。要点：按资源逐个实现 Exercise/Workout/Set/Event/Match 的路由+service+zod+权限+分页+软删除；回收站；统计；admin 用户管理；公开资料。复用阶段 2/3 的 `validate`/`pagination`/`authenticate`/`optionalAuth`/`requireRole`/`isOwner`/`basePrisma`。
3. 阶段 4 收尾建议跑 `security-review`（覆盖 ACL/软删除泄漏/分页越权）。

> 后续阶段顺序（详见 `docs/plan.md`）：4 业务 CRUD API → 5 前端基础(路由守卫/API client/Query/Zustand/主题/布局) → 6 前端业务页面 → 7 收尾(README/回归)。

## 4. 环境与运行命令

- 依赖安装：`pnpm install`
- 启动后端（dev）：`pnpm --filter server dev`（默认 `PORT=3000`，`DATABASE_URL=file:./db.sqlite`，需配 `JWT_SECRET`）
- 启动全栈：`pnpm dev`（web 尚未初始化 Vite，阶段 5 起可用）
- 构建 shared：`pnpm --filter shared build`
- 测试：`pnpm --filter server test`（自动建临时库 `.test/test.sqlite`，setup 默认 `JWT_SECRET=test-secret`）
- seed：`pnpm --filter server db:seed`（内置动作库 + ADMIN_USERNAME 提权，幂等可重复执行）
- lint / 类型检查：`pnpm lint` / `pnpm -r exec tsc --noEmit`
- 数据库迁移：`pnpm --filter server db:migrate`（需 `DATABASE_URL`，默认 `file:./db.sqlite`）
- 生成 client：`pnpm --filter server db:generate`
- 关键文件：
  - 设计：`docs/design.md`；计划：`docs/plan.md`（**必读，勿在交接文档里重复其内容，用路径引用**）
  - 认证：`packages/server/src/lib/{password,jwt,auth}.ts`、`packages/server/src/services/authService.ts`、`packages/server/src/routes/auth.ts`
  - 软删除实现：`packages/server/src/lib/prisma.ts`
  - 错误/响应：`packages/server/src/lib/{errors,errorHandler,response}.ts`
  - 校验/分页/限流：`packages/server/src/lib/{validate,pagination,rateLimit}.ts`
  - seed：`packages/server/prisma/seed.ts`
- 依赖注意：
  - 本机 node v24.16.0、pnpm 10.33.2（`.nvmrc` 写 20，能跑）
  - Prisma 7：`@prisma/client@7.8.0` + `@prisma/adapter-better-sqlite3` + `better-sqlite3`（native，已配 `onlyBuiltDependencies`）
  - zod：shared `^3.23.8`，server `^3.25.76`
  - Express 5、TypeScript 6.0.3、jsonwebtoken 9、cookie-parser 1.4.7
  - **JWT_SECRET 必填**：生产部署前需在 `.env` 配强随机串，缺失则启动期抛错

## 5. 备注（接手者必读）

### 阶段 3 关键约定

- **JWT 不轮换 refresh**：无状态 JWT 不维护黑名单，refresh 30 天有效期内可反复换 access。如需 refresh 轮换/吊销，需引入服务端存储（design.md 暂不要求）。
- **cookie 配置**：refresh cookie `path=/api/auth`，仅认证接口带；`secure` 仅 production 开（dev http 关）；`sameSite=lax` 防 CSRF。
- **错误码语义**：`INVALID_CREDENTIALS`（用户不存在/密码错，401）/ `ACCOUNT_LOCKED`（401）/ `ACCOUNT_DISABLED`（403）/ `INVALID_TOKEN`（access 失效，401）/ `INVALID_REFRESH_TOKEN`（refresh 失效，401）/ `UNAUTHORIZED`（未带 token，401）/ `FORBIDDEN`（角色不足，403）。前端按这些码决定跳登录还是刷新。
- **Express Request.user 类型扩展**：通过 `declare module 'express-serve-static-core'` augmentation，依赖显式安装的 `@types/express-serve-static-core`；若该 type 包被移除，tsc 会报 augmentation 找不到模块。
- **module augmentation 与 vitest globals**：`optionalAuth` 对无效 token 抛 401 而非降级为游客，是有意为之——避免前端误用过期 token 却以游客身份操作。

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

- `packages/server/src/app.ts` 的 `createApp(mountRoutes?)` 接受路由挂载回调，供 server 入口与测试复用；authRouter 已在 createApp 内挂载，阶段 4+ 的业务路由通过此参数挂载，在 `notFound`/`errorHandler` 之前。
- server/web 的 `src/index.ts`：server 已是真实入口（阶段 2），web 仍是阶段 1 的 import 冒烟占位（阶段 5 起）。
- `db.sqlite` 被 `.gitignore` 忽略，迁移文件已提交；`.test/` 临时测试库同样被忽略。
- `superpowers:test-driven-development` skill 已用于阶段 3；`security-review` 适合阶段 3/4 收尾。

### 技术栈关键决策（已定，不再讨论，详见 `docs/design.md`）

- 前端：Vite + React 18 + TS，React Router v6(loader+守卫)，TanStack Query + Zustand，shadcn/ui + Tailwind，Recharts，RHF + Zod，date-fns
- 后端：Express 5 + Prisma 7 + SQLite，JWT(access 1h 内存 / refresh 30d httpOnly cookie)，scrypt 密码哈希，zod 校验中间件，全局错误中间件，express-rate-limit 分级限流
- 角色三级：游客 / user / admin（RBAC + ACL）；公开默认开关（用户级默认公开 true，单条可覆盖设私有）；游客只读公开数据
- 软删除：全实体 `deletedAt` + Prisma extension 过滤 + 回收站（user 自己 / admin 全局），可恢复或彻底删除
- admin 初始化：`.env` 的 `ADMIN_USERNAME` 命中已注册用户即 seed 提权
- 纯在线（放弃 IndexedDB）；同源部署（dev Vite proxy `/api`→3000，生产 Express 托管静态）；暂不做 PWA、暂不部署、不记日志
- 包管理：pnpm workspace，`packageManager` 锁 `pnpm@10.33.2`；根级配置含 `eslint.config.js`(flat)、`.prettierrc.json`、`.prettierrcignore`、`.lintstagedrc.json`、`commitlint.config.js`、`.husky/{pre-commit,commit-msg}`、`.nvmrc`(node 20)、`.gitignore`
