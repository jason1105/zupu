# 数据字典

**版本**：1.1.0  
**更新日期**：2026-04-26  

---

## 1. User（用户）

| 字段 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | String (cuid) | 否 | cuid() | 主键 |
| email | String | 否 | — | 登录邮箱，全局唯一 |
| password | String | 否 | — | bcrypt 哈希密码（saltRounds=10） |
| name | String | 否 | — | 显示名称 |
| createdAt | DateTime | 否 | now() | 注册时间 |
| updatedAt | DateTime | 否 | — | 最后更新时间（Prisma 自动维护） |

---

## 2. Family（家族）

| 字段 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | String (cuid) | 否 | cuid() | 主键 |
| name | String | 否 | — | 家族名称 |
| description | String | 是 | null | 家族简介（在 UI 上必填，数据库允许空） |
| createdById | String | 否 | — | 创建者 userId（非 FK，避免级联删除家族） |
| createdAt | DateTime | 否 | now() | 创建时间 |
| updatedAt | DateTime | 否 | — | 最后更新时间 |

---

## 3. FamilyAdmin（家族管理员）

| 字段 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | String (cuid) | 否 | cuid() | 主键 |
| userId | String | 否 | — | 管理员用户 ID（FK → User.id，CASCADE） |
| familyId | String | 否 | — | 家族 ID（FK → Family.id，CASCADE） |
| createdAt | DateTime | 否 | now() | 成为管理员的时间 |

**唯一约束**：`(userId, familyId)`

---

## 4. FamilyMember（族谱成员）

| 字段 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | String (cuid) | 否 | cuid() | 主键 |
| familyId | String | 否 | — | 所属家族 ID（FK → Family.id，CASCADE） |
| name | String | 否 | — | 成员姓名 |
| gender | String | 否 | — | 性别：`MALE` / `FEMALE` / `OTHER` |
| birthDate | DateTime | 是 | null | 生日 |
| deathDate | DateTime | 是 | null | 忌日（isAlive=false 时有意义） |
| isAlive | Boolean | 否 | true | 在世状态：true=在世，false=已故 |
| occupation | String | 是 | null | 职业 |
| hometown | String | 是 | null | 籍贯 |
| photoUrl | String | 是 | null | 照片 URL |
| bio | String | 是 | null | 人物简介 |
| createdAt | DateTime | 否 | now() | 录入时间 |
| updatedAt | DateTime | 否 | — | 最后更新时间 |

---

## 5. Relationship（关系）

| 字段 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | String (cuid) | 否 | cuid() | 主键 |
| familyId | String | 否 | — | 所属家族 ID（冗余存储，便于查询） |
| fromMemberId | String | 否 | — | 起始成员 ID（FK → FamilyMember.id，CASCADE） |
| toMemberId | String | 否 | — | 目标成员 ID（FK → FamilyMember.id，CASCADE） |
| type | String | 否 | — | 关系类型：`PARENT_CHILD` / `SPOUSE` |
| createdAt | DateTime | 否 | now() | 创建时间 |

**唯一约束**：`(fromMemberId, toMemberId, type)`

**关系语义**：
- `PARENT_CHILD`：fromMember 是 toMember 的父亲或母亲
- `SPOUSE`：fromMember 与 toMember 互为配偶（存一条记录，读取时双向匹配）

---

## 6. FamilyJoinRequest（加入申请）

| 字段 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | String (cuid) | 否 | cuid() | 主键 |
| familyId | String | 否 | — | 目标家族 ID（FK → Family.id，CASCADE） |
| userId | String | 否 | — | 申请人用户 ID（FK → User.id，CASCADE） |
| realName | String | 否 | — | 申请人真实姓名 |
| reason | String | 否 | — | 加入理由（UI 要求 ≥ 20 字，后端校验） |
| status | String | 否 | `PENDING` | 状态：`PENDING` / `APPROVED` / `REJECTED` |
| createdAt | DateTime | 否 | now() | 申请时间 |
| updatedAt | DateTime | 否 | — | 最后更新时间（审批时更新） |

**唯一约束**：`(familyId, userId)`（同一用户对同一家族只有一条记录，REJECTED 后重申请是 UPDATE）
