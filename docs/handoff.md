# 工作交接 - sport-record

> 最后更新：2026-06-25 ｜ 交接人：李晓健
>
> 历史交接：`docs/handoff-old.md` 记录阶段 0→1→2 之间的早期状态（含更详细的根级配置清单与全阶段路线图概览），如需追溯更早上下文可查阅。上一版交接 `8d84adf docs: 更新交接文档，阶段 4 完成` 记录阶段 4 收尾状态。

## 1. 进度概览与已完成工作

羽毛球训练与比赛记录分析平台（monorepo: web + server + shared）。7 阶段计划中**阶段 0/1/2/3/4/5/6 已完成，仅剩阶段 7 收尾**。在 `main` 分支，工作区干净，每功能一 commit。

本次会话（2026-06-25）完成阶段 5（前端基础设施）+ 阶段 6（前端业务页面），共 11 个 commit：

- **阶段 5 前端基础设施**（2 commit + 1 端口调整）：
  - `053463f` 骨架：Vite 5.4 + React 19 + TS 6 + Tailwind v3 + shadcn 风格；React Router v6 `createBrowserRouter` + 守卫（`RequireAuth`/`RequireRole`）；API client（fetch 封装，401 自动刷新带 promise 去重）；TanStack Query v5 + Zustand v5；主题（浅/深/系统，localStorage）；AppLayout（响应式导航 + 移动端汉堡菜单）；RHF + zod。
  - `5a9b2df` 注册页 / 移动端导航 / query hooks。
  - `57a7e03` 后端端口 3000→3300（本机 3000 被 ucloud 控制台占用），同步 `.env.example`/docs。
- **阶段 6 前端业务页面**（8 commit，每功能一 commit）：
  - `0e27060` exercise 动作库：列表（内置徽章 + 自建）+ RHF 表单创建/编辑/删除，所有者门控。
  - `4acfbf7` dashboard 概览：游客分支（介绍 + 登录/注册）vs 登录分支（训练/比赛统计卡片 + 快捷入口）；含 stats api/hooks。
  - `a1d1199` training 训练课 + Set 录入：分页列表 + 详情；Set 录入按 `exercise.unit` 动态主字段（sets/duration/reps）+ 折叠重量/距离；RHF+zod。
  - `b9937c4` match 比赛 + 赛事：赛事 CRUD + 比赛多局比分（`useFieldArray` 动态增删）+ 类型联动搭档字段；详情关联赛事。
  - `43d1313` stats 统计图表：Recharts 饼图（分类占比）+ 折线（训练趋势/战绩走势）+ 柱状（各类型胜场）。
  - `1938a25` trash 回收站：类型筛选 + 分页 + 恢复/彻底删除（二次确认），恢复后联动刷新业务列表与统计。
  - `3c5bdeb` settings 设置：资料编辑 + 改密 + 主题切换 + 退出登录；资料保存后同步 authStore。
  - `cb6c540` admin 用户管理：分页列表 + 升降角色 + 启用/禁用，`RequireRole role="admin"` 守卫。

阶段 4（后端业务 CRUD API，全程 TDD）此前已完成，8 个资源各一 commit（详见上一版交接与 git log）：

- **Exercise**：内置只读 + 用户自建 CRUD；`list(userId?)` 游客仅内置 / 登录内置+自建；`getOwned` 校验归属。
- **Workout**：CRUD + 公开/私有过滤；`isPublic` 未传回退用户 `defaultPublic`；私有对他人 404。
- **Set**：嵌套 `POST /api/workouts/:id/sets` + 独立 `PATCH/DELETE /api/sets/:id`；无软删除；经 set→workout 反查归属。
- **Event**：CRUD，归属字段 `creatorId`，模式同 Workout。
- **Match**：CRUD + 多局比分；`scores`/`opponentIds` 以 JSON 字符串入库、出库 parse 回数组。
- **回收站 Trash**：`basePrisma` 绕过软删扩展 + 显式 `deletedAt:{not:null}`；列表/恢复/彻底删除；`TrashDelegate` 收窄联合类型。
- **统计 Stats**：训练（次数/时长/Set 数/分类占比/月趋势）、比赛（总数/胜率/分类型/走势/对手胜率）；`public/:userId` 公开统计。
- **Users 管理与资料**：admin 列表/禁用/改角色；公开资料；改资料/改密（仅本人）；`/me` 固定路径声明在 `/:id` 前。

