# 工作交接 - sport-record

> 最后更新：2026-06-27 ｜ 交接人：李晓健
>
> 历史交接：上一版 `1e53bb7 docs: 更新交接文档，阶段 7 收尾完成` 记录阶段 7 必做项收尾；更早 `fb1e14d` 记录阶段 5/6、`8d84adf` 记录阶段 4。`docs/handoff-old.md` 已不存在（合并到本文件）。

## 1. 进度概览与已完成工作

羽毛球训练与比赛记录分析平台（monorepo: web + server + shared）。**7 阶段计划全部完成**。在 `main` 分支，已与 origin 同步，工作区干净。

本次会话（2026-06-27）— 前端 UI 组件封装升级：

将所有原生 HTML 表单输入组件替换为 shadcn/ui 风格"三合一"封装组件（Label + Control + Error），统一表单模式。

- **新建 layout.tsx**：Stack / Grid / Container 布局组件（Tailwind 完整类名映射，杜绝 JIT 拼接）
- **新建 field.tsx**：Field 体系组件（Field / FieldLabel / FieldError / FieldDescription / FieldGroup / FieldSet / FieldLegend / FieldContent / FieldSeparator），基于 shadcn/ui 官方 Field 组件体系
- **新建 form-field.tsx**：FormField 三合一（Label + Input + Error），支持 register 模式 / Controller 受控模式 / inputProps 受控模式
- **新建 form-textarea.tsx**：FormTextarea 三合一（Label + Textarea + Error）
- **新建 form-select.tsx**：FormSelect 三合一（Label + Select + Error），支持 `options: SelectOption[]` 数组 + register / 受控
- **替换所有表单页面**：
  - `ExerciseForm.tsx`：FormField / FormSelect / FormTextarea + FieldGroup
  - `WorkoutForm.tsx`：FormField / FormTextarea + FieldGroup
  - `SetForm.tsx`：FormField / FormSelect + FieldGroup
  - `SettingsPage.tsx`：FormField / FormTextarea / FormSelect + FieldGroup
  - `MatchForm.tsx`：FormField / FormTextarea / FormSelect / FieldGroup（含 useFieldArray 比分、UserPicker 搭档对手）
  - `EventForm.tsx`：FormField / FormTextarea / FormSelect + FieldGroup
  - `LoginPage.tsx`：FormField inputProps 受控模式（替换 FormInputField）
  - `RegisterPage.tsx`：FormField inputProps 受控模式（替换 FormInputField）
  - `UserPicker.tsx`：Field / FieldLabel / FieldError（替换 form-controls 的 Input / Label / FieldError）
- **重写 DashboardPage.tsx**：Stack / Grid / Card / Badge / Progress 替换原生 HTML
- **清理 form-controls.tsx**：移除 `Label`、`FieldError` 导出，仅保留 `Input / Textarea / Select` 底层样式组件
- **清理 field.tsx**：移除 `FormInputField` 旧兼容组件及导出
- **TypeScript 编译零错误通过**，无残留的 `form-controls` Label/FieldError 导入

此前会话（2026-06-26）分两批，共 3 个 commit：

批次一 — 阶段 7 收尾必做项（`9218d2d` + `1e53bb7`）：

- **README**：新建根 `README.md` —— 项目说明、技术栈、目录结构、环境要求、安装/配置/初始化/启动命令、环境变量表、常用命令表、核心约定、文档索引。
- **`.env.example` 修正**：`DB_PATH` → `DATABASE_URL`，与 `prisma.config.ts` 的 `env('DATABASE_URL')`、`lib/prisma.ts` 的 `process.env.DATABASE_URL`、`test/setup.ts` 写入的 `DATABASE_URL` 完全一致。原 `DB_PATH` 是历史遗留错误命名。
- **`.gitignore`**：新增忽略 `.codegraph`。
- **全局回归测试**：后端 148/148 通过（14 文件）；前端 tsc 0 error、lint 0 error、`vite build` 通过。

批次二 — 可选优化（`eea6f87`）：

