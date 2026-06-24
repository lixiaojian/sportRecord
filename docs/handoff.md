# 工作交接 - sport-record

> 最后更新：2026-06-24 ｜ 交接人：李晓健
>
> 历史交接：`docs/handoff-old.md` 记录阶段 0→1→2 之间的早期状态（含更详细的根级配置清单与全阶段路线图概览），如需追溯更早上下文可查阅。

## 1. 进度概览与已完成工作

羽毛球训练与比赛记录分析平台（monorepo: web + server + shared）。7 阶段计划中阶段 0/1/2/3/4 已完成，下一步阶段 5。在 `main` 分支，阶段 4 各资源按"每资源一 commit"分别提交，工作区干净。

阶段 4（后端业务 CRUD API，全程 TDD）已完成，8 个资源各一 commit：

- **Exercise**：内置只读 + 用户自建 CRUD；`list(userId?)` 游客仅内置 / 登录内置+自建；`getOwned` 校验归属（内置或他人 → 403）。
- **Workout**：CRUD + 公开/私有过滤；归属字段 `userId`；`isPublic` 未传回退用户 `defaultPublic`；私有对他人 404（不泄漏存在性）。
- **Set**：嵌套 `POST /api/workouts/:id/sets` + 独立 `PATCH/DELETE /api/sets/:id`；无软删除（物理删）；经 set→workout 反查归属。
- **Event**：CRUD，归属字段 `creatorId`，模式同 Workout。
- **Match**：CRUD + 多局比分；`scores`/`opponentIds` 以 JSON 字符串入库、出库 parse 回数组（`fromDb`/`toDbScores`）。
- **回收站 Trash**：`basePrisma` 绕过软删扩展 + 显式 `deletedAt:{not:null}` 查回收站；列表（自己/admin 全局，`?type` 过滤+分页）、恢复（`deletedAt=null`）、彻底删除（物理 delete）；用 `TrashDelegate` 收窄 Prisma 联合 model 类型规避不可调用错误。
- **统计 Stats**：训练（次数/时长/Set 数/分类占比/月趋势）、比赛（总数/胜率/分类型/走势/对手胜率）；`training`/`match` 需登录计自己全部（含私有）；`public/:userId` 公开统计任意人可查仅公开数据+公开资料，用户不存在 404。
- **Users 管理与资料**：admin 列表/禁用/改角色（`requireRole('admin')`）；公开资料（任意人）；改资料/改密（仅本人）；`PROFILE_SELECT`/`ADMIN_SELECT` 显式 select 永不返回 `passwordHash`；改密校验旧密码（错→401）；`/me` 固定路径声明在 `/:id` 前（否则被 `:id='me'` 吞掉）。

可复用模式（所有 CRUD 资源一致）：service（list/create/getById/getMutable/update/remove）+ route（GET optionalAuth 分页 / POST authenticate validate / GET/:id optionalAuth / PATCH/:id authenticate validate / DELETE/:id authenticate），ACL 经 `req.user?.role === 'admin'` 与 `isOwner`，私有资源 404 保隐私，`isPublic` 回退 `defaultPublic`。

阶段 4 期间修复的关键基础设施漏洞（`src/test/setup.ts`）：原仅导出 `setup()` 但从未调用（vitest setupFiles 不自动调用导出函数），且多 worker 共享同一 `.test/test.sqlite` 导致并行冲突。修复为顶层调用 `setup()` + 按 `VITEST_POOL_ID` 隔离库文件（`test-${poolId}.sqlite`）。此修复是阶段 4 全程 TDD 的前提。

测试：148/148 通过（14 个测试文件），tsc 0 error，lint 0 error。

## 2. 进行中 / 未完成任务

- [x] 阶段 1+2+3 改动已提交
- [x] 阶段 4：后端业务 CRUD API —— 已完成（8 资源各一 commit + setup.ts 修复）
- [ ] 阶段 5：前端基础设施 —— 未开始
- [ ] 阶段 6：前端业务页面 —— 未开始
- [ ] 阶段 7：收尾 —— 未开始

