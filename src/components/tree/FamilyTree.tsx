'use client'

import { useState, useCallback } from 'react'
import * as d3 from 'd3'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { FamilyMember, Relationship, TreeNode } from '@/types'
import { buildTree } from '@/lib/tree-utils'

interface Props {
  members: FamilyMember[]
  relationships: Relationship[]
  onSelectMember?: (member: FamilyMember) => void
}

const NODE_W = 140
const NODE_H = 70
const H_GAP = 180
const V_GAP = 120
const SPOUSE_OFFSET = 160
const PADDING = 40

interface LayoutNode {
  id: string
  member: FamilyMember
  x: number
  y: number
  spouses: FamilyMember[]
}

interface LayoutEdge {
  x1: number; y1: number; x2: number; y2: number; type: 'parent' | 'spouse'
}

function computeLayout(roots: TreeNode[]): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const nodes: LayoutNode[] = []
  const edges: LayoutEdge[] = []
  let xOffset = 0

  for (const root of roots) {
    const hierarchy = d3.hierarchy<TreeNode>(root, (d) => d.children)
    const treeLayout = d3.tree<TreeNode>().nodeSize([H_GAP, V_GAP])
    treeLayout(hierarchy)

    const hierarchyNodes = hierarchy.descendants()
    const minX = Math.min(...hierarchyNodes.map((n) => n.x ?? 0))

    hierarchyNodes.forEach((n) => {
      const x = (n.x ?? 0) - minX + xOffset
      const y = (n.y ?? 0)
      nodes.push({ id: n.data.id, member: n.data.member, x, y, spouses: n.data.spouses })

      if (n.parent) {
        edges.push({
          x1: (n.parent.x ?? 0) - minX + xOffset,
          y1: (n.parent.y ?? 0) + NODE_H / 2,
          x2: x,
          y2: y - NODE_H / 2,
          type: 'parent',
        })
      }
    })

    const maxX = Math.max(...hierarchyNodes.map((n) => (n.x ?? 0) - minX + xOffset))
    xOffset = maxX + H_GAP * 2
  }

  nodes.forEach((node) => {
    node.spouses.forEach((spouse, idx) => {
      const spouseX = node.x + SPOUSE_OFFSET * (idx + 1)
      nodes.push({ id: `spouse-${node.id}-${spouse.id}`, member: spouse, x: spouseX, y: node.y, spouses: [] })
      edges.push({ x1: node.x + NODE_W / 2, y1: node.y, x2: spouseX - NODE_W / 2, y2: node.y, type: 'spouse' })
    })
  })

  return { nodes, edges }
}

