# sport-record 实施计划

> 共 7 个阶段，按依赖顺序推进。每阶段含明确产出与验收标准。

---

## 阶段 0：项目初始化

**任务**

- 初始化 Git（main + dev 分支）、`.gitignore`
- 创建根 `package.json`、`pnpm-workspace.yaml`、`.nvmrc`（node 20）
- 创建 `packages/{web,server,shared}` 目录骨架
- 根级 ESLint + Prettier 配置
- Husky + lint-staged + commitlint

**验收**

- `pnpm install` 成功
- `pnpm lint` 可运行
- 提交时触发 lint-staged 与 commitlint 校验

---

## 阶段 1：shared 包

**任务**

- `packages/shared` 初始化（tsup 或 tsc 输出）
- 定义枚举常量：`Role`、`ExerciseCategory`、`ExerciseUnit`、`MatchType`、`EventType`、`RacketHand`、`MainEvent`、`MatchResult`
- 定义 zod schema：
  - 认证：`registerSchema`、`loginSchema`
  - 用户：`updateProfileSchema`、`changePasswordSchema`
  - 训练项：`createExerciseSchema`、`updateExerciseSchema`
  - 训练课：`createWorkoutSchema`、`updateWorkoutSchema`
  - Set：`createSetSchema`、`updateSetSchema`
  - 赛事：`createEventSchema`、`updateEventSchema`
  - 比赛：`createMatchSchema`、`updateMatchSchema`
  - 分页：`paginationSchema`
  - 响应：`apiResponseSchema`
- 从 schema 推导并导出 TS 类型

**验收**

- `pnpm --filter shared build` 产出 dist
- server 与 web 可 `import { ... } from '@sport-record/shared'`

---

## 阶段 2：后端基础设施

**任务**

- `packages/server` 初始化：Express + tsx（dev）+ tsc（build）
- Prisma 初始化：schema.prisma + SQLite，配置 `DB_PATH`
- 定义全部模型（User / Exercise / Workout / Set / Event / Match，含 `deletedAt`、索引）
- Prisma 软删除中间件（自动过滤 `deletedAt`，回收站 bypass）
- 全局错误处理中间件（AppError + 统一响应 `{code,message,data}`）
- zod 校验中间件（封装 `validate(schema, 'body'|'query'|'params')`）
- 统一响应工具：`success(res, data)`、`fail(res, code, message)`
- 分页工具：解析 `page/pageSize`，返回 `{list, total, page, pageSize}`
- express-rate-limit：登录/注册限流、通用限流
- dotenv + `.env.example`

**验收**

- 启动后 `GET /api/health` 返回 200
- 错误中间件可捕获 AppError 并返回统一结构
- zod 中间件校验失败返回 400 + 错误详情
- Prisma 软删除过滤生效

---

## 阶段 3：后端认证与权限

**任务**

- 认证服务：
  - 注册：用户名唯一检查、scrypt 哈希、强度校验
  - 登录：账号锁定逻辑（5 次失败锁 15 分钟）、签发 access + refresh
  - 刷新：refresh token 验证、签发新 access
  - 登出：清 refresh cookie
- JWT 工具：sign/verify access、sign/verify refresh
- auth 中间件：
  - `authenticate`：解析 access，挂 `req.user`
  - `optionalAuth`：游客也放行，有 token 则挂 `req.user`
  - `requireRole(...roles)`：角色校验
- ACL 工具：资源所有者校验（`isOwner(resource, userId)`）
- seed 脚本：内置动作库 + admin 提权（`ADMIN_USERNAME`）
- 单测/集成测试：注册、登录、锁定、刷新、权限拒绝

**验收**

- 注册 → 登录 → 刷新 → 登出 全流程通
- 登录失败 5 次后账号锁定
- 受保护接口无 token 返回 401，角色不足返回 403
- seed 脚本写入动作库，`ADMIN_USERNAME` 用户被提权

---

