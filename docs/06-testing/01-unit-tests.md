# 单元测试设计

**版本**：1.0.0  
**更新日期**：2026-04-26  
**框架**：Vitest 4.x + @testing-library/react  

---

## 1. 测试范围

单元测试覆盖两个核心工具模块：

| 模块 | 测试文件 | 测试数量 |
|------|---------|---------|
| 树构建工具 | `tests/unit/tree-utils.test.ts` | 13 |
| API 辅助函数 | `tests/unit/api-helpers.test.ts` | 12 |

---

## 2. tree-utils 测试（13 个）

**测试文件**：`tests/unit/tree-utils.test.ts`

### buildTree()

| 用例 | 描述 |
|------|------|
| 空数据 | 无成员时返回空数组 |
| 单节点 | 单个成员无关系，成为单根节点 |
| 父子关系 | PARENT_CHILD 关系正确构建父子层级 |
| 配偶关系 | SPOUSE 关系附加到 spouses 数组，不进入 children |
| 多根节点 | 多个无父节点的成员各自成为根 |
| 三代家族 | 祖-父-子三代关系正确嵌套 |
| 循环保护 | A→B→A 的循环关系不导致无限递归（visited Set 保护） |

### flattenTree()

| 用例 | 描述 |
|------|------|
| 扁平化 | 正确返回所有节点的一维数组 |
| 空树 | 返回空数组 |

### getMemberDepth()

| 用例 | 描述 |
|------|------|
| 根节点深度 | 根节点返回 0 |
| 子节点深度 | 正确返回深度值 |
| 不存在成员 | 返回 -1 |
| 多根树 | 各根树分别计算深度 |

---

## 3. api-helpers 测试（12 个）

**测试文件**：`tests/unit/api-helpers.test.ts`

### requireAuth()

| 用例 | 描述 |
|------|------|
| 已登录 | 返回 Session 对象 |
| 未登录 | 抛出 ApiError(401) |

### requireFamilyAdmin()

| 用例 | 描述 |
|------|------|
| 是管理员 | 正常返回 |
| 不是管理员 | 抛出 ApiError(403) |

### requireFamilyCreator()

| 用例 | 描述 |
|------|------|
| 是创建者 | 正常返回 |
| 不是创建者 | 抛出 ApiError(403) |
| 家族不存在 | 抛出 ApiError(404) |

### handleError()

| 用例 | 描述 |
|------|------|
| ApiError | 返回对应状态码的 JSON 响应 |
| 未知错误 | 返回 500 并记录日志 |
| 自定义状态码 | 正确透传 ApiError.status |

---

## 4. 运行方式

```bash
# 运行全部单元测试
npx vitest run tests/unit/

# watch 模式
npx vitest tests/unit/

# 带覆盖率报告
npx vitest run --coverage tests/unit/
```

---

## 5. 配置

**文件**：`vitest.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['@testing-library/jest-dom'],
  },
})
```

关键配置说明：
- `environment: 'jsdom'`：模拟浏览器 DOM 环境（组件测试需要）
- `@testing-library/jest-dom`：提供 `toBeInTheDocument()`、`toHaveTextContent()` 等 DOM 断言
