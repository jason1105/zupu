# 系统架构设计

**版本**：1.1.0  
**更新日期**：2026-04-26  

---

## 1. 整体架构

```
┌──────────────────────────────────────────────────────────┐
│                        浏览器                             │
│   React 组件（Next.js App Router + Client Components）    │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼───────────────────────────────────┐
│                   Vercel（Singapore sin1）                 │
│  ┌────────────────────┐   ┌────────────────────────────┐ │
│  │   API Routes       │   │   Server Components (SSR)  │ │
│  │   /api/**          │   │   dashboard、auth 页面      │ │
│  └─────────┬──────────┘   └────────────────────────────┘ │
│            │                                              │
│  ┌─────────▼──────────────────────────────────────────┐  │
│  │         NextAuth.js v5（JWT Session 管理）          │  │
│  └─────────┬──────────────────────────────────────────┘  │
│            │                                              │
│  ┌─────────▼──────────────────────────────────────────┐  │
│  │         Prisma 5 ORM + libsql adapter              │  │
│  └─────────┬──────────────────────────────────────────┘  │
└────────────┼─────────────────────────────────────────────┘
             │ libsql 协议（TLS）
┌────────────▼─────────────────────────────────────────────┐
│              Turso（云端 libsql 数据库）                   │
└──────────────────────────────────────────────────────────┘
```

---

## 2. 分层说明

| 层次 | 技术 | 职责 |
|------|------|------|
| 展示层 | React 19 + Tailwind CSS v4 | UI 渲染，用户交互 |
| 路由层 | Next.js 15 App Router | 页面路由，SSR/CSR 边界划分 |
| API 层 | Next.js Route Handlers | RESTful API，鉴权校验，业务逻辑 |
| 认证层 | NextAuth.js v5 | JWT 会话管理，Credentials Provider |
| ORM 层 | Prisma 5.22 + libsql adapter | 数据库操作，类型安全查询 |
| 数据层 | Turso (libsql) | 生产数据库；本地开发用 SQLite 文件 |
| 可视化 | D3.js v7 | 族谱树状图 SVG 渲染 |

---

## 3. 部署架构

### 3.1 生产环境

- **托管平台**：Vercel（Serverless Functions，区域：`sin1` 新加坡）
- **数据库**：Turso 云端 libsql（`libsql://xxx.turso.io`）
- **CI/CD**：GitHub Actions → Vercel 自动部署（push 到 `main` 触发）
- **构建命令**：`next build`（`postinstall` 自动执行 `prisma generate`）
- **数据库迁移**：手动执行 `turso db shell zupu < migration.sql`

### 3.2 本地开发

- **数据库**：SQLite 文件（`prisma/dev.db`，通过 libsql file 协议访问）
- **迁移**：`npx prisma migrate dev`
- **启动**：`npm run dev`（端口 3000）

### 3.3 环境变量

| 变量 | 开发 | 生产 |
|------|------|------|
| `DATABASE_URL` | `file:prisma/dev.db` | `libsql://xxx.turso.io` |
| `TURSO_AUTH_TOKEN` | 空（本地无需） | Turso token |
| `AUTH_SECRET` | 任意字符串（≥32位） | 强随机字符串 |

---

## 4. 关键设计决策

### 4.1 为何选择 libsql 而非标准 SQLite

Prisma 的标准 SQLite adapter（`better-sqlite3`）是 Node.js 原生二进制，在 Vercel Serverless 环境下需要与 glibc 匹配，部署时容易出现兼容问题。`@prisma/adapter-libsql` + `@libsql/client` 是纯 JS 实现，同时支持本地文件（`file:`）和远程 Turso（`libsql://`），两套环境共用同一套代码。

### 4.2 为何不使用前后端分离

当前规模（单人/小团队维护的族谱应用）下，Next.js 前后端一体能显著减少维护成本：
- 无需维护两个仓库/两套部署流程
- Server Components 直接访问 Prisma，省去一层 HTTP 调用
- API Routes 和页面共享类型定义（`src/types/index.ts`）

### 4.3 认证策略

使用 JWT Session（`session: { strategy: 'jwt' }`）而非数据库 Session：
- 无需 Session 表，减少数据库压力
- Vercel Serverless 无共享内存，JWT 不依赖服务器状态
- 代价：无法即时撤销 token（可接受，用户量小）

### 4.4 数据库迁移策略

`prisma migrate deploy` 使用原生 SQLite 驱动，无法连接远程 Turso libsql URL，因此**不能**将其加入 Vercel 构建脚本。当前策略：每次新增迁移后手动执行：
```bash
turso db shell <db-name> < prisma/migrations/<name>/migration.sql
```

---

## 5. 安全设计

| 威胁 | 防护措施 |
|------|---------|
| SQL 注入 | Prisma 参数化查询，无原始 SQL 拼接 |
| 密码泄露 | bcrypt（saltRounds=10）哈希存储 |
| 未授权 API 访问 | `requireAuth()` 检查 JWT session |
| 越权操作 | `requireFamilyAdmin()` 验证管理员身份 |
| 账号枚举 | 登录失败统一返回"邮箱或密码错误" |
| XSS | React 默认转义，无 dangerouslySetInnerHTML |
| CSRF | NextAuth.js 内置 CSRF 保护 |