## 阶段 4：后端业务 CRUD API

按资源逐个实现，每个资源含：路由、service、zod 校验、所有者/权限校验、分页、软删除。

**任务**

- 训练项 Exercise：内置只读 + 用户自建 CRUD
- 训练课 Workout：CRUD + 公开/私有过滤（游客仅看公开）
- Set：嵌套于 Workout 创建，独立更新/删除
- 赛事 Event：CRUD，创建者管理
- 比赛 Match：CRUD，多局比分解析，对手/队友关联用户
- 回收站：列表（自己 / admin 全局）、恢复、彻底删除
- 统计：
  - 训练：总次数/时长、分类占比、趋势
  - 比赛：胜率、走势、对手机胜率、单双打分开
- 用户管理（admin）：列表、禁用、改角色
- 公开资料：`GET /api/users/:id/profile` + 公开统计

**验收**

- 每个资源 CRUD 接口可用
- 游客仅能查公开数据
- 所有者才能改/删自己资源；admin 可改/删任意
- 回收站恢复/彻底删除正确
- 统计接口数据正确
- supertest 覆盖核心接口

---

## 阶段 5：前端基础设施

**任务**

- `packages/web` 初始化：Vite + React 18 + TS
- Tailwind + shadcn/ui 接入
- 路由配置 + 守卫组件（RequireAuth、RequireRole）
- API client：fetch 封装，credentials、401 自动刷新、统一错误处理
- TanStack Query 配置 + query hooks 封装
- Zustand：auth store（当前用户、access token 内存）
- 主题切换（深/浅/跟随系统）
- 布局组件（Header 导航 + 侧栏 + 移动端适配）
- 开发 proxy 配置（`/api` → 3000）

**验收**

- `pnpm --filter web dev` 启动，proxy 转发 `/api` 正常
- 登录后 access token 存内存，刷新页面经 refresh 恢复会话
- 401 自动刷新一次后重试
- 主题切换与跟随系统生效
- 守卫拦截未登录跳登录页

---

## 阶段 6：前端业务页面

按 feature 实现，每个 feature 含列表、详情、录入表单。

**任务**

- auth：登录、注册页
- dashboard：概览卡片 + 快捷入口
- exercise：动作库列表（内置 + 自建）
- training：
  - 训练课列表（分页、公开/自己过滤）
  - 训练详情 + 逐组录入（RHF + zod，按单位动态字段）
- match：
  - 赛事列表 + 详情
  - 比赛列表 + 录入（单/双/混双/团体，多局比分，对手/队友选择）
- stats：训练统计 + 比赛统计（Recharts 图表）
- trash：回收站列表 + 恢复/彻底删除
- settings：资料编辑、默认公开开关、主题、改密、退出
- admin：用户管理列表

**验收**

- 各页面 CRUD 联调后端通过
- 表单校验前后端一致（共享 zod）
- 游客浏览公开数据，录入弹登录引导
- 响应式在移动端可用
- 统计图表渲染正确

---

## 阶段 7：收尾

**任务**

- README：项目说明、启动命令、环境变量、目录结构
- 全局回归测试
- 补充边界用例测试
- 整理 `.env.example`

**验收**

- README 完整可照此启动
- 核心流程端到端可用
- 测试通过

---

## 依赖关系

```
阶段0 → 阶段1 → 阶段2 → 阶段3 → 阶段4
                                   ↓
                                 阶段5 → 阶段6 → 阶段7
```

阶段 4 与阶段 5 可部分并行（后端 API 就绪一个，前端对应 feature 即可联调），但首启顺序仍按上表。

---

## 启动命令（规划）

```bash
pnpm install                          # 安装依赖
pnpm --filter server db:migrate       # 迁移
pnpm --filter server db:seed          # 预置动作库 + admin 提权
pnpm dev                              # 同时启动 web + server
pnpm lint                             # 检查
pnpm test                             # 全部测试
```
