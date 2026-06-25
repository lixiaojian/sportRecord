# sport-record 设计文档

> 羽毛球训练与比赛记录分析平台

## 1. 项目定位

记录羽毛球日常训练与比赛数据，提供统计分析。支持多用户系统，游客可浏览公开数据，登录用户可录入与管理自己的数据。

不关注身体指标（体重/体脂等），聚焦训练与比赛本身。

---

## 2. 技术栈

### 2.1 工程结构

Monorepo（pnpm workspace）：

```
sportRecord/
├── packages/
│   ├── web/        # 前端 Vite + React + TS
│   ├── server/     # 后端 Express + Prisma + SQLite
│   └── shared/     # 共享 zod schema + 类型 + 枚举
├── docs/
├── .nvmrc
├── pnpm-workspace.yaml
└── package.json
```

- Node 20 LTS（`.nvmrc` 固定）
- pnpm 包管理
- 本地 Git（main + dev 分支），Conventional Commits

### 2.2 前端（packages/web）

- Vite + React 19 + TypeScript
- React Router v6（loader + 守卫组件做权限拦截）
- TanStack Query（服务端状态/缓存）+ Zustand（临时 UI 状态）
- shadcn/ui + Tailwind CSS
- Recharts（图表）
- React Hook Form + Zod（表单校验，复用 shared schema）
- date-fns（日期）

### 2.3 后端（packages/server）

- Express
- Prisma + SQLite（单文件 DB）
- JWT（access 1h 存内存，refresh 30d 存 httpOnly cookie）
- scrypt 密码哈希
- zod 校验中间件（复用 shared schema）
- 全局错误处理中间件
- express-rate-limit（接口分级限流）
- dotenv 环境变量

### 2.4 共享（packages/shared）

导出：

- zod schema（请求体/响应体校验，前后端共用）
- TS 类型（从 schema 推导）
- 枚举常量（角色、训练分类、比赛类型、赛事类型等）

### 2.5 工程化

- ESLint + Prettier
- Husky + lint-staged（提交前检查）
- commitlint（Conventional Commits）
- Vitest + React Testing Library（前端单测/组件测试）
- Vitest + supertest（后端 API 测试）

### 2.6 主题与端

- 深色/浅色可切换 + 跟随系统
- 响应式优先移动端
- 暂不做 PWA，暂不部署

---

## 3. 认证与权限

### 3.1 注册登录

- 用户名 + 密码注册
- 用户名全局唯一，昵称可重复
- 密码用 scrypt 哈希
- 密码强度校验：8 位 + 字母 + 数字
- 登录失败 5 次锁定 15 分钟

### 3.2 JWT

| token   | 有效期 | 存储位置        |
| ------- | ------ | --------------- |
| access  | 1 小时 | 内存（Zustand） |
| refresh | 30 天  | httpOnly cookie |

### 3.3 角色与权限

RBAC + ACL 模型，三级角色：

| 角色  | 能力                                                        |
| ----- | ----------------------------------------------------------- |
| 游客  | 只读浏览公开数据，不可录入、不可交互                        |
| user  | 管理自己数据（增删改查），浏览公开数据                      |
| admin | 用户管理（查看/禁用/改角色）+ 全局业务数据管理 + 全局回收站 |

### 3.4 公开机制

- 用户级默认公开开关（默认公开）
- 单条记录可覆盖默认设为私有
- 游客仅可浏览公开数据

### 3.5 admin 初始化

- `.env` 配置 `ADMIN_USERNAME`
- 该用户名注册后，seed 脚本检测并提权为 admin
- 密码不硬编码

### 3.6 游客体验

- 游客可预览体验（查看公开数据）
- 录入/统计等需登录功能，点击时弹出登录引导
- 路由守卫拦截需登录页面，跳登录并记录 redirect

---

## 4. 数据模型

### 4.1 实体

#### User（用户）

| 字段           | 类型     | 说明                      |
| -------------- | -------- | ------------------------- |
| id             | UUID     | 主键                      |
| username       | string   | 唯一                      |
| passwordHash   | string   | scrypt 哈希               |
| nickname       | string   | 展示名                    |
| avatar         | string   | 头像 URL                  |
| bio            | string   | 个人简介                  |
| defaultPublic  | boolean  | 默认公开开关，默认 true   |
| racketHand     | enum     | 持拍手：left/right        |
| mainEvent      | enum     | 主项：single/double/mixed |
| role           | enum     | user/admin                |
| failedAttempts | int      | 登录失败次数              |
| lockedUntil    | datetime | 锁定截止时间              |
| deletedAt      | datetime | 软删除                    |