可复用模式（前后端一致）：后端 service（list/create/getById/getMutable/update/remove）+ route（optionalAuth 分页读 / authenticate+validate 写改删），ACL = `isOwner` || admin，私有 404；前端 feature = `api.ts` + `hooks.ts`（useQuery/useMutation + invalidateQueries）+ 页面组件，RHF+zodResolver 共享 schema。

测试：后端 148/148 通过（14 测试文件）；前端 tsc 0 error、lint 0 error、`pnpm build` 生产构建通过（dist 903 kB，recharts 占大头，未做 code-split）。

## 2. 进行中 / 未完成任务

- [x] 阶段 1+2+3 改动已提交
- [x] 阶段 4：后端业务 CRUD API —— 已完成
- [x] 阶段 5：前端基础设施 —— 已完成（骨架 + 注册页 + 端口调整）
- [x] 阶段 6：前端业务页面 —— 已完成（8 功能各一 commit）
- [ ] **阶段 7：收尾 —— 未开始**（唯一剩余）

> 完整 7 阶段顺序与每阶段验收标准见 `docs/plan.md`：
> 0 脚手架 → 1 shared → 2 后端基础 → 3 后端认证权限 → 4 后端业务 CRUD → 5 前端基础 → 6 前端业务页面 → 7 收尾。

## 3. 下一步计划

执行阶段 7（收尾），详见 `docs/plan.md` 阶段 7。要点：

1. **README**：项目说明、启动命令、环境变量、目录结构。
2. **全局回归测试**：前后端联调跑通核心流程（注册→登录→建训练课→录 Set→录比赛→看统计→删→回收站恢复→admin 管理）。
3. **补充边界用例测试**：前端目前**无单测**（vitest 配置在但 src 下无 .test.tsx），阶段 7 可补关键 hook/表单校验测试；后端 148 测试已较全。
4. **整理 `.env.example`**：确认 `PORT=3300`/`DATABASE_URL`/`JWT_SECRET`/`ADMIN_USERNAME` 完整。
5. 可选优化：前端 code-split（recharts 懒加载）降 bundle 体积；比赛表单的对手/搭档选择当前是 UUID 文本输入（后端无用户搜索接口给普通用户），如需优化可加公开用户搜索端点。

风险/需澄清：

- 比赛对手 `opponentIds`/`partnerId` 关联注册用户，但后端只有 admin 用户列表 + `GET /:id/profile`，普通用户无法搜索用户。当前前端表单对手/搭档留空（schema 默认 `[]`/可空），统计"对不同对手胜率"在无对手数据时为空。是否补用户搜索接口待定。

## 4. 环境与运行命令

- 依赖安装：`pnpm install`
- 启动后端（dev）：`pnpm --filter server dev`（默认 `PORT=3300`，`DATABASE_URL=file:./db.sqlite`，需配 `JWT_SECRET`）
- 启动前端（dev）：`pnpm --filter web dev`（Vite 5173，proxy `/api`→`http://localhost:3300`）
- 启动全栈：`pnpm dev`
- 构建 shared：`pnpm --filter shared build`
- 构建前端：`pnpm --filter web build`（`tsc --noEmit && vite build`）
- 测试：`pnpm --filter server test`（按 `VITEST_POOL_ID` 每个 worker 一个独立临时库 `.test/test-${poolId}.sqlite`，setup 默认 `JWT_SECRET=test-secret`）；前端 `pnpm --filter web test`（vitest，当前无测试文件）
- seed：`pnpm --filter server db:seed`（内置动作库 + ADMIN_USERNAME 提权，幂等）
- lint / 类型检查：`pnpm lint` / `pnpm -r exec tsc --noEmit`
- 数据库迁移：`pnpm --filter server db:migrate`（需 `DATABASE_URL`）
- 生成 client：`pnpm --filter server db:generate`
- 关键文件：
  - 设计：`docs/design.md`；计划：`docs/plan.md`（**必读，勿在交接文档里重复其内容，用路径引用**）
  - 前端入口：`packages/web/src/{App.tsx,main.tsx}`；路由 + 守卫：`packages/web/src/App.tsx`、`packages/web/src/routes/guards.tsx`
  - 前端 API client：`packages/web/src/lib/api.ts`（401 刷新去重）；auth：`packages/web/src/lib/auth.ts`；store：`packages/web/src/stores/authStore.ts`；query keys：`packages/web/src/lib/queryKeys.ts`
  - 前端 feature 目录：`packages/web/src/features/{auth,exercise,dashboard,training,match,stats,trash,settings,admin}/`，每个含 `api.ts`+`hooks.ts`+页面
  - 认证：`packages/server/src/lib/{password,jwt,auth}.ts`、`packages/server/src/services/authService.ts`、`packages/server/src/routes/auth.ts`
  - 软删除实现：`packages/server/src/lib/prisma.ts`
  - 错误/响应：`packages/server/src/lib/{errors,errorHandler,response}.ts`
  - 校验/分页/限流：`packages/server/src/lib/{validate,pagination,rateLimit}.ts`
  - seed：`packages/server/prisma/seed.ts`
