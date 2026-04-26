# API 设计总览

**版本**：1.1.0  
**更新日期**：2026-04-26  

---

## 1. 基本约定

### 1.1 Base URL

- 开发：`http://localhost:3000/api`
- 生产：`https://<vercel-domain>/api`

### 1.2 认证

所有需要认证的接口通过 **NextAuth.js JWT Cookie** 鉴权，无需手动传 token。  
浏览器端请求会自动携带 Cookie；服务端通过 `await auth()` 获取 session。

```typescript
// src/lib/api-helpers.ts
async function requireAuth(): Promise<Session>           // 未登录 → 401
async function requireFamilyAdmin(userId, familyId)      // 非管理员 → 403
async function requireFamilyCreator(userId, familyId)    // 非创建者 → 403
```

### 1.3 响应格式

**成功**：
```json
{ "data": { ... } }
```

**成功（列表）**：
```json
{ "data": [ ... ] }
```

**错误**：
```json
{ "error": "具体错误描述" }
```

### 1.4 HTTP 状态码

| 状态码 | 含义 | 典型场景 |
|--------|------|---------|
| 200 | 成功 | GET / PUT / PATCH / DELETE |
| 201 | 创建成功 | POST 新建资源 |
| 400 | 参数错误 | 必填字段为空，格式不合法 |
| 401 | 未认证 | 未登录或 Session 过期 |
| 403 | 无权限 | 非管理员/非创建者执行受限操作 |
| 404 | 不存在 | 资源 ID 不存在 |
| 409 | 冲突 | 重复提交、已是管理员等 |
| 500 | 服务器错误 | 未预期的异常 |

---

## 2. API 路由清单

### 2.1 认证

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/register` | 注册 | 公开 |
| POST | `/api/auth/signin` | 登录（NextAuth） | 公开 |
| POST | `/api/auth/signout` | 登出（NextAuth） | 登录 |
| GET | `/api/auth/session` | 获取当前 session | 公开 |

### 2.2 家族

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/families` | 获取当前用户管理的家族列表 | 登录 |
| POST | `/api/families` | 创建家族 | 登录 |
| GET | `/api/families/search?q=` | 搜索所有家族 | 登录 |
| GET | `/api/families/[id]` | 获取家族详情（含成员和关系） | 登录 |
| PUT | `/api/families/[id]` | 修改家族信息 | 管理员 |
| DELETE | `/api/families/[id]` | 删除家族 | 管理员 |

### 2.3 管理员

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/families/[id]/admins` | 获取管理员列表 | 登录 |
| POST | `/api/families/[id]/admins` | 添加管理员（按邮箱） | 创建者 |
| DELETE | `/api/families/[id]/admins/[userId]` | 移除管理员 | 创建者 |

### 2.4 成员

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/families/[id]/members` | 创建成员 | 管理员 |
| GET | `/api/members/[memberId]` | 获取成员详情 | 登录 |
| PUT | `/api/members/[memberId]` | 更新成员信息 | 管理员 |
| DELETE | `/api/members/[memberId]` | 删除成员 | 管理员 |

### 2.5 关系

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/families/[id]/relationships` | 创建关系 | 管理员 |
| DELETE | `/api/relationships/[relId]` | 删除关系 | 管理员 |

### 2.6 加入申请

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/families/[id]/join-requests` | 提交申请 | 登录 |
| GET | `/api/families/[id]/join-requests` | 查看申请列表 | 管理员 |
| PATCH | `/api/families/[id]/join-requests/[rid]` | 审批申请（批准/拒绝） | 管理员 |
| DELETE | `/api/families/[id]/join-requests/[rid]` | 撤回申请 | 申请人自己 |

### 2.7 导入导出

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/families/[id]/export?format=json` | 导出 JSON | 管理员 |
| GET | `/api/families/[id]/export?format=csv` | 导出 CSV | 管理员 |
| POST | `/api/families/[id]/import` | 导入 JSON | 管理员 |

---

## 3. 错误处理模式

所有 API Route 遵循统一模式：

```typescript
export async function GET(req: NextRequest, { params }) {
  try {
    const session = await requireAuth()           // → 401 if not logged in
    await requireFamilyAdmin(session.user.id, id) // → 403 if not admin
    // ... business logic ...
    return NextResponse.json({ data: result })
  } catch (e) {
    return handleError(e)  // ApiError → 对应状态码；其他 → 500
  }
}
```

`handleError` 在 `src/lib/api-helpers.ts` 中定义，统一处理 `ApiError` 实例和未知错误。