- **code-split 路由懒加载**：`App.tsx` 用 `React.lazy` 拆分所有路由页面 + `Suspense` 包裹。首屏 bundle **904 kB → 328 kB**（gzip 266 kB → 104 kB），recharts（420 kB）随 `StatsPage` 延后加载。
- **用户搜索接口**（前后端打通）：
  - shared：`userSearchSchema`（q 最少 1 字符）+ `UserSearchItem`（id/username/nickname）类型，已从 `index.ts` 导出。
  - server：`userService.search(keyword, currentUserId, limit=10)` —— 按 username/nickname `contains` 模糊匹配，排除自己/`disabled`/软删用户，仅返回公开三字段；`GET /api/users/search` 路由（`authenticate`，固定路径 `/search` 在 `/:id` 前声明）。**注意**：Express 5 的 `req.query` 是只读 getter，不能用 `validate(query)` 中间件覆盖，故路由内用 `userSearchSchema.safeParse` 内联校验，失败抛 `AppError('VALIDATION_ERROR',422)`。
  - server 测试：`user.test.ts` 补 3 例（无 token 401 / 无 q 422 / 模糊匹配 200 且排除自己无敏感字段），后端 **151/151** 通过。
  - web：`features/match/api.ts` 增 `usersApi.search/getProfile`；`hooks.ts` 增 `useUserSearch`（staleTime 10s）+ `useUserProfiles`（`useQueries` 批量取 profile 供编辑回显）；`lib/queryKeys.ts` 增 `userSearch(q)`。
  - web：新组件 `components/ui/UserPicker.tsx` —— single/multiple 双模式，输入关键字 → 下拉候选 → 选中并以 chip 回显名称，点击外部收起。
  - web：`MatchForm.tsx` 搭档/对手从 UUID 文本输入改为 `UserPicker` 搜索选择；编辑模式用 `useUserProfiles` 回显已选用户名。

阶段 0–6 此前已完成（详见上一版交接与 git log）：

- 阶段 0 脚手架 → 1 shared → 2 后端基础 → 3 后端认证权限 → 4 后端业务 CRUD（8 资源，TDD）→ 5 前端基础设施 → 6 前端业务页面（8 feature 各一 commit：exercise/dashboard/training/match/stats/trash/settings/admin）。

可复用模式（前后端一致）：后端 service（list/create/getById/getMutable/update/remove）+ route（optionalAuth 分页读 / authenticate+validate 写改删），ACL = `isOwner` || admin，私有 404；前端 feature = `api.ts` + `hooks.ts`（useQuery/useMutation + invalidateQueries）+ 页面组件，RHF+zodResolver 共享 schema。

## 2. 进行中 / 未完成任务

- [x] 阶段 1+2+3 改动已提交
- [x] 阶段 4：后端业务 CRUD API —— 已完成
- [x] 阶段 5：前端基础设施 —— 已完成
- [x] 阶段 6：前端业务页面 —— 已完成
- [x] 阶段 7：收尾 —— **必做项已完成**（README / .env.example / 回归测试）
- [x] 可选优化：code-split 路由懒加载 —— 已完成
- [x] 可选优化：用户搜索接口（前后端） —— 已完成
- [x] UI 组件封装升级：三合一表单组件 + Field 体系 + layout 组件 —— 已完成

**遗留（可选，未做）**：

- [ ] 前端单测：`packages/web` 缺 vitest/jsdom/@testing-library 等 devDependencies（当前仅根级有 vitest），`src` 下无测试文件。补测需先装依赖并在 `vite.config.ts` 加 `test` 配置（environment: jsdom）。建议优先补 `lib/api.ts` 的 401 刷新去重逻辑、`authStore`、`UserPicker` 交互、`MatchForm` zod 校验。用 `superpowers:test-driven-development`。

> 完整 7 阶段顺序与每阶段验收标准见 `docs/plan.md`。

## 3. 下一步计划

项目主线已交付，与 origin 同步。仅剩前端单测一项遗留（可选）。若继续：

1. （可选）补前端单测：装 `vitest @testing-library/react @testing-library/user-event jsdom` devDep → `vite.config.ts` 加 `test:{environment:'jsdom'}` → 用 `superpowers:test-driven-development` 先补 `lib/api.ts` 401 刷新去重、`authStore`、`UserPicker`、`MatchForm` 校验。
2. （可选）部署：当前暂不部署，design.md 记"生产 Express 托管静态"。
3. 收工时再次 `work-handoff` 落盘。

## 4. 前端组件体系（当前）

### UI 组件层

| 文件                              | 组件                                                                                                             | 用途                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `components/ui/layout.tsx`        | Stack, Grid, Container                                                                                           | 布局（Tailwind 完整类名映射，杜绝 `gap-${n}` JIT 拼接）                           |
| `components/ui/field.tsx`         | Field, FieldLabel, FieldError, FieldDescription, FieldGroup, FieldSet, FieldLegend, FieldContent, FieldSeparator | shadcn/ui Field 体系，表单结构组件                                                |
| `components/ui/form-field.tsx`    | FormField                                                                                                        | 三合一：Label + Input + Error（支持 register / Controller / inputProps 三种模式） |
| `components/ui/form-textarea.tsx` | FormTextarea                                                                                                     | 三合一：Label + Textarea + Error                                                  |
| `components/ui/form-select.tsx`   | FormSelect                                                                                                       | 三合一：Label + Select + Error（支持 `options: SelectOption[]` 数组）             |
| `components/ui/form-controls.tsx` | Input, Textarea, Select                                                                                          | 底层样式组件（仅样式封装，不再导出 Label / FieldError）                           |
| `components/ui/button.tsx`        | Button                                                                                                           | shadcn/ui Button                                                                  |
| `components/ui/card.tsx`          | Card, CardContent, CardFooter                                                                                    | shadcn/ui Card                                                                    |
| `components/ui/badge.tsx`         | Badge                                                                                                            | shadcn/ui Badge                                                                   |
| `components/ui/progress.tsx`      | Progress                                                                                                         | shadcn/ui Progress                                                                |
| `components/ui/UserPicker.tsx`    | UserPicker                                                                                                       | 用户搜索选择器（single / multiple 模式）                                          |

