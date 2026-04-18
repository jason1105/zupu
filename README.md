# 族谱（Zupu）

传承家族历史，记录每一位先辈。

一个支持多家族、多用户的在线族谱管理系统，具备成员管理、关系管理、D3.js 树状可视化及数据导入导出功能。

---

## 功能特性

- **用户认证**：邮箱+密码注册登录，bcrypt 加密存储
- **多家族管理**：创建多个独立家族，指定管理员
- **成员管理**：姓名、性别、生卒日期、在世/已故标记、职业、籍贯、照片、简介
- **关系管理**：亲子关系（父/母 → 子/女）和夫妻关系
- **族谱可视化**：D3.js SVG 树状图，支持缩放、平移、点击查看详情
- **列表视图**：可按姓名和在世状态筛选
- **数据导入导出**：JSON 完整导出/导入，CSV 成员列表导出

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript |
| 数据库 | SQLite（通过 Prisma 5 ORM 管理） |
| 认证 | NextAuth.js v5 (Beta) |
| 样式 | Tailwind CSS v4 |
| 可视化 | D3.js v7 |
| 测试 | Vitest v4 |

---

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装

```bash
# 克隆仓库
git clone <repo-url>
cd zupu

# 安装依赖
npm install
```

### 配置

```bash
# 复制环境变量示例文件
cp .env.example .env
```

编辑 `.env`，确认以下配置：

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-at-least-32-characters"
NEXTAUTH_URL="http://localhost:3000"
```

> `NEXTAUTH_SECRET` 在生产环境中务必替换为强随机字符串（如 `openssl rand -base64 32` 生成）

### 数据库初始化

```bash
# 运行数据库迁移
npx prisma migrate dev

# （可选）填充示例数据
npm run db:seed
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 种子数据账号

如果运行了 `npm run db:seed`，可使用以下账号登录：

| 邮箱 | 密码 | 说明 |
|------|------|------|
| `alice@example.com` | `password123` | 张氏家族创建者 |
| `bob@example.com` | `password123` | 普通账号 |

---

## 开发命令

```bash
npm run dev          # 启动开发服务器（http://localhost:3000）
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm test             # 运行全部测试（单元 + 集成）
npm run db:migrate   # 运行数据库迁移
npm run db:seed      # 填充示例数据
npm run db:studio    # 打开 Prisma Studio（数据库可视化管理）
```

---

## 项目结构

```
zupu/
├── docs/                    # 各阶段文档
│   ├── 01_prd.md            # 产品需求文档
│   ├── 02_design.md         # 详细设计文档
│   ├── 03_implementation_notes.md
│   ├── 04_unit_tests.md
│   └── 05_integration_tests.md
├── prisma/
│   ├── schema.prisma        # 数据库 schema
│   ├── seed.ts              # 种子数据
│   └── migrations/          # 数据库迁移文件
├── src/
│   ├── app/                 # Next.js 页面和 API Routes
│   ├── components/          # React 组件
│   ├── lib/                 # 工具库（auth、prisma、tree-utils）
│   └── types/               # TypeScript 类型定义
├── tests/
│   ├── unit/                # 单元测试（25 个）
│   └── integration/         # 集成测试（11 个）
├── PLAN.md                  # 总体计划
├── CHANGELOG.md             # 功能变动记录
└── README.md                # 本文件
```

---

## 使用指南

### 创建族谱

1. 注册账号并登录
2. 点击「新建家族」，输入家族名称
3. 进入家族页面，点击「添加成员」录入第一位成员
4. 继续添加更多成员
5. 点击「添加关系」，选择两位成员和关系类型
6. 切换至「树状」视图查看族谱

### 导出数据

进入家族页面 → 点击「数据」按钮 → 选择「导出 JSON」或「导出 CSV」

### 导入数据

进入目标家族页面 → 点击「数据」按钮 → 选择「导入 JSON」→ 选择之前导出的 JSON 文件

---

## 测试

```bash
# 单元测试
npx vitest run tests/unit/

# 集成测试（使用独立测试数据库）
DATABASE_URL="file:/tmp/zupu-test.db" npx vitest run tests/integration/

# 全部测试
npm test
```

当前测试状态：**36/36 通过** ✅

---

## 许可证

MIT
