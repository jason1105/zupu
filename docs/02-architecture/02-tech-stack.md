# 技术栈说明

**版本**：1.0.0  
**更新日期**：2026-04-26  

---

## 1. 核心依赖

| 类别 | 库/框架 | 版本 | 用途 |
|------|---------|------|------|
| 框架 | Next.js | 16.2.4 | 全栈框架，App Router，SSR + API Routes |
| 语言 | TypeScript | ^5 | 类型安全 |
| 样式 | Tailwind CSS | ^4 | 原子化 CSS |
| 认证 | NextAuth.js | 5.0.0-beta.31 | JWT Session，Credentials Provider |
| ORM | Prisma | ^5.22.0 | 数据库操作，Schema 管理，迁移 |
| DB Adapter | @prisma/adapter-libsql | ^5.22.0 | 连接 libsql（本地文件 + 远程 Turso） |
| DB Client | @libsql/client | ^0.8.1 | libsql 协议实现 |
| 可视化 | D3.js | ^7.9.0 | 族谱树状图 SVG |
| 表单 | react-hook-form | ^7.72.1 | 轻量级表单管理 |
| 加密 | bcryptjs | ^3.0.3 | 密码 bcrypt 哈希 |

---

## 2. 开发依赖

| 库 | 版本 | 用途 |
|----|------|------|
| Vitest | ^4.1.4 | 单元测试 + 集成测试框架 |
| @testing-library/react | ^16.3.2 | React 组件测试工具 |
| @vitejs/plugin-react | ^6.0.1 | Vitest 中支持 React JSX |
| jsdom | ^29.0.2 | 测试环境模拟浏览器 DOM |
| tsx | ^4.21.0 | 执行 TypeScript 脚本（如 seed.ts） |
| eslint-config-next | 16.2.4 | Next.js 推荐 ESLint 规则 |

---

## 3. 版本选择理由

### Next.js 16.x（App Router）
App Router 将 Server Components 和 Client Components 混合使用：
- **Server Components**（无 `'use client'`）：在服务器渲染，可直接调用 Prisma，不打包进客户端 JS
- **Client Components**（有 `'use client'`）：在浏览器执行，处理用户交互、状态、Effect

Dashboard 页面使用 Server Component 直接查询数据库（零 API 请求）；家族详情页因需要复杂交互（Modal、D3 动态渲染）使用 Client Component。

### Prisma 5.x + libsql adapter
Prisma 7.x 引入了新的 `prisma.config.ts` 配置格式，与当前 `schema.prisma` 方式不兼容，且 adapter 生态尚不成熟。固定在 5.22.0 确保稳定性。

### NextAuth.js v5 Beta
v5 是对 v4 的重大重构，支持 Next.js App Router，`auth()` 函数可在 Server Components 中直接调用。虽是 beta 版，但已在生产环境广泛使用。

### Tailwind CSS v4
v4 移除了 `tailwind.config.js`，改用 CSS-first 配置（在 `globals.css` 中通过 `@import "tailwindcss"` 引入），并使用 `@tailwindcss/postcss` 替代 `autoprefixer`。

---

## 4. 项目约定

### 4.1 文件组织

```
src/
├── app/          # 页面路由和 API Routes（Next.js 约定）
├── components/   # 可复用 React 组件（按功能分目录）
├── lib/          # 工具库（auth、prisma、tree-utils）
└── types/        # 全局 TypeScript 类型定义
```

### 4.2 命名规范

| 类型 | 约定 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `MemberCard.tsx` |
| 工具函数 | camelCase | `buildTree.ts` |
| API Route | 固定为 `route.ts` | `src/app/api/families/route.ts` |
| 类型定义 | PascalCase interface | `FamilyMember`, `TreeNode` |

### 4.3 API 设计约定

- 成功响应：`{ data: T }` 或 `{ data: T[] }`
- 错误响应：`{ error: string }`
- HTTP 状态码：200（成功）、201（创建）、400（参数错误）、401（未认证）、403（无权限）、404（不存在）、409（冲突）、500（服务器错误）
- 鉴权：通过 `requireAuth()` / `requireFamilyAdmin()` / `requireFamilyCreator()` 函数（`src/lib/api-helpers.ts`）
