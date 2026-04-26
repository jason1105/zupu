# 数据库 ER 图

**版本**：1.1.0  
**更新日期**：2026-04-26  

---

## 1. 实体关系图

```
┌──────────────┐       ┌─────────────────┐       ┌──────────────┐
│     User     │       │   FamilyAdmin   │       │    Family    │
├──────────────┤       ├─────────────────┤       ├──────────────┤
│ id (PK)      │1─────<│ id (PK)         │>─────1│ id (PK)      │
│ email        │       │ userId (FK)     │       │ name         │
│ password     │       │ familyId (FK)   │       │ description  │
│ name         │       │ createdAt       │       │ createdById  │
│ createdAt    │       └─────────────────┘       │ createdAt    │
│ updatedAt    │                                 │ updatedAt    │
└──────────────┘                                 └──────┬───────┘
       │                                                │
       │  ┌──────────────────────┐                     │1
       │  │  FamilyJoinRequest   │                     │
       │  ├──────────────────────┤               ┌─────▼──────┐
       1──│ userId (FK)          │               │FamilyMember│
          │ familyId (FK)        │               ├────────────┤
          │ realName             │           ┌──<│ id (PK)    │>──┐
          │ reason               │           │   │ familyId   │   │
          │ status               │           │   │ name       │   │
          │ createdAt            │           │   │ gender     │   │
          │ updatedAt            │           │   │ birthDate  │   │
          │ id (PK)              │           │   │ deathDate  │   │
          └──────────────────────┘           │   │ isAlive    │   │
                                             │   │ occupation │   │
                                             │   │ hometown   │   │
                                             │   │ photoUrl   │   │
                                             │   │ bio        │   │
                                             │   │ createdAt  │   │
                                             │   │ updatedAt  │   │
                                             │   └────────────┘   │
                                             │                    │
                                             │  ┌──────────────┐  │
                                             │  │ Relationship │  │
                                             │  ├──────────────┤  │
                                             └─<│fromMemberId  │>─┘
                                                │toMemberId    │
                                                │type          │
                                                │familyId      │
                                                │id (PK)       │
                                                │createdAt     │
                                                └──────────────┘
```

---

## 2. 关系说明

| 关系 | 基数 | 说明 |
|------|------|------|
| User → FamilyAdmin | 1 : N | 一个用户可以是多个家族的管理员 |
| Family → FamilyAdmin | 1 : N | 一个家族可以有多个管理员 |
| Family → FamilyMember | 1 : N | 一个家族包含多个成员 |
| FamilyMember → Relationship（fromMember） | 1 : N | 一个成员可以作为"起始方"参与多个关系 |
| FamilyMember → Relationship（toMember） | 1 : N | 一个成员可以作为"目标方"参与多个关系 |
| User → FamilyJoinRequest | 1 : N | 一个用户可以向多个家族提交申请 |
| Family → FamilyJoinRequest | 1 : N | 一个家族可以收到多个申请 |

---

## 3. 唯一约束

| 表 | 约束字段 | 说明 |
|----|---------|------|
| `User` | `email` | 邮箱全局唯一 |
| `FamilyAdmin` | `(userId, familyId)` | 同一用户在同一家族只能有一条管理员记录 |
| `Relationship` | `(fromMemberId, toMemberId, type)` | 同类型关系不重复 |
| `FamilyJoinRequest` | `(familyId, userId)` | 同一用户对同一家族只能有一条申请记录 |

---

## 4. 级联删除规则

| 操作 | 级联效果 |
|------|---------|
| 删除 `User` | 级联删除其所有 `FamilyAdmin`、`FamilyJoinRequest` |
| 删除 `Family` | 级联删除其所有 `FamilyAdmin`、`FamilyMember`、`FamilyJoinRequest` |
| 删除 `FamilyMember` | 级联删除其所有 `Relationship`（fromMember 和 toMember） |

---

## 5. 设计注意事项

### 5.1 `Family.createdById` 非外键

`createdById` 存储创建者的 `userId`，但**没有声明为 Prisma 外键关系**。原因：若用外键约束，删除用户会级联删除其创建的家族；当前设计允许创建者离开平台后家族继续存在。

### 5.2 `Relationship.type` 语义

- `PARENT_CHILD`：`fromMember` 是 `toMember` 的**父或母**，方向固定
- `SPOUSE`：互为配偶，逻辑上双向，但数据库中存储一条记录（`@@unique` 约束防止重复存储反向记录）

### 5.3 `FamilyJoinRequest` 的 `status` 流转

```
PENDING → APPROVED（批准，同时在 FamilyAdmin 中 upsert 一条记录）
PENDING → REJECTED（拒绝）
REJECTED → PENDING（允许重新申请，更新同一条记录）
```
