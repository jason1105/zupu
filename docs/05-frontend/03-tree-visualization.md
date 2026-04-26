# 族谱树可视化设计

**版本**：1.0.0  
**更新日期**：2026-04-26  

---

## 1. 概述

族谱树使用 D3.js v7 将成员和关系数据转换为 SVG 树状图，支持缩放、平移和点击交互。

**文件**：`src/components/tree/FamilyTree.tsx`  
**加载方式**：`dynamic(() => import(...), { ssr: false })`（D3 操作 DOM，不能在服务端执行）

---

## 2. 数据转换（`src/lib/tree-utils.ts`）

### 2.1 buildTree(members, relationships)

将扁平的成员列表和关系列表转换为 D3 可用的树形结构。

**算法**：
1. 建立 `childrenMap`：`parentId → Set<childId>`（来自 `PARENT_CHILD` 关系的 `fromMemberId → toMemberId`）
2. 建立 `spouseMap`：`memberId → Set<spouseId>`（来自 `SPOUSE` 关系）
3. 找出根节点：没有任何人是其父母的成员（不在任何 `childrenMap.values()` 中）
4. 若根节点 > 1，各自独立建树并水平排列
5. 递归构建树，用 `visited: Set<string>` 防止循环关系导致无限递归
6. 配偶作为 `spouses: FamilyMember[]` 附加在节点上，不参与树的层级结构

```typescript
type TreeNode = {
  id: string
  member: FamilyMember
  children: TreeNode[]
  spouses: FamilyMember[]
  x?: number
  y?: number
}
```

### 2.2 flattenTree(root)

将树形结构展平为节点数组（用于 D3 绑定数据）。

### 2.3 getMemberDepth(tree, memberId)

获取指定成员在树中的深度（层级），用于布局调整。

---

## 3. D3 布局

```typescript
const treeLayout = d3.tree<TreeNode>()
  .nodeSize([NODE_WIDTH + H_GAP, NODE_HEIGHT + V_GAP])
```

| 参数 | 值 | 说明 |
|------|-----|------|
| NODE_WIDTH | 120px | 节点宽度 |
| NODE_HEIGHT | 60px | 节点高度 |
| H_GAP | 40px | 水平间距 |
| V_GAP | 40px | 垂直间距 |

根节点在顶部，子代向下展开。

---

## 4. SVG 渲染

### 4.1 容器结构

```
<svg>
  <g transform="translate(...)">   ← zoom/pan 变换组
    <g class="links">              ← 关系连线
      <path> × N                   ← 贝塞尔曲线（亲子）/ 虚线（配偶）
    </g>
    <g class="nodes">              ← 成员节点
      <foreignObject> × N         ← 包裹 React 渲染的节点内容
    </g>
  </g>
</svg>
```

### 4.2 节点内容

每个节点用 `<foreignObject>` 包裹 React div：

```
┌────────────────────┐
│  [头像/性别图标]    │
│  张三              │
│  1950 — 2020       │
│  ⚫ 已故           │
└────────────────────┘
```

- **照片**：圆形头像（`object-cover rounded-full`）
- **无照片**：男性显示蓝色 ♂ 图标，女性显示粉色 ♀ 图标
- **已故**：卡片背景变深，显示已故标记
- **配偶**：在节点右侧以较小尺寸并排显示，虚线横向连接

### 4.3 连线样式

| 关系类型 | 线条样式 |
|---------|---------|
| PARENT_CHILD | 实线，贝塞尔曲线（`d3.linkVertical()`） |
| SPOUSE | 虚线（`stroke-dasharray: 4,4`），水平直线 |

---

## 5. 交互

### 5.1 缩放 / 平移

```typescript
const zoom = d3.zoom<SVGSVGElement, unknown>()
  .scaleExtent([0.1, 3])
  .on('zoom', (event) => {
    g.attr('transform', event.transform)
  })
svg.call(zoom)
```

- 滚轮缩放：0.1x ～ 3x
- 拖拽平移：无限制
- 初始位置：根节点居中

### 5.2 点击节点

点击节点后，在页面右下角显示成员详情面板，包含：
- 头像（大图）
- 姓名、性别、生卒日期
- 在世/已故状态
- 职业、籍贯
- 简介

### 5.3 空状态

无成员时显示提示文字：  
`"暂无成员，请先添加成员再查看族谱树"`

---

## 6. 性能优化

- D3 仅操作 SVG 连线；节点内容通过 React 的 `createRoot` 挂载到 `foreignObject`，复用 React 虚拟 DOM diffing
- 成员数量 < 500 时，一次性全量渲染；超大族谱可考虑虚拟化（当前未实现）
- 使用 `useEffect` 在数据变化时重建树，避免 D3 与 React 状态冲突
