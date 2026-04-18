# 功能变动记录

格式：`[版本] YYYY-MM-DD — 变动类型：描述`  
变动类型：`新增`、`修改`、`修复`、`移除`、`决策`

---

## [1.0.0] 2026-04-18 — 初始版本

### 决策
- **决策**：技术栈选择 Next.js 15 + TypeScript + Prisma 5 + SQLite + NextAuth.js v5 + D3.js
  - 原始候选方案包含 Python + FastAPI；用户确认后改为纯 TypeScript 全栈方案，减少语言切换成本
- **决策**：Prisma 7.x 降级为 Prisma 5.x
  - Prisma 7.7.0 的 `prisma.config.ts` 解析器在当前环境存在兼容性问题，改用稳定的 5.22.0

### 新增（功能）
- **新增**：用户注册（邮箱+密码，bcrypt 加密）
- **新增**：用户登录/登出（NextAuth.js Credentials Provider，JWT Session）
- **新增**：创建、编辑家族（名称、描述）
- **新增**：多家族支持，每个家族可指定多名管理员
- **新增**：家族创建者可添加/移除管理员（创建者本人不可移除）
- **新增**：添加、编辑、删除家族成员（姓名、性别、生卒日期、在世/已故、职业、籍贯、照片URL、简介）
- **新增**：建立亲子关系（PARENT_CHILD）
- **新增**：建立夫妻关系（SPOUSE）
- **新增**：删除关系记录
- **新增**：D3.js 族谱树状图（支持缩放、平移、点击查看详情）
- **新增**：列表视图（支持按姓名/在世状态筛选，显示关系记录）
- **新增**：导出 JSON（完整族谱数据，含成员和关系）
- **新增**：导出 CSV（成员基本信息，含 UTF-8 BOM）
- **新增**：导入 JSON（事务保证原子性，使用 id 映射表建立关系）
- **新增**：家族设置页（编辑基本信息、管理管理员）

### 新增（工程）
- **新增**：Prisma schema（User、Family、FamilyAdmin、FamilyMember、Relationship）
- **新增**：数据库迁移文件（`prisma/migrations/20260418115645_init`）
- **新增**：种子数据（张氏家族示例，三代六口人）
- **新增**：API 路由（families、members、relationships、admins、export、import、auth/register）
- **新增**：统一 API 错误处理（`ApiError` 类 + `handleError()` 函数）
- **新增**：权限中间件（`requireAuth`、`requireFamilyAdmin`、`requireFamilyCreator`）
- **新增**：`tree-utils.ts`（buildTree、flattenTree、getMemberDepth）
- **新增**：单元测试 25 个（tree-utils、api 输入验证逻辑）
- **新增**：集成测试 11 个（数据库操作、树构建场景）
- **新增**：Vitest 配置（jsdom 环境，路径别名 `@/`）