#### Exercise（训练项/动作库）

| 字段      | 类型     | 说明                     |
| --------- | -------- | ------------------------ |
| id        | UUID     | 主键                     |
| name      | string   | 如"正手高远球"           |
| category  | enum     | 技术/步法/体能/多球/对抗 |
| unit      | enum     | 组数/时长/次数           |
| note      | string   | 说明                     |
| isBuiltIn | boolean  | 是否内置                 |
| deletedAt | datetime | 软删除                   |

#### Workout（训练课）

| 字段      | 类型     | 说明         |
| --------- | -------- | ------------ |
| id        | UUID     | 主键         |
| userId    | UUID     | 所属用户     |
| date      | date     | 训练日期     |
| title     | string   | 标题         |
| feeling   | string   | 主观状态     |
| duration  | int      | 时长（分钟） |
| note      | string   | 备注         |
| isPublic  | boolean  | 是否公开     |
| deletedAt | datetime | 软删除       |

#### Set（训练记录/组）

| 字段       | 类型   | 说明         |
| ---------- | ------ | ------------ |
| id         | UUID   | 主键         |
| workoutId  | UUID   | 所属训练课   |
| exerciseId | UUID   | 训练项       |
| sets       | int    | 组数         |
| reps       | int    | 次数         |
| duration   | int    | 时长（分钟） |
| distance   | int    | 距离         |
| weight     | number | 重量         |
| note       | string | 备注         |

多单位动态字段：按训练项的 unit 决定填哪个字段。

#### Event（赛事）

| 字段      | 类型     | 说明             |
| --------- | -------- | ---------------- |
| id        | UUID     | 主键             |
| name      | string   | 赛事名           |
| type      | enum     | 俱乐部/区域/官方 |
| startDate | date     | 开始日期         |
| endDate   | date     | 结束日期         |
| location  | string   | 地点             |
| note      | string   | 说明             |
| creatorId | UUID     | 创建者（用户）   |
| isPublic  | boolean  | 是否公开         |
| deletedAt | datetime | 软删除           |

#### Match（比赛）

| 字段        | 类型     | 说明                         |
| ----------- | -------- | ---------------------------- |
| id          | UUID     | 主键                         |
| eventId     | UUID     | 所属赛事                     |
| userId      | UUID     | 记录者                       |
| type        | enum     | 单打/双打/混双/团体          |
| date        | date     | 比赛日期                     |
| partnerId   | UUID     | 队友（双打/混双）            |
| opponentIds | UUID[]   | 对手                         |
| scores      | json     | 多局比分 `[[21,15],[19,21]]` |
| result      | enum     | 胜/负                        |
| note        | string   | 备注                         |
| isPublic    | boolean  | 是否公开                     |
| deletedAt   | datetime | 软删除                       |

### 4.2 关系

- ID 软关联（无外键级联约束，应用层维护）
- Workout 1—N Set
- Event 1—N Match
- Exercise 1—N Set
- User 1—N Workout / Match / Event（创建者）
- Match N—N User（partnerId / opponentIds，关联注册用户）

### 4.3 软删除

- 全部实体含 `deletedAt` 字段
- Prisma 中间件自动过滤 `deletedAt != null` 的记录
- 回收站查询手动 bypass 过滤
- 回收站：用户看自己删除记录，admin 看全局；可恢复或彻底删除

---

## 5. API 设计

### 5.1 规范

- RESTful
- 统一响应结构：

```json
{ "code": 0, "message": "ok", "data": {} }
```

错误响应：

```json
{ "code": "ERROR_CODE", "message": "错误描述", "data": null }
```

- 全部列表接口分页：`?page=1&pageSize=20`，响应含 `total`

### 5.2 路由（主要）