- 依赖注意：
  - 本机 node v24.16.0、pnpm 10.33.2（`.nvmrc` 写 20，能跑）
  - Prisma 7：`@prisma/client@7.8.0` + `@prisma/adapter-better-sqlite3` + `better-sqlite3`（native，已配 `onlyBuiltDependencies`）
  - 前端：React 19.2、@types/react 19.2（与 Prisma 7 间接依赖的 19 类型对齐，无 overrides）、react-router-dom 6.26、@tanstack/react-query 5.59、zustand 5、react-hook-form 7.80 + @hookform/resolvers 5.4、zod 4.4、recharts 3.9、tailwindcss 3.4 + tailwindcss-animate、lucide-react 0.446
  - zod：shared/server 用 ^3，web 用 ^4.4（前端独立装）
  - Express 5、TypeScript 6.0.3、jsonwebtoken 9、cookie-parser 1.4.7
  - **JWT_SECRET 必填**：生产部署前需在 `.env` 配强随机串，缺失则启动期抛错

## 5. 备注（接手者必读）

### 阶段 5/6 关键约定

- **API client 401 刷新**：`packages/web/src/lib/api.ts` 的 `request()` 遇 401 调 `refresh()`（POST `/api/auth/refresh`，带 credentials），刷新成功重试一次原请求；`refreshPromise` 共享去重并发 401；刷新失败 → `clearAuth()` + 抛 `ApiError(INVALID_REFRESH_TOKEN)`，守卫处理跳登录。`bootstrapAuth()` 在 App 挂载时调用以恢复会话。
- **access token 仅存内存**（authStore），刷新页面经 `/api/auth/refresh`（httpOnly cookie）恢复；不存 localStorage。
- **路由守卫**：`RequireAuth`（未登录跳 `/login` 带 `state.from`）、`RequireRole({role})`（角色不足跳 `/403`，admin 放行）。`/stats`、`/trash`、`/settings` 在 `RequireAuth` 下，`/admin/users` 在 `RequireRole role="admin"` 下。
- **feature 结构**：每个 feature = `api.ts`（调 `api.get/post/patch/delete`）+ `hooks.ts`（useQuery/useMutation，mutation 成功 `invalidateQueries` 相关 key + `['stats']`）+ 页面组件（RHF+zodResolver，`ApiError` 显示服务端错误）。
- **queryKeys 工厂**：`packages/web/src/lib/queryKeys.ts` 集中管理，列表分页用 `[...queryKeys.xxx, { page, pageSize }]` 派生 key。
- **比赛表单 zod 类型分叉**：`createMatchSchema.opponentIds` 带 `.default([])`，zod 输入类型（可选）与输出类型（必填）不一致，`useForm<CreateMatchInput>` + `zodResolver` 直接用会报 Resolver 类型不匹配；解法：`resolver: zodResolver(createMatchSchema) as unknown as Resolver<CreateMatchInput>`（见 `MatchForm.tsx`）。
- **Recharts**：`StatsPage` 用 PieChart/LineChart/BarChart，空数据时渲染 `<Empty/>` 占位；recharts 3.9。
- **资料保存同步 store**：`useUpdateProfile` 的 `onSuccess` 把返回 profile 合并进 authStore 当前用户（保留 role），避免 UI 显示旧资料。
- **前端无单测**：vitest 已配但 `packages/web/src` 下无测试文件，阶段 7 可补。

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

下一个 agent 在阶段 7 可调用：

- `superpowers:test-driven-development` —— 补前端 hook/表单单测时用
- `oh-my-claudecode:security-reviewer` —— 阶段 7 收尾做一次安全复审（ACL/软删除泄漏/公开统计是否泄漏私有/前端 token 处理）
- `oh-my-claudecode:verifier` —— 阶段 7 全局回归测试的完成度核验
- `work-handoff` —— 阶段 7 收工时再次落盘交接
