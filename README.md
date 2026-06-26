# sport-record

> 羽毛球训练与比赛记录分析平台

记录羽毛球日常训练与比赛数据，提供统计分析。支持多用户：游客可浏览公开数据，登录用户可录入与管理自己的数据。聚焦训练与比赛本身，不关注身体指标。

详细设计与阶段计划见 [`docs/design.md`](docs/design.md) 与 [`docs/plan.md`](docs/plan.md)。

## 技术栈

- **Monorepo**：pnpm workspace（`packages/{web,server,shared}`），Node 20（`.nvmrc`）
- **后端 server**：Express 5 + Prisma 7 + SQLite（better-sqlite3）、JWT（access 1h 内存 / refresh 30d httpOnly cookie）、scrypt 密码哈希、zod 校验中间件、全局错误中间件、express-rate-limit 分级限流
- **前端 web**：Vite 5 + React 19 + TypeScript、React Router v6（`createBrowserRouter` + 守卫）、TanStack Query v5 + Zustand v5、shadcn/ui + Tailwind v3、Recharts、React Hook Form + Zod
- **共享 shared**：zod schema + 类型 + 枚举，前后端复用
- **工程化**：ESLint(flat) + Prettier + Husky + lint-staged + commitlint（Conventional Commits）

角色三级：游客 / user / admin（RBAC + ACL）；用户级默认公开，单条可设私有；全实体软删除 + 回收站（可恢复或彻底删除）。

## 目录结构

```
sportRecord/
├── packages/
│   ├── web/        # 前端 Vite + React + TS
│   │   └── src/{features,lib,routes,stores,components}
│   ├── server/     # 后端 Express + Prisma + SQLite
│   │   └── src/{routes,services,lib,test} + prisma/
│   └── shared/     # 共享 zod schema + 类型
├── docs/           # design.md / plan.md / handoff.md
├── pnpm-workspace.yaml
└── package.json
```

后端 feature 按 `routes/<resource>.ts` + `services/<resource>Service.ts` + `routes/<resource>.test.ts` 组织；前端 feature 在 `packages/web/src/features/<name>/` 下，含 `api.ts` + `hooks.ts` + 页面组件。

## 快速开始

### 环境要求

- Node ≥ 20（`.nvmrc` 锁 20）
- pnpm ≥ 10（`packageManager` 锁 `pnpm@10.33.2`）

### 安装

```bash
pnpm install
```

### 配置环境变量

复制并填写后端配置：

```bash
cp packages/server/.env.example packages/server/.env
```

至少配置 `JWT_SECRET`（必填，缺失启动失败；生产用强随机串）。`ADMIN_USERNAME` 命中已注册用户时，seed 会将其提权为 admin。

### 初始化数据库

```bash
pnpm --filter server db:generate      # 生成 Prisma client
pnpm --filter server db:migrate       # 建表（读 DATABASE_URL）
pnpm --filter server db:seed          # 内置动作库 + ADMIN_USERNAME 提权（幂等）
```

### 启动

```bash
pnpm dev                  # 同时启动前后端
# 或分别启动：
pnpm --filter server dev  # 后端 http://localhost:3300
pnpm --filter web dev     # 前端 http://localhost:5173（proxy /api → 3300）
```

> 本机 3000 端口被占用，后端固定用 **3300**；前端 Vite 5173 代理 `/api` → 3300。

## 环境变量

后端 `packages/server/.env`（见 `.env.example`）：

| 变量             | 说明                                       | 默认               |
| ---------------- | ------------------------------------------ | ------------------ |
| `PORT`           | 后端端口                                   | `3300`             |
| `DATABASE_URL`   | SQLite 路径，形如 `file:./db.sqlite`       | `file:./db.sqlite` |
| `JWT_SECRET`     | JWT 签名密钥，**必填**，生产用强随机串     | —                  |
| `ADMIN_USERNAME` | 该用户注册后由 seed 提权为 admin           | —                  |
| `NODE_ENV`       | `production` 时 refresh cookie 走 `secure` | `development`      |

## 常用命令

| 命令                              | 说明                                       |
| --------------------------------- | ------------------------------------------ |
| `pnpm dev`                        | 并行启动前后端（dev）                      |
| `pnpm build`                      | 构建所有包（shared → server/web）          |
| `pnpm lint`                       | 所有包 ESLint                              |
| `pnpm test`                       | 所有包测试（后端 vitest，前端 vitest）     |
| `pnpm --filter server test`       | 后端测试（148 用例，每 worker 独立临时库） |
| `pnpm --filter web build`         | 前端 `tsc --noEmit && vite build`          |
| `pnpm -r exec tsc --noEmit`       | 全量类型检查                               |
| `pnpm --filter server db:migrate` | 数据库迁移                                 |
| `pnpm --filter server db:seed`    | 灌入内置动作库 + admin 提权                |
| `pnpm --filter shared build`      | 构建 shared（server/web 依赖）             |

## 核心约定

- **认证**：access token 仅存内存（authStore），刷新页面经 `/api/auth/refresh`（httpOnly cookie）恢复；不落 localStorage。
- **统一 CRUD 模式**：service 暴露 `list/create/getById/getMutable/update/remove`；route 用 `optionalAuth` 分页读、`authenticate`+`validate` 写改删；ACL = `isOwner` || admin；私有资源对无权者返回 404。
- **软删除**：全实体 `deletedAt`，Prisma extension 自动过滤 `deletedAt: null`；回收站用 `basePrisma` 或显式 `deletedAt:{not:null}` bypass；Set 无软删除。
- **公开统计**：自己统计含私有，公开统计仅 `publicOnly`。
- **前端 API client**：401 自动调 `/api/auth/refresh` 刷新并重试一次，`refreshPromise` 共享去重并发 401；刷新失败清空登录态。

更多约定（错误码语义、Prisma 7 配置、JWT 不轮换等）见 [`docs/handoff.md`](docs/handoff.md) 的备注节与 [`docs/design.md`](docs/design.md)。

## 文档

- [`docs/design.md`](docs/design.md) — 完整设计：技术栈、数据模型、API、权限模型
- [`docs/plan.md`](docs/plan.md) — 7 阶段开发计划与验收标准
- [`docs/handoff.md`](docs/handoff.md) — 阶段交接记录与关键约定备注