```
# 认证
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me

# 用户
GET    /api/users                # admin
PATCH  /api/users/:id            # admin（禁用/改角色）
GET    /api/users/:id/profile    # 公开资料
PATCH  /api/users/me             # 改自己资料
PATCH  /api/users/me/password

# 训练项
GET    /api/exercises            # 列表（含内置）
POST   /api/exercises            # user
PATCH  /api/exercises/:id        # 创建者
DELETE /api/exercises/:id        # 创建者（软删）

# 训练课
GET    /api/workouts             # 自己 + 公开
POST   /api/workouts
GET    /api/workouts/:id
PATCH  /api/workouts/:id         # 所有者
DELETE /api/workouts/:id         # 所有者（软删）

# 训练记录（Set）
POST   /api/workouts/:id/sets
PATCH  /api/sets/:id
DELETE /api/sets/:id

# 赛事
GET    /api/events
POST   /api/events               # user
GET    /api/events/:id
PATCH  /api/events/:id           # 创建者
DELETE /api/events/:id           # 创建者（软删）

# 比赛
GET    /api/matches              # 自己 + 公开
POST   /api/matches
GET    /api/matches/:id
PATCH  /api/matches/:id          # 所有者
DELETE /api/matches/:id          # 所有者（软删）

# 统计
GET    /api/stats/training
GET    /api/stats/match
GET    /api/stats/public/:userId

# 回收站
GET    /api/trash                # 自己（admin 看全局）
POST   /api/trash/:type/:id/restore
DELETE /api/trash/:type/:id      # 彻底删除
```

### 5.3 同源

- 开发：Vite 5173 + Express 3300，Vite proxy 转发 `/api` 到后端，避免 CORS
- 生产：Express 托管前端静态资源

### 5.4 环境变量

`.env`（gitignore）+ `.env.example`（提交）：

```
PORT=3300
DB_PATH=./db.sqlite
JWT_SECRET=
ADMIN_USERNAME=
```

### 5.5 安全

- 接口分级限流：登录/注册 10 次/15 分钟，通用 API 100 次/分钟
- 全局错误中间件统一错误响应
- 不记录日志

---

## 6. 前端架构

### 6.1 目录结构（feature-based）

```
packages/web/src/
├── features/
│   ├── auth/          # 登录/注册
│   ├── dashboard/
│   ├── training/      # 训练课 + Set 录入
│   ├── match/         # 比赛 + 赛事
│   ├── exercise/      # 动作库
│   ├── stats/         # 统计
│   ├── trash/         # 回收站
│   ├── settings/      # 设置
│   └── admin/         # 用户管理
├── components/        # 公共组件
├── lib/               # api client、query hooks、utils
├── routes/            # 路由配置 + 守卫
├── stores/            # Zustand
└── main.tsx
```

### 6.2 数据层

- TanStack Query 管服务端状态：缓存、失效、stale-while-revalidate
- Zustand 管临时 UI 状态 + 当前用户（access token 存内存）
- API client：fetch 封装，自动带 credentials、处理 401 刷新

### 6.3 路由守卫

- React Router loader + 守卫组件
- 未登录访问需登录页 → 跳登录 + 记 redirect
- 权限不足 → 跳 403

### 6.4 页面（MVP 全做）

| 页面          | 路径          | 权限          |
| ------------- | ------------- | ------------- |
| Dashboard     | /             | 公开（概览）  |
| 登录          | /login        | 公开          |
| 注册          | /register     | 公开          |
| 训练记录列表  | /workouts     | 公开浏览/登录 |
| 训练详情/录入 | /workouts/:id | 登录          |
| 比赛记录列表  | /matches      | 公开浏览/登录 |
| 比赛详情/录入 | /matches/:id  | 登录          |
| 赛事列表      | /events       | 公开浏览/登录 |
| 动作库        | /exercises    | 公开浏览/登录 |
| 统计          | /stats        | 登录          |
| 用户主页      | /users/:id    | 公开          |
| 回收站        | /trash        | 登录          |
| 设置          | /settings     | 登录          |
| 用户管理      | /admin/users  | admin         |

### 6.5 训练录入

逐组录入：选训练项 → 填重量/次数/时长/距离（按单位）→ 保存下一组。

### 6.6 主题

shadcn/ui 原生支持深浅切换 + 跟随系统，存 localStorage。

---

## 7. 统计指标

### 训练

- 总训练次数 / 总时长
- 各分类（技术/步法/体能/多球/对抗）占比
- 训练趋势（按周/月）

### 比赛

- 总胜率
- 多场次战绩走势
- 对不同对手胜率
- 单打 / 双打 / 混双分开统计

---

## 8. 预置数据

- 内置羽毛球动作库（高远球/杀球/吊球/网前球/步法/体能等，按分类预填）
- admin seed：通过 `ADMIN_USERNAME` 提权已注册用户