### 表单模式约定

- **RHF + register 模式**（主流）：`<FormField label="名称" error={errors.name?.message} register={register('name')} />`
- **RHF + Controller 模式**：`<FormField label="名称" error={fieldState} inputProps={field} />`
- **手动受控模式**（非 RHF 页面如 LoginPage）：`<FormField label="名称" inputProps={{ value, onChange: (e) => setV(e.target.value) }} />`
- error prop 兼容 string 或 RHF fieldState 对象，自动提取 message
- 所有表单页面用 `FieldGroup` 包裹多个 Field，统一 `gap-4`
- 布局用 `Grid colsMd={2} gap={3}` 实现双列

### 已移除

- `form-controls.tsx` 的 `Label`、`FieldError` 导出（功能已被 `field.tsx` 的 `FieldLabel`、`FieldError` 替代）
- `field.tsx` 的 `FormInputField` 旧兼容组件（已被 `FormField` inputProps 模式替代）

## 5. 环境与运行命令

- 依赖安装：`pnpm install`
- 启动后端（dev）：`pnpm --filter server dev`（默认 `PORT=3300`，`DATABASE_URL=file:./db.sqlite`，需配 `JWT_SECRET`）
- 启动前端（dev）：`pnpm --filter web dev`（Vite 5173，proxy `/api`→`http://localhost:3300`）
- 启动全栈：`pnpm dev`
- 构建 shared：`pnpm --filter shared build`
- 构建前端：`pnpm --filter web build`（`tsc --noEmit && vite build`）
- 测试：`pnpm --filter server test`（**151/151** 通过；按 `VITEST_POOL_ID` 每个 worker 一个独立临时库 `.test/test-${poolId}.sqlite`，setup 默认 `JWT_SECRET=test-secret`）；前端 `pnpm --filter web test`（vitest，**当前无测试文件且缺 devDep**）
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

## 6. 备注（接手者必读）

### 阶段 7 关键点

- **环境变量名统一为 `DATABASE_URL`**：上一版交接第 70 行曾误写 `DATABASE_URL=file:./db.sqlite` 但 `.env.example` 当时却是 `DB_PATH`，本次已修正 `.env.example` 为 `DATABASE_URL`，三者（config/lib/test）一致。
- **前端单测基建缺失**：`packages/web/package.json` 的 `test` 脚本是 `vitest run`，但 devDependencies 里没有 vitest（只有根级有）、没有 jsdom/@testing-library。直接 `pnpm --filter web test` 会报找不到 vitest。补测前需先装依赖并在 `vite.config.ts` 加 `test` 配置（environment: jsdom）。**此项已记为遗留**。
- **README 已落地**：根 `README.md` 含完整启动流程，新人可照此启动。

### 可选优化关键点（本次完成）

- **路由懒加载**：`App.tsx` 所有路由页面用 `React.lazy(() => import(...).then(m => ({default: m.X}))})`，`RouterProvider` 外包 `<Suspense fallback={<PageFallback/>}>`。首屏 index chunk 328 kB（gzip 104 kB），`StatsPage` chunk 421 kB（含 recharts，gzip 121 kB）延后加载。`AppLayout`、`guards`、`lib/*` 仍在主 chunk。
- **用户搜索接口（Express 5 坑）**：`req.query` 在 Express 5 是只读 getter，`validate(schema,'query')` 中间件想 `req.query = result.data` 会抛 `Cannot set property query of #<IncomingMessage> which has only a getter`。故 `GET /api/users/search` 改为路由内 `userSearchSchema.safeParse(req.query)` 内联校验。后续凡 query 校验都需内联，或改造 `validate` 支持 query（只解析不覆盖）。
- **用户搜索路由声明顺序**：`/search` 是固定路径，必须在 `/:id` 与 `/:id/profile` 之前声明，否则被 `:id='search'` 吞掉。与 `/me`、`/me/password` 同理。
- **UserPicker 组件**：`packages/web/src/components/ui/UserPicker.tsx`，`mode:'single'`（搭档，单选 + chip 回显 + ×移除）与 `mode:'multiple'`（对手，多选 + chip 列表）共用；输入关键字触发 `useUserSearch`（staleTime 10s），点外部收起；已选 id 通过 `selectedMap` 回显名称。`MatchForm` 编辑模式用 `useUserProfiles`（`useQueries` 批量取 `/:id/profile`）填充 `selectedMap`。
- **搜索结果约束**：`userService.search` 排除自己（`id:{not:currentUserId}`）、`disabled:true`、软删（`deletedAt:null`），只 select `{id,username,nickname}`，take 10，按 username 升序。

