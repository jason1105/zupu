# 族谱应用 — 总体计划

## 项目概述

**名称**：族谱（Zupu）  
**目标**：一个支持多家族、多用户的在线族谱管理系统，具备成员管理、关系管理、树状可视化及数据导入导出功能。  
**技术栈**：Next.js 15 + TypeScript + Prisma + SQLite + NextAuth.js + D3.js  

---

## 开发阶段

| 阶段 | 内容 | 文档 | 状态 |
|------|------|------|------|
| 1 | 需求分析（PRD） | docs/01_prd.md | ✅ |
| 2 | 详细设计 | docs/02_design.md | ✅ |
| 3 | 编码实现 | docs/03_implementation_notes.md | ✅ |
| 4 | 单元测试 | docs/04_unit_tests.md | ✅ |
| 5 | 集成测试 | docs/05_integration_tests.md | ✅ |

---

## 技术选型理由

| 技术 | 选型 | 理由 |
|------|------|------|
| 框架 | Next.js 15 (App Router) | 全栈 TypeScript，前后端统一，API Routes 内置，SSR/SSG 灵活 |
| 语言 | TypeScript | 类型安全，减少运行时错误，IDE 支持优秀 |
| 数据库 | SQLite + Prisma | 零依赖嵌入式数据库，Prisma 提供类型安全 ORM 和迁移管理 |
| 认证 | NextAuth.js v5 | 与 Next.js 深度集成，支持 credentials provider |
| 样式 | Tailwind CSS | 原子化 CSS，快速构建，与 Next.js 官方推荐一致 |
| 可视化 | D3.js | 业界标准 SVG 可视化库，对树状图有完整的 layout 支持 |
| 测试 | Vitest + Playwright | Vitest 与 Next.js/Vite 生态兼容，Playwright 支持真实浏览器集成测试 |

---

## 项目结构

```
zupu/
├── docs/                        # 各阶段文档
│   ├── 01_prd.md
│   ├── 02_design.md
│   ├── 03_implementation_notes.md
│   ├── 04_unit_tests.md
│   └── 05_integration_tests.md
├── prisma/
│   ├── schema.prisma            # 数据库 schema
│   └── seed.ts                  # 种子数据
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # API Routes
│   │   ├── (auth)/              # 认证页面组（不含 layout header）
│   │   ├── dashboard/           # 用户仪表盘
│   │   └── families/            # 家族相关页面
│   ├── components/              # React 组件
│   │   ├── layout/
│   │   ├── family/
│   │   ├── member/
│   │   ├── tree/
│   │   ├── relationship/
│   │   └── ui/
│   ├── lib/                     # 工具库
│   │   ├── auth.ts              # NextAuth 配置
│   │   ├── prisma.ts            # Prisma 客户端单例
│   │   └── tree-utils.ts        # 树结构转换工具
│   └── types/                   # TypeScript 类型定义
│       └── index.ts
├── tests/
│   ├── unit/                    # 单元测试
│   └── integration/             # 集成测试
├── PLAN.md                      # 本文件：总体计划
├── CHANGELOG.md                 # 功能变动记录
└── README.md                    # 使用说明
```

---

## 核心功能模块

### 1. 用户认证
- 注册、登录、登出
- 基于 Session 的认证（JWT）

### 2. 家族管理
- 创建、编辑、删除家族
- 每个家族可指定一或多个管理员
- 普通成员可查看，管理员可编辑

### 3. 族谱成员管理
- 基本信息：姓名、性别、生日、忌日、在世/过世标记
- 扩展信息：职业、籍贯、照片（Base64 或 URL）、简介
- CRUD 操作

### 4. 关系管理
- 支持关系类型：PARENT_CHILD（父/母 → 子/女）、SPOUSE（夫妻）
- 关系方向语义明确（fromMember → toMember）

### 5. 族谱可视化
- **树状视图**：D3.js SVG 树，支持缩放和平移，显示代际层级
- **列表视图**：可筛选、排序的表格展示

### 6. 数据导入导出
- 导出格式：CSV（成员信息）+ JSON（完整数据含关系）
- 导入格式：JSON（完整族谱数据）

---

## 权限矩阵

| 操作 | 未登录 | 普通用户 | 家族管理员 |
|------|--------|----------|-----------|
| 查看公开家族 | ✅ | ✅ | ✅ |
| 创建家族 | ❌ | ✅ | ✅ |
| 编辑家族信息 | ❌ | ❌ | ✅ |
| 添加/编辑成员 | ❌ | ❌ | ✅ |
| 管理关系 | ❌ | ❌ | ✅ |
| 导入/导出数据 | ❌ | ❌ | ✅ |
| 指定管理员 | ❌ | ❌ | ✅（创建者） |

---

## 里程碑

- **M1**：文档完成（PRD + 设计文档）
- **M2**：数据层完成（Prisma schema + 迁移 + 种子数据）
- **M3**：API 层完成（所有 REST endpoints 可用）
- **M4**：前端完成（所有页面和组件可用）
- **M5**：测试完成（单元测试 + 集成测试通过）
- **M6**：项目交付（文档齐全，代码可运行）