function NodeBox({ node }: { node: LayoutNode }) {
  const m = node.member
  const isDeceased = !m.isAlive
  const genderColor =
    m.gender === 'MALE' ? '#bae6fd' : m.gender === 'FEMALE' ? '#fbcfe8' : '#e7e5e4'
  const borderColor =
    m.gender === 'MALE' ? '#7dd3fc' : m.gender === 'FEMALE' ? '#f9a8d4' : '#d6d3d1'

  return (
    <foreignObject
      x={node.x - NODE_W / 2}
      y={node.y - NODE_H / 2}
      width={NODE_W}
      height={NODE_H}
      style={{ overflow: 'visible', pointerEvents: 'none' }}
    >
      <div
        style={{
          width: NODE_W,
          height: NODE_H,
          background: isDeceased ? '#f5f5f4' : genderColor,
          border: `1.5px solid ${isDeceased ? '#a8a29e' : borderColor}`,
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px 8px',
          boxSizing: 'border-box',
          opacity: isDeceased ? 0.75 : 1,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {m.photoUrl && (
          <img
            src={m.photoUrl}
            alt={m.name}
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', marginBottom: 2 }}
          />
        )}
        <div style={{ fontWeight: 600, fontSize: 13, color: '#1c1917', textAlign: 'center', lineHeight: 1.3 }}>
          {m.name}
        </div>
        <div style={{ fontSize: 10, color: '#78716c', marginTop: 2, textAlign: 'center' }}>
          {m.gender === 'MALE' ? '男' : m.gender === 'FEMALE' ? '女' : ''}
          {m.birthDate ? ` · ${new Date(m.birthDate).getFullYear()}` : ''}
          {isDeceased ? ' (已故)' : ''}
        </div>
      </div>
    </foreignObject>
  )
}

export default function FamilyTree({ members, relationships, onSelectMember }: Props) {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)

  const roots = buildTree(members, relationships)
  const { nodes, edges } = computeLayout(roots)

  const handleSelect = useCallback(
    (m: FamilyMember) => {
      setSelectedMember(m)
      onSelectMember?.(m)
    },
    [onSelectMember]
  )

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400 text-sm">
        暂无成员，请先添加成员再查看族谱树
      </div>
    )
  }

  // Bounding box of the tree content
  const minX = Math.min(...nodes.map((n) => n.x)) - NODE_W / 2 - PADDING
  const maxX = Math.max(...nodes.map((n) => n.x)) + NODE_W / 2 + PADDING
  const minY = Math.min(...nodes.map((n) => n.y)) - NODE_H / 2 - PADDING
  const maxY = Math.max(...nodes.map((n) => n.y)) + NODE_H / 2 + PADDING
  const svgW = maxX - minX
  const svgH = maxY - minY

  return (
    <div className="relative w-full h-full overflow-hidden bg-stone-50" style={{ touchAction: 'none' }}>
      <TransformWrapper
        minScale={0.1}
        maxScale={3}
        initialScale={1}
        centerOnInit={true}
        limitToBounds={false}
        wheel={{ step: 0.1 }}
        doubleClick={{ disabled: true }}
        panning={{ velocityDisabled: true }}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ width: svgW, height: svgH }}
        >
          <svg
            width={svgW}
            height={svgH}
            viewBox={`${minX} ${minY} ${svgW} ${svgH}`}
            style={{ display: 'block' }}
          >
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#a8a29e" />
              </marker>
            </defs>
            {edges.map((e, i) => (
              <line
                key={i}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke={e.type === 'spouse' ? '#d6d3d1' : '#a8a29e'}
                strokeWidth={1.5}
                strokeDasharray={e.type === 'spouse' ? '5,4' : undefined}
              />
            ))}
            {nodes.map((node) => (
              <NodeBox key={node.id} node={node} />
            ))}
            {nodes.map((node) => (
              <rect
                key={`hit-${node.id}`}
                x={node.x - NODE_W / 2}
                y={node.y - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={() => handleSelect(node.member)}
              />
            ))}
          </svg>
        </TransformComponent>
      </TransformWrapper>

      {selectedMember && (
        <div className="absolute bottom-4 right-4 bg-white border border-stone-200 rounded-xl shadow-lg p-4 w-56 text-sm z-10">
          <button
            onClick={() => setSelectedMember(null)}
            className="absolute top-2 right-2 text-stone-400 hover:text-stone-700 text-lg leading-none"
          >
            ×
          </button>
          {selectedMember.photoUrl && (
            <img
              src={selectedMember.photoUrl}
              alt={selectedMember.name}
              className="w-14 h-14 rounded-full object-cover mx-auto mb-2 border border-stone-200"
            />
          )}
          <div className="font-semibold text-stone-800 text-center">{selectedMember.name}</div>
          <div className="text-stone-500 text-xs text-center mt-1 space-y-0.5">
            {selectedMember.birthDate && (
              <div>生于 {selectedMember.birthDate.split('T')[0]}</div>
            )}
            {!selectedMember.isAlive && selectedMember.deathDate && (
              <div>殁于 {selectedMember.deathDate.split('T')[0]}</div>
            )}
            {selectedMember.occupation && <div>{selectedMember.occupation}</div>}
            {selectedMember.hometown && <div>{selectedMember.hometown}</div>}
            {selectedMember.bio && <div className="mt-1 text-left">{selectedMember.bio}</div>}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 text-xs text-stone-400 pointer-events-none">
        双指缩放 · 拖拽平移 · 点击成员查看详情
      </div>
    </div>
  )
}
