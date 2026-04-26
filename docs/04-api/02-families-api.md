# 家族 API 详细设计

**版本**：1.1.0  
**更新日期**：2026-04-26  

---

## GET /api/families

获取当前用户所有管理的家族列表。

**权限**：登录

**响应**：
```json
{
  "data": [
    {
      "id": "cm...",
      "name": "张氏家族",
      "description": "湖南张氏...",
      "createdById": "cm...",
      "createdAt": "2026-04-18T00:00:00.000Z",
      "updatedAt": "2026-04-18T00:00:00.000Z",
      "admins": [
        { "id": "cm...", "userId": "cm...", "familyId": "cm...", "createdAt": "...",
          "user": { "id": "cm...", "email": "alice@example.com", "name": "Alice" } }
      ],
      "_count": { "members": 12 }
    }
  ]
}
```

---

## POST /api/families

创建新家族，创建者自动成为管理员。

**权限**：登录

**请求体**：
```json
{
  "name": "张氏家族",
  "description": "湖南张氏，世居长沙..."
}
```

**校验**：
- `name` 必填，去除首尾空格后不能为空
- `description` 必填，去除首尾空格后不能为空

**响应（201）**：同 GET /api/families 单个家族对象

**错误**：
- `400`：`"家族名称为必填项"` / `"家族简介为必填项"`

---

## GET /api/families/search?q=关键词

搜索所有家族（用于「发现家族」功能）。

**权限**：登录

**查询参数**：
- `q`（可选）：按家族名称模糊匹配；为空时返回全部

**响应**：
```json
{
  "data": [
    {
      "id": "cm...",
      "name": "张氏家族",
      "description": "湖南张氏...",
      "createdById": "cm...",
      "createdAt": "...",
      "updatedAt": "...",
      "admins": [{ "userId": "cm..." }],
      "_count": { "members": 12 }
    }
  ]
}
```

> `admins` 数组中只包含 `userId`，用于前端过滤"已是管理员"的家族。  
> 前端可用 `admins.length` 展示用户数量。

---

## GET /api/families/[familyId]

获取家族详情，包含所有成员和关系数据。

**权限**：登录

**响应**：
```json
{
  "data": {
    "id": "cm...",
    "name": "张氏家族",
    "description": "...",
    "createdById": "cm...",
    "admins": [...],
    "members": [...],
    "relationships": [...]
  }
}
```

**错误**：
- `404`：家族不存在

---

## PUT /api/families/[familyId]

修改家族名称和简介。

**权限**：管理员

**请求体**：
```json
{
  "name": "新名称",
  "description": "新简介"
}
```

**响应**：更新后的家族对象

---

## DELETE /api/families/[familyId]

删除家族（级联删除所有成员、关系、申请）。

**权限**：管理员

**响应**：`{ "data": { "success": true } }`

---

## GET /api/families/[familyId]/admins

获取管理员列表（含用户信息）。

**权限**：登录

**响应**：
```json
{
  "data": [
    {
      "id": "cm...",
      "userId": "cm...",
      "familyId": "cm...",
      "createdAt": "...",
      "user": { "id": "cm...", "email": "alice@example.com", "name": "Alice" }
    }
  ]
}
```

---

## POST /api/families/[familyId]/admins

按邮箱添加用户为管理员。

**权限**：创建者

**请求体**：
```json
{ "email": "bob@example.com" }
```

**错误**：
- `400`：用户不存在
- `409`：该用户已是管理员

---

## DELETE /api/families/[familyId]/admins/[userId]

移除指定管理员。

**权限**：创建者

**错误**：
- `400`：不能移除创建者自己
- `404`：该管理员不存在
