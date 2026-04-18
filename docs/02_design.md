# 详细设计文档

**项目名称**：族谱（Zupu）  
**版本**：1.0.0  
**日期**：2026-04-18  

---

## 1. 系统架构

```
┌─────────────────────────────────────────────────────┐
│                     浏览器                           │
│  React 组件 (Next.js App Router, Client Components)  │
└─────────────────┬───────────────────────────────────┘
                  │ HTTP (fetch)
┌─────────────────▼───────────────────────────────────┐
│             Next.js 服务端                           │
│  ┌─────────────────┐   ┌──────────────────────────┐ │
│  │  API Routes     │   │  Server Components       │ │
│  │  /api/**        │   │  (SSR 页面渲染)           │ │
│  └────────┬────────┘   └──────────────────────────┘ │
│           │                                         │
│  ┌────────▼────────────────────────────────────┐   │
│  │           NextAuth.js（Session 管理）        │   │
│  └────────┬────────────────────────────────────┘   │
│           │                                         │
│  ┌────────▼────────────────────────────────────┐   │
│  │           Prisma ORM                        │   │
│  └────────┬────────────────────────────────────┘   │
└───────────┼─────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────┐
│           SQLite 数据库文件 (prisma/dev.db)           │
└─────────────────────────────────────────────────────┘
```

---

## 2. 数据库设计

### 2.1 ER 图

```
User ─────< FamilyAdmin >───── Family
 │                               │
 │                             has many
 │                               │
 │                          FamilyMember
 │                          /         \
 │                    fromMember    toMember
 │                          \         /
 └────────────────────── Relationship
```

### 2.2 Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  adminOf   FamilyAdmin[]
}

model Family {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  admins   FamilyAdmin[]
  members  FamilyMember[]
}

model FamilyAdmin {
  id        String   @id @default(cuid())
  userId    String
  familyId  String
  createdAt DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  family Family @relation(fields: [familyId], references: [id], onDelete: Cascade)

  @@unique([userId, familyId])
}

model FamilyMember {
  id         String    @id @default(cuid())
  familyId   String
  name       String
  gender     String    // MALE | FEMALE | OTHER
  birthDate  DateTime?
  deathDate  DateTime?
  isAlive    Boolean   @default(true)
  occupation String?
  hometown   String?
  photoUrl   String?
  bio        String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  family         Family         @relation(fields: [familyId], references: [id], onDelete: Cascade)
  fromRelations  Relationship[] @relation("FromMember")
  toRelations    Relationship[] @relation("ToMember")
}

