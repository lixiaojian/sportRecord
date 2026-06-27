# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

羽毛球训练与比赛记录分析平台。Monorepo (pnpm workspace)：`packages/{web,server,shared}`。

- **后端**：Express 5 + Prisma 7 + SQLite、JWT (access 1h 内存 / refresh 30d httpOnly cookie)、scrypt 密码哈希、zod 校验、express-rate-limit
- **前端**：Vite 5 + React 19 + TypeScript、React Router v6、TanStack Query v5 + Zustand v5、shadcn/ui + Tailwind v3、Recharts、RHF + Zod
- **前端组件体系**：Field 体系（Field/FieldLabel/FieldError/FieldGroup）+ 三合一表单组件（FormField/FormTextarea/FormSelect，独立文件）+ layout 组件（Stack/Grid/Container）+ shadcn/ui（Button/Card/Badge/Progress）+ UserPicker
- **共享**：zod schema + 类型 + 枚举

## 快速开始

```bash
pnpm install
pnpm --filter server db:generate   # 首次运行
pnpm --filter server db:migrate    # 首次运行
pnpm --filter server db:seed       # 首次运行（灌数据+admin 提权）
pnpm dev                           # 并行启动前后端
```

- 后端：http://localhost:3300
- 前端：http://localhost:5173（代理 `/api` → 3300）

## 常用命令

| 命令                              | 说明                               |
| --------------------------------- | ---------------------------------- |
| `pnpm dev`                        | 并行启动前后端                     |
| `pnpm build`                      | 构建所有包（shared → server/web）  |
| `pnpm lint`                       | ESLint 全项目                      |
| `pnpm test`                       | 运行所有测试                       |
| `pnpm --filter server test`       | 后端测试（vitest，151 用例）       |
| `pnpm --filter web build`         | 前端构建                           |
| `pnpm -r exec tsc --noEmit`       | 全量类型检查                       |
| `pnpm --filter server db:migrate` | 数据库迁移                         |
| `pnpm --filter server db:seed`    | 灌种子数据                         |
| `pnpm --filter shared build`      | 构建 shared（必须先于 server/web） |

## 架构模式

### 后端路由与服务

每个资源遵循统一 CRUD 模式：

```
routes/<resource>.ts     # 路由：optionalAuth 分页读 / authenticate+validate 写改删
services/<resource>Service.ts  # 服务：list/create/getById/getMutable/update/remove
```

ACL = `isOwner` || admin；私有资源对无权者返回 404。

### 前端 Feature 结构

```
packages/web/src/features/<name>/
├── api.ts          # API 调用（api.get/post/patch/delete）
├── hooks.ts        # useQuery/useMutation + invalidateQueries
└── <Page>.tsx      # 页面组件（RHF+zodResolver + FormField/FormSelect/FormTextarea）
```

### 前端 UI 组件

```
packages/web/src/components/ui/
├── field.tsx           # Field 体系：Field/FieldLabel/FieldError/FieldDescription/FieldGroup 等
├── form-field.tsx      # FormField 三合一（Label+Input+Error），register/Controller/inputProps 三模式
├── form-textarea.tsx   # FormTextarea 三合一（Label+Textarea+Error）
├── form-select.tsx     # FormSelect 三合一（Label+Select+Error），options 数组
├── form-controls.tsx   # 底层 Input/Textarea/Select 样式组件（不导出 Label/FieldError）
├── layout.tsx          # Stack/Grid/Container（Tailwind 完整类名映射）
├── UserPicker.tsx      # 用户搜索选择器（single/multiple）
├── button.tsx / card.tsx / badge.tsx / progress.tsx  # shadcn/ui
```

### 认证流程

- access token 仅存内存（`authStore`），刷新页面经 `/api/auth/refresh`（httpOnly cookie）恢复
- API client 遇 401 自动刷新一次并重试；刷新失败跳登录
- 路由守卫：`RequireAuth`（未登录）、`RequireRole`（角色不足）

### 软删除

Prisma extension 自动过滤 `deletedAt: null`；回收站查询显式写 `where: { deletedAt: { not: null } }` bypass。

## 关键配置

- **环境变量**：`packages/server/.env` —— `DATABASE_URL`（必填）、`JWT_SECRET`（必填）、`PORT=3300`
- **端口**：后端 3300，前端 5173
- **Node** ≥ 20，**pnpm** ≥ 10（`.nvmrc` / `packageManager` 锁定）

## 文档索引

- [`docs/design.md`](docs/design.md) — 完整技术设计
- [`docs/plan.md`](docs/plan.md) — 7 阶段开发计划
- [`docs/handoff.md`](docs/handoff.md) — 交接记录与关键约定