> 完整 7 阶段顺序与每阶段验收标准见 `docs/plan.md`：
> 0 脚手架 → 1 shared → 2 后端基础 → 3 后端认证权限 → 4 后端业务 CRUD → 5 前端基础 → 6 前端业务页面 → 7 收尾。

## 3. 下一步计划

1. 执行阶段 5（前端基础设施），详见 `docs/plan.md` 阶段 5。要点：`packages/web` 初始化 Vite + React 18 + TS；React Router v6 loader + 守卫；API client（fetch 封装，自动带 credentials、401 刷新）；TanStack Query + Zustand；shadcn/ui + Tailwind 主题；布局壳。
2. 阶段 4 后端已就绪，前端可对接的 API 见 `docs/design.md` 5.2 路由表；统一响应 `{code,message,data}`，错误码语义见下文第 5 节。
3. 阶段 5 前建议跑一次 `security-review`（覆盖 ACL/软删除泄漏/分页越权/公开统计是否泄漏私有），作为阶段 4 收尾。

> 后续阶段顺序（详见 `docs/plan.md`）：5 前端基础(路由守卫/API client/Query/Zustand/主题/布局) → 6 前端业务页面 → 7 收尾(README/回归)。

## 4. 环境与运行命令

- 依赖安装：`pnpm install`
- 启动后端（dev）：`pnpm --filter server dev`（默认 `PORT=3000`，`DATABASE_URL=file:./db.sqlite`，需配 `JWT_SECRET`）
- 启动全栈：`pnpm dev`（web 尚未初始化 Vite，阶段 5 起可用）
- 构建 shared：`pnpm --filter shared build`
- 测试：`pnpm --filter server test`（按 `VITEST_POOL_ID` 每个 worker 一个独立临时库 `.test/test-${poolId}.sqlite`，setup 默认 `JWT_SECRET=test-secret`）
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

### 阶段 4 关键约定

- **统一 CRUD 模式**：service 暴露 `list/create/getById/getMutable/update/remove`；route 用 `optionalAuth` 分页读、`authenticate`+`validate` 写改删；ACL = `isOwner` || `req.user.role==='admin'`；私有资源对无权者一律 404（不泄漏存在性）。
- **归属字段不统一**：Workout/Match 用 `userId`，Exercise/Event 用 `creatorId`；`isOwner` 同时检查两者，回收站/统计需按模型取正确字段（见 `trashService.OWNER_FIELD`）。
- **isPublic 回退**：创建 Workout/Event/Match 时 `isPublic===undefined` → 取用户 `defaultPublic`（查一次 user）。
- **Match JSON 字段**：`scores`/`opponentIds` 在 SQLite 存 JSON 字符串，`matchService.fromDb`/`toDbScores` 负责转换；`update` 手动构建 dbData 字典仅更新显式传入字段。
- **回收站类型路由**：`/api/trash/:type/:id/restore` 与 `DELETE /api/trash/:type/:id`，`type ∈ exercise|workout|event|match`，非法 → 422（`parseTrashType`）。Set 无软删除，不在回收站支持范围。
- **回收站 Prisma 联合类型**：`basePrisma[model]` 返回各 model 方法的联合类型，TS 不可直接调用；用 `TrashDelegate` 接口收窄为 findMany/count/findUnique/update/delete 最小子集，`as unknown as TrashDelegate` 转换。
- **统计 publicOnly 参数**：`computeTraining/computeMatch(userId, publicOnly)`，自己统计 `publicOnly=false`（含私有），公开统计 `publicOnly=true`；分类占比经 Set join Exercise.category 聚合，对手胜率 parse `opponentIds`。
- **Users 路由声明顺序**：`/me` 与 `/me/password` 必须在 `/:id` 之前声明，否则 `PATCH /api/users/me` 被 `/:id` 匹配为 `id='me'`；`GET /:id/profile` 因固定后缀不冲突。
- **Users select 约束**：`PROFILE_SELECT`（公开，无 role/disabled）与 `ADMIN_SELECT`（含 role/disabled，仍无 passwordHash）显式列出字段，杜绝密码泄漏。

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
