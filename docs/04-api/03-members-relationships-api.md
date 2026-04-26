# 成员与关系 API 详细设计

**版本**：1.0.0  
**更新日期**：2026-04-26  

---

## 成员 API

### POST /api/families/[familyId]/members

在指定家族创建新成员。

**权限**：管理员

**请求体**：
```json
{
  "name": "张三",
  "gender": "MALE",
  "birthDate": "1950-01-01",
  "deathDate": null,
  "isAlive": true,
  "occupation": "农民",
  "hometown": "湖南省长沙市",
  "photoUrl": "https://example.com/photo.jpg",
  "bio": "家族长老，德高望重。"
}
```

**校验**：
- `name`：必填
- `gender`：必填，值为 `MALE` / `FEMALE` / `OTHER`
- `isAlive`：默认 `true`；为 `false` 时 `deathDate` 有意义

**响应（201）**：创建的成员对象

---

### GET /api/members/[memberId]

获取成员详情。

**权限**：登录

**响应**：
```json
{
  "data": {
    "id": "cm...",
    "familyId": "cm...",
    "name": "张三",
    "gender": "MALE",
    "birthDate": "1950-01-01T00:00:00.000Z",
    "deathDate": null,
    "isAlive": true,
    "occupation": "农民",
    "hometown": "湖南省长沙市",
    "photoUrl": null,
    "bio": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### PUT /api/members/[memberId]

更新成员信息（全量替换）。

**权限**：管理员（通过成员所属家族验证）

**请求体**：同 POST，所有字段均可更新

**响应**：更新后的成员对象

---

### DELETE /api/members/[memberId]

删除成员，同时级联删除其所有关系记录。

**权限**：管理员

**响应**：`{ "data": { "success": true } }`

---

## 关系 API

### POST /api/families/[familyId]/relationships

建立两个成员之间的关系。

**权限**：管理员

**请求体**：
```json
{
  "fromMemberId": "cm...",
  "toMemberId": "cm...",
  "type": "PARENT_CHILD"
}
```

**校验**：
- `fromMemberId` 与 `toMemberId` 不能相同
- 两个成员必须属于同一家族
- `type` 为 `PARENT_CHILD` 或 `SPOUSE`

**语义**：
- `PARENT_CHILD`：`fromMember` 是 `toMember` 的父亲或母亲
- `SPOUSE`：`fromMember` 与 `toMember` 互为配偶

**错误**：
- `400`：成员相同，或不属于同一家族
- `409`：关系已存在（`@@unique` 约束）

**响应（201）**：创建的关系对象

---

### DELETE /api/relationships/[relationshipId]

删除指定关系记录。

**权限**：管理员（通过关系所属家族验证）

**响应**：`{ "data": { "success": true } }`

---

## 导入导出 API

### GET /api/families/[familyId]/export

导出族谱数据。

**权限**：管理员

**查询参数**：
- `format=json`：导出 JSON 文件（含成员 + 关系完整数据）
- `format=csv`：导出 CSV 文件（仅成员基本信息）

**JSON 格式**（`Content-Disposition: attachment; filename="export.json"`）：
```json
{
  "version": "1.0",
  "exportedAt": "2026-04-26T00:00:00.000Z",
  "family": { "name": "张氏家族", "description": "..." },
  "members": [
    {
      "id": "cm...",
      "name": "张三",
      "gender": "MALE",
      "birthDate": "1950-01-01T00:00:00.000Z",
      "isAlive": false,
      "deathDate": "2020-06-15T00:00:00.000Z",
      "occupation": "农民",
      "hometown": "湖南省长沙市",
      "photoUrl": null,
      "bio": null
    }
  ],
  "relationships": [
    { "fromMemberId": "cm...", "toMemberId": "cm...", "type": "PARENT_CHILD" }
  ]
}
```

**CSV 格式**（带 UTF-8 BOM，兼容 Excel 中文）：
```
id,姓名,性别,生日,忌日,在世,职业,籍贯
cm...,张三,男,1950-01-01,2020-06-15,否,农民,湖南省长沙市
```

---

### POST /api/families/[familyId]/import

从 JSON 文件导入成员和关系。

**权限**：管理员

**请求体**：同导出 JSON 格式

**行为**：
1. 验证 JSON 格式（members 和 relationships 数组存在）
2. 在当前家族中创建所有成员（重新生成 cuid，建立 oldId → newId 映射表）
3. 根据映射表创建关系
4. 全部操作在 Prisma 事务中执行，失败则整体回滚

**响应**：
```json
{
  "data": {
    "membersCreated": 12,
    "relationshipsCreated": 8
  }
}
```

**错误**：
- `400`：JSON 格式无效
- `500`：导入失败（含回滚）
