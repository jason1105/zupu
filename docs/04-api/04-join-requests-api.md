# 加入申请 API 详细设计

**版本**：1.0.0  
**更新日期**：2026-04-26  

---

## 概述

加入申请功能允许任意已登录用户向任意家族提交申请，家族管理员可审批。

**状态流转**：
```
（初始）
  ↓ POST /join-requests
PENDING
  ├─→ APPROVED（管理员批准，同时在 FamilyAdmin 创建记录）
  └─→ REJECTED（管理员拒绝）
             ↓ POST /join-requests（重新申请，更新同一条记录）
           PENDING
```

---

## POST /api/families/[familyId]/join-requests

提交加入申请。

**权限**：登录

**请求体**：
```json
{
  "realName": "张三",
  "reason": "我是张氏后裔，希望加入家族族谱管理，为家族历史传承贡献力量。"
}
```

**校验**：
- `realName`：必填，去除空格后不为空
- `reason`：必填，去除空格后 ≥ 20 字

**业务规则**：
- 当前用户已是该家族管理员 → `409 "您已是该家族管理员"`
- 已有 `PENDING` 申请 → `409 "您已有待审核的申请"`
- 已有 `APPROVED` 申请 → `409 "您的申请已被批准"`
- 已有 `REJECTED` 申请 → 更新为 `PENDING`（允许重新申请），返回 `200`

**响应（201 / 200）**：
```json
{
  "data": {
    "id": "cm...",
    "familyId": "cm...",
    "userId": "cm...",
    "realName": "张三",
    "reason": "...",
    "status": "PENDING",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## GET /api/families/[familyId]/join-requests

获取该家族所有加入申请列表。

**权限**：管理员

**响应**：
```json
{
  "data": [
    {
      "id": "cm...",
      "familyId": "cm...",
      "userId": "cm...",
      "realName": "张三",
      "reason": "...",
      "status": "PENDING",
      "createdAt": "...",
      "updatedAt": "...",
      "user": {
        "id": "cm...",
        "email": "zhangsan@example.com",
        "name": "张三账号"
      }
    }
  ]
}
```

> 列表按 `createdAt DESC` 排序

---

## PATCH /api/families/[familyId]/join-requests/[requestId]

审批申请（批准或拒绝）。

**权限**：管理员

**请求体**：
```json
{ "action": "APPROVE" }
// 或
{ "action": "REJECT" }
```

**行为**：
- `APPROVE`：
  1. 更新申请状态为 `APPROVED`
  2. `upsert` FamilyAdmin 记录（防止重复添加）
- `REJECT`：更新申请状态为 `REJECTED`

**校验**：
- `action` 必须为 `APPROVE` 或 `REJECT`
- 申请必须存在且属于该家族
- 申请状态必须为 `PENDING`（已处理的不可再次操作）

**错误**：
- `400`：无效操作
- `404`：申请不存在
- `409`：该申请已处理

**响应**：更新后的申请对象

---

## DELETE /api/families/[familyId]/join-requests/[requestId]

申请人撤回自己的申请。

**权限**：申请人本人

**校验**：
- 申请必须存在且属于该家族
- 只有申请人自己可以撤回（非申请人 → `403`）
- 只有 `PENDING` 状态的申请可以撤回（已处理 → `409`）

**响应**：`{ "data": { "success": true } }`
