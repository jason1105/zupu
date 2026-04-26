# 前端组件设计

**版本**：1.1.0  
**更新日期**：2026-04-26  

---

## 1. 组件目录结构

```
src/components/
├── layout/
│   └── Header.tsx              # 全局导航条
├── family/
│   ├── DiscoverFamilies.tsx    # 家族搜索发现区块
│   ├── JoinRequestForm.tsx     # 加入申请表单
│   └── JoinRequestList.tsx     # 管理员审批面板
├── member/
│   ├── MemberCard.tsx          # 成员信息卡片
│   ├── MemberForm.tsx          # 成员新增/编辑表单
│   └── MemberList.tsx          # 成员列表（含筛选）
├── relationship/
│   └── RelationshipForm.tsx    # 关系创建表单
├── tree/
│   └── FamilyTree.tsx          # D3.js 族谱树可视化
└── ui/
    └── Modal.tsx               # 通用模态框
```

---

## 2. 组件详细说明

### Header

**文件**：`src/components/layout/Header.tsx`  
**类型**：Client Component（需要 `useSession`、`usePathname`）

**Props**：无

**功能**：
- 固定顶部（`sticky top-0 z-40`），高度 56px
- Logo 链接 → `/dashboard`
- 导航链接「我的家族」，当前页高亮
- `+ 新建家族` 按钮 → `/families/new`
- 用户名展示（来自 Session）
- 退出按钮（调用 NextAuth `signOut()`）
- 未登录时不渲染用户信息

---

### DiscoverFamilies

**文件**：`src/components/family/DiscoverFamilies.tsx`  
**类型**：Client Component

**Props**：
```typescript
{ currentUserId: string }
```

**状态**：
- `query`：搜索关键词
- `results`：搜索结果列表
- `loading`：搜索中状态
- `applying`：当前申请的家族（控制 Modal 开关）
- `applied`：已申请家族 ID 集合（Set，本地跟踪）

**行为**：
- 输入防抖 300ms 后调用 `GET /api/families/search?q=`
- 过滤掉 `currentUserId` 已是管理员的家族
- 申请成功后将家族 ID 加入 `applied` Set，按钮变为"申请已提交"

---

### JoinRequestForm

**文件**：`src/components/family/JoinRequestForm.tsx`  
**类型**：Client Component

**Props**：
```typescript
{
  familyId: string
  familyName: string
  onSuccess: () => void
  onCancel: () => void
}
```

**功能**：
- 真实姓名输入框（必填）
- 加入理由文本域（必填，实时字数显示，< 20 字禁止提交）
- 提交调用 `POST /api/families/[familyId]/join-requests`
- 错误显示在表单内（红色提示框）

---

### JoinRequestList

**文件**：`src/components/family/JoinRequestList.tsx`  
**类型**：Client Component

**Props**：
```typescript
{ familyId: string }
```

**功能**：
- 加载时调用 `GET /api/families/[familyId]/join-requests`
- 分"待审核"和"已处理"两个区块展示
- 每条申请显示：申请人真实姓名、账号邮箱、申请时间、状态标签、理由全文
- 批准/拒绝按钮调用 `PATCH /api/families/[familyId]/join-requests/[id]`
- 操作后重新加载列表

---

### MemberCard

**文件**：`src/components/member/MemberCard.tsx`  
**类型**：Client Component

**Props**：
```typescript
{
  member: FamilyMember
  isAdmin: boolean
  onEdit: (member: FamilyMember) => void
  onDelete: (memberId: string) => void
}
```

**展示内容**：
- 照片（圆形，无照片时显示性别默认图标）
- 姓名（已故成员卡片整体 `opacity-80`）
- 性别 + 出生年份（或"生于 xxxx 年"）
- 已故标记 + 忌日
- 职业、籍贯
- 管理员操作：编辑 / 删除按钮

---

### MemberForm

**文件**：`src/components/member/MemberForm.tsx`  
**类型**：Client Component

**Props**：
```typescript
{
  familyId: string
  initial?: FamilyMember    // 有值时为编辑模式
  onSuccess: () => void
  onCancel: () => void
}
```

**字段**：
| 字段 | 必填 | 类型 |
|------|------|------|
| 姓名 | ✓ | text |
| 性别 | ✓ | select（男/女/其他） |
| 生日 | - | date |
| 在世 | - | checkbox |
| 忌日 | - | date（isAlive=false 时显示） |
| 职业 | - | text |
| 籍贯 | - | text |
| 照片 URL | - | url |
| 简介 | - | textarea |

---

### MemberList

**文件**：`src/components/member/MemberList.tsx`  
**类型**：Client Component

**Props**：
```typescript
{
  members: FamilyMember[]
  isAdmin: boolean
  onEdit: (member: FamilyMember) => void
  onDelete: (memberId: string) => void
}
```

**功能**：
- 文本搜索框（按姓名过滤）
- 在世状态筛选按钮（全部 / 在世 / 已故）
- 成员卡片网格（`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`）
- 显示当前筛选结果数量

---

### RelationshipForm

**文件**：`src/components/relationship/RelationshipForm.tsx`  
**类型**：Client Component

**Props**：
```typescript
{
  familyId: string
  members: FamilyMember[]
  onSuccess: () => void
  onCancel: () => void
}
```

**字段**：
- 关系类型：亲子关系 / 夫妻关系（select）
- 第一位成员（select）
- 第二位成员（select，过滤掉第一位）
- 前端校验：两位成员不能相同

---

### FamilyTree

**文件**：`src/components/tree/FamilyTree.tsx`  
**类型**：Client Component（`dynamic(() => import(...), { ssr: false })`）

**Props**：
```typescript
{
  members: FamilyMember[]
  relationships: Relationship[]
}
```

**详细设计见**：`05-frontend/03-tree-visualization.md`

---

### Modal

**文件**：`src/components/ui/Modal.tsx`  
**类型**：Client Component

**Props**：
```typescript
{
  title: string
  onClose: () => void
  children: React.ReactNode
}
```

**行为**：
- 半透明黑色遮罩（点击关闭）
- Esc 键关闭（`useEffect` 监听 keydown）
- 内容区滚动（`overflow-y-auto max-h-[90vh]`）
- 标题栏 + × 关闭按钮

---

## 3. 设计原则

- **组件职责单一**：每个组件专注一个功能，Props 接口清晰
- **状态提升**：子组件通过 `onSuccess`/`onCancel` 回调通知父组件
- **加载状态**：提交中的按钮显示"...中"文字并 `disabled`
- **错误就近展示**：表单错误显示在表单内，不用 alert
- **条件渲染**：管理员操作按钮用 `{isAdmin && <button>}` 控制
