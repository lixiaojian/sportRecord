# 工作交接 - sport-record

> 最后更新：2026-06-26 ｜ 交接人：李晓健
>
> 历史交接：上一版 `fb1e14d docs: 更新交接文档，阶段 5+6 完成` 记录阶段 5/6 收尾与阶段 7 待办；更早的 `8d84adf` 记录阶段 4 收尾。`docs/handoff-old.md` 已不存在（合并到本文件）。

## 1. 进度概览与已完成工作

羽毛球训练与比赛记录分析平台（monorepo: web + server + shared）。**7 阶段计划全部完成**。在 `main` 分支，领先 origin 22 个 commit（尚未 push），工作区干净。

本次会话（2026-06-26）完成阶段 7 收尾必做项（1 commit `9218d2d`）：

- **README**：新建根 `README.md` —— 项目说明、技术栈、目录结构、环境要求、安装/配置/初始化/启动命令、环境变量表、常用命令表、核心约定、文档索引。
- **`.env.example` 修正**：`DB_PATH` → `DATABASE_URL`，与 `prisma.config.ts` 的 `env('DATABASE_URL')`、`lib/prisma.ts` 的 `process.env.DATABASE_URL`、`test/setup.ts` 写入的 `DATABASE_URL` 完全一致。原 `DB_PATH` 是历史遗留错误命名。
- **`.gitignore`**：新增忽略 `.codegraph`。
- **全局回归测试**：后端 148/148 通过（14 文件）；前端 tsc 0 error、lint 0 error、`vite build` 通过（dist 904 kB，recharts 占大头，未做 code-split，属可选优化）。

阶段 0–6 此前已完成（详见上一版交接与 git log）：

- 阶段 0 脚手架 → 1 shared → 2 后端基础 → 3 后端认证权限 → 4 后端业务 CRUD（8 资源，TDD，148 测试）→ 5 前端基础设施 → 6 前端业务页面（8 feature 各一 commit：exercise/dashboard/training/match/stats/trash/settings/admin）。

可复用模式（前后端一致）：后端 service（list/create/getById/getMutable/update/remove）+ route（optionalAuth 分页读 / authenticate+validate 写改删），ACL = `isOwner` || admin，私有 404；前端 feature = `api.ts` + `hooks.ts`（useQuery/useMutation + invalidateQueries）+ 页面组件，RHF+zodResolver 共享 schema。

## 2. 进行中 / 未完成任务

- [x] 阶段 1+2+3 改动已提交
- [x] 阶段 4：后端业务 CRUD API —— 已完成
- [x] 阶段 5：前端基础设施 —— 已完成
- [x] 阶段 6：前端业务页面 —— 已完成
- [x] 阶段 7：收尾 —— **必做项已完成**（README / .env.example / 回归测试）

剩余均为**可选优化**，未做：

- [ ] 前端单测：vitest 已配但 `packages/web/src` 下无测试文件，`packages/web` 缺 vitest/jsdom/@testing-library 等 devDependencies（当前仅根级有 vitest）。补测需先装依赖。建议优先补 `lib/api.ts` 的 401 刷新去重逻辑、`authStore`、关键表单 zod 校验。
- [ ] 前端 code-split：recharts 懒加载降 bundle 体积（当前 904 kB）。
- [ ] 比赛对手用户搜索接口：`opponentIds`/`partnerId` 关联注册用户，但后端只有 admin 用户列表 + `GET /:id/profile`，普通用户无法搜索用户。当前前端表单对手/搭档留空（schema 默认 `[]`/可空）。

> 完整 7 阶段顺序与每阶段验收标准见 `docs/plan.md`。

## 3. 下一步计划

阶段 7 收尾已完成，项目主线交付完毕。若继续，按优先级：

1. **`git push`**：本地领先 origin 22 commit，按需推送。
2. （可选）补前端单测：装 `vitest @testing-library/react jsdom` 等 devDep → 用 `superpowers:test-driven-development` 先补 `lib/api.ts` 401 刷新去重、`authStore`、表单 zod 校验。
3. （可选）前端 code-split：recharts 用 `React.lazy` 懒加载，降首屏 bundle。
4. （可选）用户搜索接口：后端加 `GET /api/users/search?q=`（公开/登录）供比赛表单选对手。
5. （可选）部署：当前暂不部署，design.md 记"生产 Express 托管静态"。

风险/需澄清：

- 比赛对手用户搜索是否要做，待定（见上"可选优化"）。

## 4. 环境与运行命令

