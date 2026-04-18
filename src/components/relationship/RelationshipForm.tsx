'use client'

import { useState } from 'react'
import type { FamilyMember, RelationshipType } from '@/types'

interface Props {
  familyId: string
  members: FamilyMember[]
  onSuccess: () => void
  onCancel: () => void
}

const REL_OPTIONS: { value: RelationshipType; label: string; desc: string }[] = [
  { value: 'PARENT_CHILD', label: '亲子关系', desc: '第一人 → 第二人（父/母 → 子/女）' },
  { value: 'SPOUSE', label: '夫妻关系', desc: '两人互为配偶' },
]

export default function RelationshipForm({ familyId, members, onSuccess, onCancel }: Props) {
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [type, setType] = useState<RelationshipType>('PARENT_CHILD')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!fromId || !toId) {
      setError('请选择两位成员')
      return
    }
    if (fromId === toId) {
      setError('不能与自己建立关系')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/families/${familyId}/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromMemberId: fromId, toMemberId: toId, type }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? '创建失败')
        return
      }
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  const selectedType = REL_OPTIONS.find((o) => o.value === type)!

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">关系类型</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as RelationshipType)}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
        >
          {REL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <p className="text-xs text-stone-500 mt-1">{selectedType.desc}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            {type === 'PARENT_CHILD' ? '父/母' : '第一人'}
          </label>
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <option value="">请选择…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            {type === 'PARENT_CHILD' ? '子/女' : '第二人'}
          </label>
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <option value="">请选择…</option>
            {members.filter((m) => m.id !== fromId).map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50 font-medium transition-colors"
        >
          {loading ? '创建中…' : '建立关系'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  )
}
