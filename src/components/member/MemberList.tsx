'use client'

import { useState } from 'react'
import type { FamilyMember } from '@/types'
import MemberCard from './MemberCard'

interface Props {
  members: FamilyMember[]
  isAdmin: boolean
  onEdit: (member: FamilyMember) => void
  onDelete: (memberId: string) => void
}

const GENDER_LABEL: Record<string, string> = { MALE: '男', FEMALE: '女', OTHER: '其他' }

export default function MemberList({ members, isAdmin, onEdit, onDelete }: Props) {
  const [filter, setFilter] = useState('')
  const [aliveFilter, setAliveFilter] = useState<'all' | 'alive' | 'deceased'>('all')

  const filtered = members.filter((m) => {
    const matchName = !filter || m.name.includes(filter)
    const matchAlive =
      aliveFilter === 'all' ||
      (aliveFilter === 'alive' && m.isAlive) ||
      (aliveFilter === 'deceased' && !m.isAlive)
    return matchName && matchAlive
  })

  return (
    <div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="按姓名筛选…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <select
          value={aliveFilter}
          onChange={(e) => setAliveFilter(e.target.value as typeof aliveFilter)}
          className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        >
          <option value="all">全部</option>
          <option value="alive">在世</option>
          <option value="deceased">已故</option>
        </select>
        <span className="text-stone-400 text-sm self-center">共 {filtered.length} 人</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((m) => (
          <MemberCard
            key={m.id}
            member={m}
            isAdmin={isAdmin}
            onEdit={() => onEdit(m)}
            onDelete={() => onDelete(m.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-10 text-stone-400 text-sm">
            没有符合条件的成员
          </div>
        )}
      </div>
    </div>
  )
}
