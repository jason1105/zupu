# 前端页面设计

**版本**：1.1.0  
**更新日期**：2026-04-26  

---

## 1. 路由结构

```
/                                   → 重定向（已登录 → /dashboard，未登录 → /login）
├── (auth)/                         → 认证路由组（居中布局，无 Header）
│   ├── login/                      → 登录页
│   └── register/                   → 注册页
├── dashboard/                      → 用户仪表盘
├── families/
│   ├── new/                        → 创建家族
│   └── [familyId]/                 → 家族详情
│       └── settings/               → 家族设置
└── api/...                         → API Routes（见 04-api/）
```

---

## 2. 页面详细说明

### 2.1 登录页（`/login`）

**组件类型**：Client Component  
**文件**：`src/app/(auth)/login/page.tsx`

**功能**：
- 邮箱 + 密码登录表单
- 调用 NextAuth.js `signIn('credentials', ...)` 
- 错误统一显示"邮箱或密码错误"（防账号枚举）
- 提交中禁用按钮（防重复提交）
- 链接到注册页

**表单字段**：
| 字段 | 类型 | 校验 |
|------|------|------|
| 邮箱 | email | required |
| 密码 | password | required |

---

### 2.2 注册页（`/register`）

**组件类型**：Client Component  
**文件**：`src/app/(auth)/register/page.tsx`

**功能**：
- POST `/api/auth/register` 创建账号
- 成功后跳转 `/login`
- 前端校验密码强度和一致性

**表单字段**：
| 字段 | 类型 | 校验 |
|------|------|------|
| 姓名 | text | required |
| 邮箱 | email | required |
| 密码 | password | required，≥ 8 字符 |
| 确认密码 | password | required，与密码一致 |

---

### 2.3 仪表盘（`/dashboard`）

**组件类型**：Server Component + 嵌套 Client Component  
**文件**：`src/app/dashboard/page.tsx`

**功能区块**：

**「我的家族」区**（Server Component，直接查询 Prisma）：
- 展示当前用户所有管理的家族卡片（3 列网格）
- 卡片内容：家族名称、简介、成员数、角色标签（创建者/管理员）
- 空状态：引导用户创建家族或搜索加入

**「发现家族」区**（`DiscoverFamilies` Client Component）：
- 防抖搜索框（300ms）
- 结果卡片：家族名、简介、族谱成员数、已加入用户数
- "申请加入"按钮（已是管理员的家族不显示）
- 点击申请弹出 `JoinRequestForm` Modal

---

### 2.4 创建家族（`/families/new`）

**组件类型**：Client Component  
**文件**：`src/app/families/new/page.tsx`

**功能**：
- POST `/api/families` 创建家族
- 成功后跳转到新家族详情页

**表单字段**：
| 字段 | 类型 | 校验 |
|------|------|------|
| 家族名称 | text | required |
| 家族简介 | textarea | required |

---

### 2.5 家族详情（`/families/[familyId]`）

**组件类型**：Client Component（含 D3 动态渲染，SSR 无法使用）  
**文件**：`src/app/families/[familyId]/page.tsx`

**布局**：全屏（`100vh - 56px`），顶部固定工具栏

**工具栏（所有用户）**：
- 返回 Dashboard 链接
- 家族名称 + 简介
- 树状 / 列表 视图切换

**工具栏（管理员额外显示）**：
- + 添加成员（Modal）
- + 添加关系（Modal）
- 数据 ▾ 下拉（导出 JSON / 导出 CSV / 导入 JSON）
- 设置链接

**工具栏（非管理员额外显示）**：
- 申请加入按钮（已提交申请后变为"申请审核中"，disabled）

**内容区**：
- **树状视图**：`FamilyTree` 组件（D3.js，ssr: false）
- **列表视图**：`MemberList` + 关系记录列表

---

### 2.6 家族设置（`/families/[familyId]/settings`）

**组件类型**：Client Component  
**文件**：`src/app/families/[familyId]/settings/page.tsx`

**功能区块**：

**基本信息编辑**（所有管理员）：
- 家族名称 + 简介
- 保存后显示成功/失败提示

**管理员管理**（所有管理员可查看）：
- 管理员列表（含创建者标签）
- 移除管理员按钮（仅创建者可操作）
- 按邮箱添加管理员表单（仅创建者可操作）

**加入申请管理**（所有管理员）：
- `JoinRequestList` 组件
- 待审核 / 已处理 分区显示
- 批准 / 拒绝 操作按钮

---

## 3. 导航结构

```
Header（固定顶部，所有认证页面显示）
├── 族谱 [Logo]   → /dashboard
├── 我的家族      → /dashboard（当前页高亮）
├── + 新建家族    → /families/new
├── [分隔线]
├── {用户名}      → 仅展示
└── 退出          → signOut()
```

---

## 4. 用户流程图

### 主流程
```
注册/登录 → Dashboard → 新建家族 → 家族详情
                                    ├── 添加成员 → 树状图可视化
                                    ├── 添加关系 → 树状图更新
                                    └── 设置 → 管理员 / 申请审批
```

### 加入流程
```
Dashboard「发现家族」→ 搜索家族 → 申请加入（填表单）
→ 等待审核 → 家族详情页"申请审核中"
→ 管理员审批 → 成为管理员 → 访问完整管理功能
```