- 依赖安装：`pnpm install`
- 启动后端（dev）：`pnpm --filter server dev`（默认 `PORT=3300`，`DATABASE_URL=file:./db.sqlite`，需配 `JWT_SECRET`）
- 启动前端（dev）：`pnpm --filter web dev`（Vite 5173，proxy `/api`→`http://localhost:3300`）
- 启动全栈：`pnpm dev`
- 构建 shared：`pnpm --filter shared build`
- 构建前端：`pnpm --filter web build`（`tsc --noEmit && vite build`）
- 测试：`pnpm --filter server test`（148/148 通过；按 `VITEST_POOL_ID` 每个 worker 一个独立临时库 `.test/test-${poolId}.sqlite`，setup 默认 `JWT_SECRET=test-secret`）；前端 `pnpm --filter web test`（vitest，**当前无测试文件且缺 devDep**）
- seed：`pnpm --filter server db:seed`（内置动作库 + ADMIN_USERNAME 提权，幂等）
- lint / 类型检查：`pnpm lint` / `pnpm -r exec tsc --noEmit`
- 数据库迁移：`pnpm --filter server db:migrate`（需 `DATABASE_URL`）
- 生成 client：`pnpm --filter server db:generate`
- 关键文件：
  - 设计：`docs/design.md`；计划：`docs/plan.md`（**必读，勿在交接文档里重复其内容，用路径引用**）；README：根 `README.md`
  - 前端入口：`packages/web/src/{App.tsx,main.tsx}`；路由 + 守卫：`packages/web/src/App.tsx`、`packages/web/src/routes/guards.tsx`
  - 前端 API client：`packages/web/src/lib/api.ts`（401 刷新去重）；auth：`packages/web/src/lib/auth.ts`；store：`packages/web/src/stores/authStore.ts`；query keys：`packages/web/src/lib/queryKeys.ts`
  - 前端 feature 目录：`packages/web/src/features/{auth,exercise,dashboard,training,match,stats,trash,settings,admin}/`，每个含 `api.ts`+`hooks.ts`+页面
  - 认证：`packages/server/src/lib/{password,jwt,auth}.ts`、`packages/server/src/services/authService.ts`、`packages/server/src/routes/auth.ts`
  - 软删除实现：`packages/server/src/lib/prisma.ts`
  - 错误/响应：`packages/server/src/lib/{errors,errorHandler,response}.ts`
  - 校验/分页/限流：`packages/server/src/lib/{validate,pagination,rateLimit}.ts`
  - seed：`packages/server/prisma/seed.ts`
  - Prisma 配置：`packages/server/prisma.config.ts`（datasource url 读 `DATABASE_URL` env）
- 依赖注意：
  - 本机 node v24.16.0、pnpm 10.33.2（`.nvmrc` 写 20，能跑）
  - Prisma 7：`@prisma/client@7.8.0` + `@prisma/adapter-better-sqlite3` + `better-sqlite3`（native，已配 `onlyBuiltDependencies`）
  - 前端：React 19.2、@types/react 19.2、react-router-dom 6.26、@tanstack/react-query 5.59、zustand 5、react-hook-form 7.80 + @hookform/resolvers 5.4、zod 4.4、recharts 3.9、tailwindcss 3.4 + tailwindcss-animate、lucide-react 0.446
  - zod：shared/server 用 ^3，web 用 ^4.4（前端独立装）
  - Express 5、TypeScript 6.0.3、jsonwebtoken 9、cookie-parser 1.4.7
  - **JWT_SECRET 必填**：生产部署前需在 `.env` 配强随机串，缺失则启动期抛错
  - **环境变量名是 `DATABASE_URL`**（非 DB_PATH）：`prisma.config.ts` / `lib/prisma.ts` / `test/setup.ts` 均读此名

## 5. 备注（接手者必读）

### 阶段 7 关键点

- **环境变量名统一为 `DATABASE_URL`**：上一版交接第 70 行曾误写 `DATABASE_URL=file:./db.sqlite` 但 `.env.example` 当时却是 `DB_PATH`，本次已修正 `.env.example` 为 `DATABASE_URL`，三者（config/lib/test）一致。
- **前端单测基建缺失**：`packages/web/package.json` 的 `test` 脚本是 `vitest run`，但 devDependencies 里没有 vitest（只有根级有）、没有 jsdom/@testing-library。直接 `pnpm --filter web test` 会报找不到 vitest。补测前需先装依赖并在 `vite.config.ts` 加 `test` 配置（environment: jsdom）。
- **README 已落地**：根 `README.md` 含完整启动流程，新人可照此启动。

