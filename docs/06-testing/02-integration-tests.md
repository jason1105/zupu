# 集成测试设计

**版本**：1.0.0  
**更新日期**：2026-04-26  
**框架**：Vitest 4.x + Prisma Client（测试数据库）  

---

## 1. 测试策略

集成测试使用真实的 Prisma Client 连接独立的测试 SQLite 数据库，测试完整的数据库操作流程，覆盖业务逻辑的完整路径。

**测试数据库**：`DATABASE_URL="file:/tmp/zupu-test.db"`（独立于开发数据库）

---

## 2. 测试范围

| 测试文件 | 覆盖场景 | 测试数量 |
|---------|---------|---------|
| `tests/integration/family-workflow.test.ts` | 完整家族工作流 | 11 |

---

## 3. family-workflow 测试（11 个）

### 测试前置（beforeEach）

每个测试前：
1. 清空所有表（`Relationship` → `FamilyMember` → `FamilyAdmin` → `Family` → `User`，注意顺序避免外键冲突）
2. 创建测试用户（alice、bob）
3. 创建测试家族，alice 为管理员

### 测试用例

| 编号 | 用例名 | 测试内容 |
|------|-------|---------|
| 01 | 创建家族 | `Family.create` 后可查询到该家族 |
| 02 | 添加管理员 | `FamilyAdmin.create` 后管理员列表包含新管理员 |
| 03 | 创建成员 | `FamilyMember.create` 后家族成员数量正确 |
| 04 | 编辑成员 | `FamilyMember.update` 后字段变化正确反映 |
| 05 | 创建亲子关系 | `Relationship.create(PARENT_CHILD)` 后树结构正确 |
| 06 | 创建夫妻关系 | `Relationship.create(SPOUSE)` 后配偶关系正确 |
| 07 | 重复关系约束 | 相同关系二次创建抛出唯一约束错误 |
| 08 | 删除成员级联 | 删除成员后其关系也被级联删除 |
| 09 | buildTree 正确性 | 真实数据库数据通过 `buildTree` 构建正确的树结构 |
| 10 | 家族隔离 | 不同家族的成员不互相可见 |
| 11 | 导出格式 | 导出的 JSON 包含完整成员和关系数据 |

---

## 4. 运行方式

```bash
# 运行全部集成测试（使用独立测试数据库）
DATABASE_URL="file:/tmp/zupu-test.db" npx vitest run tests/integration/

# 运行全部测试（单元 + 集成）
npm test
```

---

## 5. 测试数据库初始化

集成测试首次运行前需确保测试数据库已完成迁移：

```bash
DATABASE_URL="file:/tmp/zupu-test.db" npx prisma migrate deploy
```

`npm test` 脚本（`vitest run`）不自动执行迁移，CI 环境需在测试前显式执行。

---

## 6. 测试隔离原则

- **表清理顺序**：遵循外键依赖顺序（子表先删）
- **无全局状态**：每个测试通过 `beforeEach` 建立独立数据，不依赖测试执行顺序
- **真实 Prisma 实例**：不使用 Mock，确保 ORM 层行为与生产一致
- **事务回滚**：暂未使用事务回滚（直接 `deleteMany` 清理），可优化为每测试开事务

---

## 7. 覆盖率目标

| 模块 | 目标覆盖率 |
|------|----------|
| `src/lib/tree-utils.ts` | ≥ 90% |
| `src/lib/api-helpers.ts` | ≥ 80% |
| 数据库操作路径 | ≥ 70% |

当前状态：**36/36 测试全部通过** ✅