### UI 组件封装升级关键点（2026-06-27）

- **三合一组件独立文件**：FormField / FormTextarea / FormSelect 各自独立文件，不在一个 field.tsx 里堆砌。
- **FormField 三模式**：register prop 直接传 `register('name')` 返回值；Controller/受控用 `inputProps` 传 field 对象或 `{ value, onChange }`；error prop 兼容 string 和 RHF `fieldState` 对象。
- **FormSelect options 数组**：`options: SelectOption[]`（`{ value, label }`）替代手写 `<option>`，内部遍历渲染；register 与受控 value/onChange 二选一。
- **layout.tsx Tailwind 约束**：所有动态样式用完整类名映射表（如 `gapMap = { 1: 'gap-1', 2: 'gap-2', ... }`），禁止 `gap-${n}` 拼接（Tailwind JIT 不扫描动态类名）。
- **DashboardPage 重写**：Stack / Grid / Card / Badge / Progress 替换所有原生 HTML 标签（`<div>` + className → 语义化组件）。
- **form-controls.tsx 精简**：仅保留 `Input / Textarea / Select` 底层样式组件（被三合一组件内联样式引用，不再作为组件导入）；`Label` / `FieldError` 移除（被 `field.tsx` 的 `FieldLabel` / `FieldError` 替代）。
- **FormInputField 移除**：旧版受控输入组件，auth 页面已迁移到 `FormField inputProps` 模式，无残留引用。

### 阶段 5/6 关键约定

- **API client 401 刷新**：`packages/web/src/lib/api.ts` 的 `request()` 遇 401 调 `refresh()`（POST `/api/auth/refresh`，带 credentials），刷新成功重试一次原请求；`refreshPromise` 共享去重并发 401；刷新失败 → `clearAuth()` + 抛 `ApiError(INVALID_REFRESH_TOKEN)`，守卫处理跳登录。`bootstrapAuth()` 在 App 挂载时调用以恢复会话。
- **access token 仅存内存**（authStore），刷新页面经 `/api/auth/refresh`（httpOnly cookie）恢复；不存 localStorage。
- **路由守卫**：`RequireAuth`（未登录跳 `/login` 带 `state.from`）、`RequireRole({role})`（角色不足跳 `/403`，admin 放行）。`/stats`、`/trash`、`/settings` 在 `RequireAuth` 下，`/admin/users` 在 `RequireRole role="admin"` 下。
- **feature 结构**：每个 feature = `api.ts`（调 `api.get/post/patch/delete`）+ `hooks.ts`（useQuery/useMutation，mutation 成功 `invalidateQueries` 相关 key + `['stats']`）+ 页面组件（RHF+zodResolver，`ApiError` 显示服务端错误）。
- **queryKeys 工厂**：`packages/web/src/lib/queryKeys.ts` 集中管理，列表分页用 `[...queryKeys.xxx, { page, pageSize }]` 派生 key。
- **比赛表单 zod 类型分叉**：`createMatchSchema.opponentIds` 带 `.default([])`，zod 输入类型（可选）与输出类型（必填）不一致，`useForm<CreateMatchInput>` + `zodResolver` 直接用会报 Resolver 类型不匹配；解法：`resolver: zodResolver(createMatchSchema) as unknown as Resolver<CreateMatchInput>`（见 `MatchForm.tsx`）。
- **Recharts**：`StatsPage` 用 PieChart/LineChart/BarChart，空数据时渲染 `<Empty/>` 占位；recharts 3.9。
- **资料保存同步 store**：`useUpdateProfile` 的 `onSuccess` 把返回 profile 合并进 authStore 当前用户（保留 role），避免 UI 显示旧资料。
- **前端无单测**：vitest 已配但 `packages/web/src` 下无测试文件且缺 devDep，已记为遗留（见第 2 节）。

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

## 7. Suggested skills

下一个 agent 在可选优化阶段可调用：

- `superpowers:test-driven-development` —— 补前端 hook/表单单测时用（需先装 vitest/jsdom/@testing-library devDep）
- `oh-my-claudecode:security-reviewer` —— 做一次安全复审（ACL/软删除泄漏/公开统计是否泄漏私有/前端 token 处理）
- `oh-my-claudecode:verifier` —— 全局回归测试的完成度核验
- `work-handoff` —— 再次收工时落盘交接
