# 实现备注文档

**版本**：1.0.0  
**日期**：2026-04-18  

---

## 1. 技术决策记录

### 1.1 Prisma 版本回退（7.x → 5.x）

**问题**：最新安装的 Prisma 7.7.0 要求将数据库连接 URL 从 `schema.prisma` 中移除，改为通过 `prisma.config.ts` 配置，但该配置文件的解析器在当前环境下持续报 `Failed to parse syntax` 错误，无法运行迁移。

**决策**：降级至 Prisma 5.22.0（最新稳定版），该版本：
- 在 `schema.prisma` 中通过 `url = env("DATABASE_URL")` 直接支持 SQLite
- 完整支持 SQLite 内嵌数据库
- 无需额外适配器配置

**影响**：无功能损失，所有设计功能均正常实现。

### 1.2 NextAuth.js v5 (Beta)

使用 `next-auth@5.0.0-beta`（与 Next.js App Router 深度集成版本），主要特性：
- `auth()` 函数可直接在 Server Components 和 API Routes 中调用
- `handlers` 统一导出处理 `[...nextauth]` 路由
- JWT session 策略，token 中存储 `user.id`

**Session 扩展**：在 `src/types/next-auth.d.ts` 中扩展了 `Session.user.id` 字段（NextAuth 默认不包含 id）。

### 1.3 D3.js 树状图布局策略

**方案**：使用 `d3.tree()` 计算层次布局，每个家族分支使用独立的 D3 hierarchy，然后水平偏移排列多个根节点。

**配偶处理**：配偶节点不进入 D3 hierarchy（否则会破坏代际层级），而是在布局完成后水平添加到主节点旁，用虚线连接。这符合族谱的视觉惯例。

**客户端渲染**：FamilyTree 组件使用 `dynamic(() => import(...), { ssr: false })` 加载，避免 D3 操作 DOM 时在 SSR 环境下报错。

### 1.4 API 响应格式统一

所有 API 路由使用统一的响应格式：
- 成功：`{ "data": ... }`
- 错误：`{ "error": "..." }`

错误处理通过 `ApiError` 类和 `handleError()` 函数集中管理，避免在每个路由中重复 try/catch 逻辑。

---

## 2. 关键实现细节

### 2.1 Prisma 客户端单例

`src/lib/prisma.ts` 使用 `globalThis` 存储 Prisma 实例，防止 Next.js 热更新时创建多个数据库连接：

```typescript
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient(...)
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 2.2 循环关系防护

`tree-utils.ts` 中的 `buildTree` 使用 `visited: Set<string>` 防止因数据中存在循环关系（如 A 是 B 的父亲，B 也是 A 的父亲）导致的无限递归。遇到已访问节点直接返回 `null`。

### 2.3 导入事务保证

JSON 导入使用 `prisma.$transaction()` 保证原子性：若任何成员或关系创建失败，整个导入操作回滚，不留下部分数据。

### 2.4 CSV 中文编码

导出 CSV 文件时在内容前添加 UTF-8 BOM（`\uFEFF`），确保 Excel 等工具直接打开中文不乱码。

### 2.5 权限层级

```
未登录 → 无法访问任何受保护资源
已登录 → 可查看所有家族（自己是管理员的）
家族管理员 → 可增删改成员和关系
家族创建者 → 额外权限：管理管理员列表
```

`requireFamilyCreator` 检查 `family.createdById === userId`，而非仅检查是否为管理员。

### 2.6 关系重复防护

Prisma schema 在 `Relationship` 表上定义了 `@@unique([fromMemberId, toMemberId, type])`，数据库层面防止重复。API 层捕获 `P2002`（唯一约束冲突）并返回 409 状态码。

---

## 3. 文件结构说明

### API Routes 命名规范

| 路径模式 | 说明 |
|---------|------|
| `/api/families` | 集合：GET 列表，POST 创建 |
| `/api/families/[familyId]` | 单个：GET 详情，PUT 更新，DELETE 删除 |
| `/api/families/[familyId]/members` | 成员集合（属于某家族） |
| `/api/members/[memberId]` | 单个成员操作（GET/PUT/DELETE） |
| `/api/families/[familyId]/relationships` | 关系集合 |
| `/api/relationships/[relationshipId]` | 单个关系操作（DELETE） |

### 组件分层

- **页面组件**（`app/` 下）：负责数据获取和页面布局，尽量使用 Server Components
- **业务组件**（`components/`）：单一职责，接收 props，通过回调向上通信
- **UI 组件**（`components/ui/`）：纯展示，无业务逻辑

---

## 4. 已知限制与未来优化

| 限制 | 说明 | 优化方向 |
|------|------|----------|
| 照片仅支持 URL | 未实现文件上传 | 接入对象存储（S3/OSS） |
| 无搜索功能 | PRD 中已标注不需要 | 可扩展为全文搜索 |
| 树状图大型族谱性能 | 500+ 成员时 SVG 渲染可能变慢 | 虚拟化渲染、节点折叠 |
| 无邮件验证 | 注册直接生效 | 添加邮箱验证流程 |
| 无角色权限细化 | 仅有管理员/非管理员 | 可扩展为只读/编辑/管理三级 |

---

## 5. 本地开发环境搭建

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（复制 .env.example 并填写）
cp .env.example .env

# 3. 数据库迁移
npx prisma migrate dev

# 4. 填充测试数据（可选）
npm run db:seed

# 5. 启动开发服务器
npm run dev
```

访问 http://localhost:3000，使用种子数据账号：
- `alice@example.com` / `password123`