### 阶段 5/6 关键约定

- **API client 401 刷新**：`packages/web/src/lib/api.ts` 的 `request()` 遇 401 调 `refresh()`（POST `/api/auth/refresh`，带 credentials），刷新成功重试一次原请求；`refreshPromise` 共享去重并发 401；刷新失败 → `clearAuth()` + 抛 `ApiError(INVALID_REFRESH_TOKEN)`，守卫处理跳登录。`bootstrapAuth()` 在 App 挂载时调用以恢复会话。
- **access token 仅存内存**（authStore），刷新页面经 `/api/auth/refresh`（httpOnly cookie）恢复；不存 localStorage。
- **路由守卫**：`RequireAuth`（未登录跳 `/login` 带 `state.from`）、`RequireRole({role})`（角色不足跳 `/403`，admin 放行）。`/stats`、`/trash`、`/settings` 在 `RequireAuth` 下，`/admin/users` 在 `RequireRole role="admin"` 下。
- **feature 结构**：每个 feature = `api.ts`（调 `api.get/post/patch/delete`）+ `hooks.ts`（useQuery/useMutation，mutation 成功 `invalidateQueries` 相关 key + `['stats']`）+ 页面组件（RHF+zodResolver，`ApiError` 显示服务端错误）。
- **queryKeys 工厂**：`packages/web/src/lib/queryKeys.ts` 集中管理，列表分页用 `[...queryKeys.xxx, { page, pageSize }]` 派生 key。
- **比赛表单 zod 类型分叉**：`createMatchSchema.opponentIds` 带 `.default([])`，zod 输入类型（可选）与输出类型（必填）不一致，`useForm<CreateMatchInput>` + `zodResolver` 直接用会报 Resolver 类型不匹配；解法：`resolver: zodResolver(createMatchSchema) as unknown as Resolver<CreateMatchInput>`（见 `MatchForm.tsx`）。
- **Recharts**：`StatsPage` 用 PieChart/LineChart/BarChart，空数据时渲染 `<Empty/>` 占位；recharts 3.9。
- **资料保存同步 store**：`useUpdateProfile` 的 `onSuccess` 把返回 profile 合并进 authStore 当前用户（保留 role），避免 UI 显示旧资料。
- **前端无单测**：vitest 已配但 `packages/web/src` 下无测试文件且缺 devDep，阶段 7 可补（见上）。

### 阶段 3 关键约定

- **JWT 不轮换 refresh**：无状态 JWT 不维护黑名单，refresh 30 天有效期内可反复换 access。
- **cookie 配置**：refresh cookie `path=/api/auth`，仅认证接口带；`secure` 仅 production 开；`sameSite=lax`。
- **错误码语义**：`INVALID_CREDENTIALS`（401）/ `ACCOUNT_LOCKED`（401）/ `ACCOUNT_DISABLED`（403）/ `INVALID_TOKEN`（access 失效 401）/ `INVALID_REFRESH_TOKEN`（refresh 失效 401）/ `UNAUTHORIZED`（未带 token 401）/ `FORBIDDEN`（角色不足 403）。前端按这些码决定跳登录还是刷新。
- **module augmentation 与 vitest globals**：`optionalAuth` 对无效 token 抛 401 而非降级为游客，是有意为之——避免前端误用过期 token 却以游客身份操作。

### 阶段 4 关键约定

- **统一 CRUD 模式**：service 暴露 `list/create/getById/getMutable/update/remove`；route 用 `optionalAuth` 分页读、`authenticate`+`validate` 写改删；ACL = `isOwner` || admin；私有资源对无权者一律 404（不泄漏存在性）。
- **归属字段不统一**：Workout/Match 用 `userId`，Exercise/Event 用 `creatorId`；`isOwner` 同时检查两者，回收站/统计需按模型取正确字段（见 `trashService.OWNER_FIELD`）。
- **isPublic 回退**：创建 Workout/Event/Match 时 `isPublic===undefined` → 取用户 `defaultPublic`。
- **Match JSON 字段**：`scores`/`opponentIds` 在 SQLite 存 JSON 字符串，`matchService.fromDb`/`toDbScores` 负责转换；`update` 手动构建 dbData 字典仅更新显式传入字段。
- **回收站类型路由**：`/api/trash/:type/:id/restore` 与 `DELETE /api/trash/:type/:id`，`type ∈ exercise|workout|event|match`，非法 → 422（`parseTrashType`）。Set 无软删除，不在回收站支持范围。
- **回收站 Prisma 联合类型**：`basePrisma[model]` 返回联合类型 TS 不可直接调用；用 `TrashDelegate` 接口收窄，`as unknown as TrashDelegate` 转换。
- **统计 publicOnly 参数**：`computeTraining/computeMatch(userId, publicOnly)`，自己统计 `publicOnly=false`（含私有），公开统计 `publicOnly=true`。
- **Users 路由声明顺序**：`/me` 与 `/me/password` 必须在 `/:id` 之前声明，否则被 `:id='me'` 吞掉。
- **Users select 约束**：`PROFILE_SELECT`（公开，无 role/disabled）与 `ADMIN_SELECT`（含 role/disabled，仍无 passwordHash）显式列出字段。