model Relationship {
  id           String   @id @default(cuid())
  familyId     String
  fromMemberId String
  toMemberId   String
  type         String   // PARENT_CHILD | SPOUSE
  createdAt    DateTime @default(now())

  fromMember FamilyMember @relation("FromMember", fields: [fromMemberId], references: [id], onDelete: Cascade)
  toMember   FamilyMember @relation("ToMember", fields: [toMemberId], references: [id], onDelete: Cascade)

  @@unique([fromMemberId, toMemberId, type])
}
```

### 2.3 字段说明

**User**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| email | String (unique) | 登录邮箱 |
| password | String | bcrypt 哈希密码 |
| name | String | 显示名称 |

**Family**
| 字段 | 类型 | 说明 |
|------|------|------|
| createdById | String | 创建者 userId（不是外键约束，避免删除用户问题） |

**FamilyMember**
| 字段 | 类型 | 说明 |
|------|------|------|
| gender | String | MALE / FEMALE / OTHER |
| isAlive | Boolean | true=在世，false=已故 |
| deathDate | DateTime? | 已故成员的忌日 |

**Relationship**
| 字段 | 类型 | 说明 |
|------|------|------|
| type | String | PARENT_CHILD：fromMember 是 toMember 的父/母；SPOUSE：互为配偶 |
| @@unique | [fromMemberId, toMemberId, type] | 防止重复关系 |

---

## 3. API 设计

### 3.1 认证 API

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/auth/register | 注册 | 公开 |
| POST | /api/auth/signin | 登录（NextAuth） | 公开 |
| POST | /api/auth/signout | 登出（NextAuth） | 登录 |
| GET | /api/auth/session | 获取当前 session | 公开 |

### 3.2 家族 API

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/families | 获取当前用户相关的家族列表 | 登录 |
| POST | /api/families | 创建家族 | 登录 |
| GET | /api/families/[id] | 获取家族详情（含成员和关系） | 登录 |
| PUT | /api/families/[id] | 修改家族信息 | 管理员 |
| DELETE | /api/families/[id] | 删除家族 | 管理员 |
| GET | /api/families/[id]/admins | 获取管理员列表 | 登录 |
| POST | /api/families/[id]/admins | 添加管理员 | 创建者 |
| DELETE | /api/families/[id]/admins/[userId] | 移除管理员 | 创建者 |

### 3.3 成员 API

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/families/[id]/members | 获取家族成员列表 | 登录 |
| POST | /api/families/[id]/members | 创建成员 | 管理员 |
| GET | /api/members/[id] | 获取成员详情 | 登录 |
| PUT | /api/members/[id] | 更新成员信息 | 管理员 |
| DELETE | /api/members/[id] | 删除成员 | 管理员 |

### 3.4 关系 API

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/families/[id]/relationships | 获取家族关系列表 | 登录 |
| POST | /api/families/[id]/relationships | 创建关系 | 管理员 |
| DELETE | /api/relationships/[id] | 删除关系 | 管理员 |

### 3.5 导入导出 API

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/families/[id]/export?format=json | 导出 JSON | 管理员 |
| GET | /api/families/[id]/export?format=csv | 导出 CSV | 管理员 |
| POST | /api/families/[id]/import | 导入 JSON | 管理员 |

### 3.6 API 响应格式

**成功**：
```json
{ "data": { ... } }
// 或列表
{ "data": [ ... ] }
```

**错误**：
```json
{ "error": "错误描述信息" }
```

HTTP 状态码：200（成功）、201（创建）、400（参数错误）、401（未认证）、403（无权限）、404（不存在）、409（冲突）、500（服务器错误）

---

## 4. 前端架构

### 4.1 页面路由

```
/                          → 重定向到 /dashboard 或 /login
/login                     → 登录页
/register                  → 注册页
/dashboard                 → 用户仪表盘（家族列表）
/families/new              → 创建家族
/families/[id]             → 家族详情（树状图/列表）
/families/[id]/settings    → 家族设置（管理员管理）
/families/[id]/members/new → 添加成员
/families/[id]/members/[memberId]/edit → 编辑成员
```

### 4.2 组件树

```
App (layout.tsx)
├── Header
│   ├── Logo
│   ├── Navigation
│   └── UserMenu
├── (auth) group
│   ├── LoginPage
│   │   └── LoginForm
│   └── RegisterPage
│       └── RegisterForm
├── DashboardPage
│   ├── FamilyCard[]
│   └── CreateFamilyButton
├── FamilyDetailPage
│   ├── FamilyHeader
│   ├── ViewToggle (树状 / 列表)
│   ├── FamilyTreeView
│   │   └── FamilyTreeSvg (D3)
│   │       ├── MemberNode[]
│   │       └── RelationshipEdge[]
│   ├── MemberListView
│   │   └── MemberRow[]
│   └── ActionPanel (管理员)
│       ├── AddMemberButton
│       ├── AddRelationshipModal
│       └── ImportExportMenu
├── MemberFormPage
│   └── MemberForm
└── FamilySettingsPage
    └── AdminManager
```

### 4.3 状态管理

采用 React 内置 state + Server Components 数据获取，不引入额外状态管理库：

- **服务端数据**：通过 Server Components 直接查询 Prisma（SSR）
- **客户端状态**：useState / useReducer 管理 UI 状态（modal open/close 等）
- **表单**：react-hook-form（轻量级表单管理）
- **乐观更新**：操作后 router.refresh() 重新获取数据

---

## 5. 族谱树可视化设计

### 5.1 数据结构转换

从数据库关系数据转换为 D3 树形数据：

```typescript
// 输入：扁平关系列表
type Relationship = { fromMemberId: string; toMemberId: string; type: 'PARENT_CHILD' | 'SPOUSE' }

// 输出：D3 可用的树形结构
type TreeNode = {
  id: string
  data: FamilyMember
  children: TreeNode[]
  spouses: FamilyMember[]  // 配偶并排显示，不进入树层级
}
```

**转换算法**：
1. 建立 `childrenMap`：`parentId → childId[]`（来自 PARENT_CHILD 关系）
2. 建立 `spouseMap`：`memberId → memberId[]`（来自 SPOUSE 关系）
3. 找出根节点：无父节点的成员
4. 若根节点多于一个，创建虚拟根节点合并
5. 递归构建树，避免循环（visited set）

### 5.2 D3 布局

使用 `d3.tree()` 计算节点坐标：

```
画布尺寸：充满容器（响应式）
节点尺寸：120 × 60 px
节点间距：水平 160px，垂直 100px
坐标系：根节点在顶部，向下展开
```

### 5.3 节点渲染

每个节点为 SVG `<foreignObject>` 包裹的 React 组件，内容包括：
- 照片（圆形头像，无照片时显示性别默认图标）
- 姓名
- 生卒年（简写）
- 在世/已故状态标记（绿点/灰标）

配偶通过水平虚线连接，显示在节点右侧。

### 5.4 交互

| 交互 | 实现 |
|------|------|
| 缩放 | d3.zoom()，滚轮缩放 0.1x–3x |
| 平移 | d3.zoom() drag |
| 点击节点 | 显示成员详情 Modal |
| 折叠子树 | 点击节点的折叠按钮（有子节点时显示） |

---

## 6. 认证设计

### 6.1 NextAuth.js 配置

使用 Credentials Provider：
```
用户提交邮箱 + 密码
→ 查询 User 表
→ bcrypt.compare(password, user.password)
→ 成功：返回 user 对象生成 JWT Session
→ 失败：返回 null
```

### 6.2 Session 数据

JWT 中包含：
```typescript
{
  user: {
    id: string
    email: string
    name: string
  }
}
```

### 6.3 API 鉴权中间件

封装 `withAuth` 工具函数，在每个需要鉴权的 API Route 中调用：

```typescript
// 使用示例
export async function GET(req: Request) {
  const session = await requireAuth()  // 未登录则 throw 401
  // ...
}

