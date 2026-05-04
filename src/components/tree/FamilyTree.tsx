'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import type { FamilyMember, Relationship, TreeNode } from '@/types'
import { buildTree, flattenTree } from '@/lib/tree-utils'

interface Props {
  members: FamilyMember[]
  relationships: Relationship[]
  onSelectMember?: (member: FamilyMember) => void
}

// Layout constants
const NODE_W = 140
const NODE_H = 70
const H_GAP = 180
const V_GAP = 120
const SPOUSE_OFFSET = 160

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

  // Use D3 hierarchy for each root, then offset horizontally
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

      // Parent → Child edges
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

  // Spouse edges: connect main node to each spouse node (lateral)
  nodes.forEach((node) => {
    node.spouses.forEach((spouse, idx) => {
      const spouseX = node.x + SPOUSE_OFFSET * (idx + 1)
      // Add spouse as a visual node
      nodes.push({ id: `spouse-${node.id}-${spouse.id}`, member: spouse, x: spouseX, y: node.y, spouses: [] })
      edges.push({ x1: node.x + NODE_W / 2, y1: node.y, x2: spouseX - NODE_W / 2, y2: node.y, type: 'spouse' })
    })
  })

  return { nodes, edges }
}

function NodeBox({
  node,
  onClick,
}: {
  node: LayoutNode
  onClick: (m: FamilyMember) => void
}) {
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
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const roots = buildTree(members, relationships)
  const { nodes, edges } = computeLayout(roots)

  const handleSelect = useCallback(
    (m: FamilyMember) => {
      setSelectedMember(m)
      onSelectMember?.(m)
    },
    [onSelectMember]
  )

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return

    const svg = d3.select(svgEl)
    const canvas = svgEl.querySelector('g.canvas') as SVGGElement | null
    if (!canvas) return

    // Current transform state (shared between D3 and touch handlers)
    let xform = d3.zoomIdentity

    const applyTransform = (t: d3.ZoomTransform) => {
      xform = t
      canvas.setAttribute('transform', `translate(${t.x},${t.y}) scale(${t.k})`)
    }

    // D3 zoom for desktop (mouse wheel + drag) — touch events filtered out
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .filter((e) => !e.type.startsWith('touch'))
      .on('zoom', (event) => applyTransform(event.transform))

    svg.call(zoom)

    // Initial centering via ResizeObserver
    let centered = false
    const centerTree = () => {
      if (centered) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0 || nodes.length === 0) return
      centered = true
      const minX = Math.min(...nodes.map((n) => n.x)) - NODE_W / 2
      const maxX = Math.max(...nodes.map((n) => n.x)) + NODE_W / 2
      const minY = Math.min(...nodes.map((n) => n.y)) - NODE_H / 2
      const maxY = Math.max(...nodes.map((n) => n.y)) + NODE_H / 2
      const treeW = maxX - minX
      const treeH = maxY - minY
      const k = Math.min(1, rect.width / (treeW + 80), rect.height / (treeH + 80))
      const tx = (rect.width - treeW * k) / 2 - minX * k
      const ty = (rect.height - treeH * k) / 2 - minY * k
      const t = d3.zoomIdentity.translate(tx, ty).scale(k)
      applyTransform(t)
      svg.call(zoom.transform, t) // sync D3 internal state for wheel zoom
    }

    const ro = new ResizeObserver(centerTree)
    if (containerRef.current) ro.observe(containerRef.current)

    // Manual touch handling for iOS — bypasses D3 zoom entirely for touch
    const touch = { x: 0, y: 0, dist: 0 }

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 1) {
        touch.x = e.touches[0].clientX
        touch.y = e.touches[0].clientY
      } else if (e.touches.length === 2) {
        touch.x = (e.touches[0].clientX + e.touches[1].clientX) / 2
        touch.y = (e.touches[0].clientY + e.touches[1].clientY) / 2
        touch.dist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        )
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touch.x
        const dy = e.touches[0].clientY - touch.y
        touch.x = e.touches[0].clientX
        touch.y = e.touches[0].clientY
        const t = d3.zoomIdentity.translate(xform.x + dx, xform.y + dy).scale(xform.k)
        applyTransform(t)
      } else if (e.touches.length === 2) {
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2
        const dist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY
        )
        const ratio = dist / touch.dist
        const svgRect = svgEl.getBoundingClientRect()
        const lx = mx - svgRect.left   // local coords within SVG
        const ly = my - svgRect.top
        const newK = Math.min(3, Math.max(0.1, xform.k * ratio))
        const newTx = lx - newK * ((lx - xform.x) / xform.k)
        const newTy = ly - newK * ((ly - xform.y) / xform.k)
        touch.x = mx
        touch.y = my
        touch.dist = dist
        const t = d3.zoomIdentity.translate(newTx, newTy).scale(newK)
        applyTransform(t)
      }
    }

    const onTouchEnd = () => {
      // Sync D3's internal zoom state so subsequent wheel zoom works correctly
      svg.call(zoom.transform, xform)
    }

    svgEl.addEventListener('touchstart', onTouchStart, { passive: false })
    svgEl.addEventListener('touchmove', onTouchMove, { passive: false })
    svgEl.addEventListener('touchend', onTouchEnd, { passive: false })

    return () => {
      ro.disconnect()
      svg.on('.zoom', null)
      svgEl.removeEventListener('touchstart', onTouchStart)
      svgEl.removeEventListener('touchmove', onTouchMove)
      svgEl.removeEventListener('touchend', onTouchEnd)
    }
  }, [nodes.length])

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400 text-sm">
        暂无成员，请先添加成员再查看族谱树
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>
      <svg ref={svgRef} width="100%" height="100%" className="bg-stone-50" style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#a8a29e" />
          </marker>
        </defs>
        <g className="canvas">
          {/* Edges */}
          {edges.map((e, i) => (
            <line
              key={i}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke={e.type === 'spouse' ? '#d6d3d1' : '#a8a29e'}
              strokeWidth={e.type === 'spouse' ? 1.5 : 1.5}
              strokeDasharray={e.type === 'spouse' ? '5,4' : undefined}
            />
          ))}
          {/* Nodes */}
          {nodes.map((node) => (
            <NodeBox key={node.id} node={node} onClick={handleSelect} />
          ))}
          {/* Transparent hit areas for click — foreignObject has pointerEvents:none on iOS */}
          {nodes.map((node) => (
            <rect
              key={`hit-${node.id}`}
              x={node.x - NODE_W / 2}
              y={node.y - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              fill="transparent"
              style={{ cursor: 'pointer', pointerEvents: 'all' }}
              onClick={() => handleSelect(node.member)}
            />
          ))}
        </g>
      </svg>

      {/* Selected member detail panel */}
      {selectedMember && (
        <div className="absolute bottom-4 right-4 bg-white border border-stone-200 rounded-xl shadow-lg p-4 w-56 text-sm">
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

      <div className="absolute bottom-4 left-4 text-xs text-stone-400">
        双指缩放 · 拖拽平移 · 点击成员查看详情
      </div>
    </div>
  )
}