### 软删除 bypass 方案的偏离

`docs/plan.md` 阶段 2 写"Prisma 软删除中间件 + 回收站 bypass"。原计划用 `AsyncLocalStorage` 做 `withDeleted()` bypass，但 **Prisma 7 的 query extension 经 thenable 调度，在 Node 24 实测不传播 ALS 上下文**（已知 issue prisma/prisma#20104）。

实际采用的方案（见 `packages/server/src/lib/prisma.ts` 顶部注释）：

- **读操作**：where 未显式声明 `deletedAt` 条件时自动追加 `deletedAt: null`。
- **bypass 约定**：回收站查询显式写 `where: { deletedAt: { not: null } }` 即跳过自动过滤。
- **delete/deleteMany**：改写为 `update { deletedAt: now }` 软删。
- **物理删除**：用导出的 `basePrisma`（原始 client，不走 extension）。

### Prisma 7 配置变化

- `schema.prisma` 的 `datasource` 块**只剩 `provider`**，`url` 已移到 `prisma.config.ts` 的 `datasource.url`（读 `DATABASE_URL` env）。
- `prisma migrate dev` / `generate` 需在 `packages/server` 目录下执行，会自动读 `prisma.config.ts`。

### 其他

- `packages/server/src/app.ts` 的 `createApp(mountRoutes?)` 接受路由挂载回调，供 server 入口与测试复用；业务路由通过此参数挂载，在 `notFound`/`errorHandler` 之前。
- `db.sqlite` 被 `.gitignore` 忽略，迁移文件已提交；`.test/` 临时测试库同样被忽略；`packages/server/.env`（dev）已创建且 gitignored。
- 后端端口 **3300**（非 3000，本机 3000 被占用）；前端 Vite 5173 代理 `/api`→3300。
- `superpowers:test-driven-development` skill 已用于阶段 3；`security-review` 适合阶段 3/4 收尾。

### 技术栈关键决策（已定，不再讨论，详见 `docs/design.md`）

- 前端：Vite + React 19 + TS，React Router v6(createBrowserRouter+守卫)，TanStack Query + Zustand，shadcn/ui + Tailwind，Recharts，RHF + Zod
- 后端：Express 5 + Prisma 7 + SQLite，JWT(access 1h 内存 / refresh 30d httpOnly cookie)，scrypt 密码哈希，zod 校验中间件，全局错误中间件，express-rate-limit 分级限流
- 角色三级：游客 / user / admin（RBAC + ACL）；公开默认开关（用户级默认公开 true，单条可覆盖设私有）；游客只读公开数据
- 软删除：全实体 `deletedAt` + Prisma extension 过滤 + 回收站（user 自己 / admin 全局），可恢复或彻底删除
- admin 初始化：`.env` 的 `ADMIN_USERNAME` 命中已注册用户即 seed 提权
- 纯在线（放弃 IndexedDB）；同源部署（dev Vite proxy `/api`→3300，生产 Express 托管静态）；暂不做 PWA、暂不部署、不记日志
- 包管理：pnpm workspace，`packageManager` 锁 `pnpm@10.33.2`；根级配置含 `eslint.config.js`(flat)、`.prettierrc.json`、`.prettierrcignore`、`.lintstagedrc.json`、`commitlint.config.js`、`.husky/{pre-commit,commit-msg}`、`.nvmrc`(node 20)、`.gitignore`

## 6. Suggested skills

下一个 agent 在可选优化阶段可调用：

- `superpowers:test-driven-development` —— 补前端 hook/表单单测时用（需先装 vitest/jsdom/@testing-library devDep）
- `oh-my-claudecode:security-reviewer` —— 做一次安全复审（ACL/软删除泄漏/公开统计是否泄漏私有/前端 token 处理）
- `oh-my-claudecode:verifier` —— 全局回归测试的完成度核验
- `work-handoff` —— 再次收工时落盘交接