export async function POST(req: Request, { params }) {
  const session = await requireAuth()
  await requireFamilyAdmin(session.user.id, params.familyId)  // 非管理员则 throw 403
  // ...
}
```

---

## 7. 导入导出设计

### 7.1 JSON 导出格式

```json
{
  "version": "1.0",
  "exportedAt": "2026-04-18T00:00:00.000Z",
  "family": {
    "name": "张氏家族",
    "description": "..."
  },
  "members": [
    {
      "id": "temp-1",
      "name": "张三",
      "gender": "MALE",
      "birthDate": "1950-01-01",
      "isAlive": false,
      "deathDate": "2020-06-15",
      "occupation": "农民",
      "hometown": "湖南省长沙市"
    }
  ],
  "relationships": [
    {
      "fromMemberId": "temp-1",
      "toMemberId": "temp-2",
      "type": "PARENT_CHILD"
    }
  ]
}
```

### 7.2 CSV 导出格式

```csv
id,姓名,性别,生日,忌日,在世,职业,籍贯
cm123,张三,男,1950-01-01,2020-06-15,否,农民,湖南省长沙市
```

### 7.3 JSON 导入逻辑

1. 解析 JSON，验证格式
2. 在当前家族中创建所有成员（id 映射为新 cuid）
3. 根据 id 映射表建立关系
4. 导入失败则全部回滚（Prisma 事务）

---

## 8. 错误处理策略

| 层级 | 错误处理方式 |
|------|-------------|
| API Route | try/catch + 标准错误响应 JSON |
| Prisma | 捕获 PrismaClientKnownRequestError（如唯一约束冲突）转为 409 |
| 前端 fetch | 检查 response.ok，显示 toast 通知 |
| 组件边界 | React Error Boundary 防止白屏 |

---

## 9. 目录结构

```
zupu/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx          # 根 layout，包含 SessionProvider
│   │   ├── page.tsx            # 根路由，重定向
│   │   ├── (auth)/
│   │   │   ├── layout.tsx      # 无 header 的 auth layout
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── families/
│   │   │   ├── new/page.tsx
│   │   │   └── [familyId]/
│   │   │       ├── page.tsx
│   │   │       ├── settings/page.tsx
│   │   │       └── members/
│   │   │           ├── new/page.tsx
│   │   │           └── [memberId]/edit/page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── [...nextauth]/route.ts
│   │       │   └── register/route.ts
│   │       ├── families/
│   │       │   ├── route.ts
│   │       │   └── [familyId]/
│   │       │       ├── route.ts
│   │       │       ├── members/route.ts
│   │       │       ├── relationships/route.ts
│   │       │       ├── admins/
│   │       │       │   ├── route.ts
│   │       │       │   └── [userId]/route.ts
│   │       │       ├── export/route.ts
│   │       │       └── import/route.ts
│   │       ├── members/[memberId]/route.ts
│   │       └── relationships/[relationshipId]/route.ts
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.tsx
│   │   ├── family/
│   │   │   ├── FamilyCard.tsx
│   │   │   └── FamilyForm.tsx
│   │   ├── member/
│   │   │   ├── MemberCard.tsx
│   │   │   ├── MemberForm.tsx
│   │   │   └── MemberList.tsx
│   │   ├── tree/
│   │   │   └── FamilyTree.tsx
│   │   ├── relationship/
│   │   │   └── RelationshipForm.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── Badge.tsx
│   │       └── Toast.tsx
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   └── tree-utils.ts
│   └── types/
│       └── index.ts
└── tests/
    ├── unit/
    │   ├── tree-utils.test.ts
    │   └── api-helpers.test.ts
    └── integration/
        └── family-workflow.test.ts
```
