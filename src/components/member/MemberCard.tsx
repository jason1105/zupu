'use client'

import type { FamilyMember } from '@/types'

interface Props {
  member: FamilyMember
  isAdmin: boolean
  onEdit: () => void
  onDelete: () => void
}

const GENDER_ICON: Record<string, string> = { MALE: '♂', FEMALE: '♀', OTHER: '⚥' }
const GENDER_LABEL: Record<string, string> = { MALE: '男', FEMALE: '女', OTHER: '其他' }

function formatYear(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).getFullYear()
}

export default function MemberCard({ member, isAdmin, onEdit, onDelete }: Props) {
  const birthYear = formatYear(member.birthDate)
  const deathYear = formatYear(member.deathDate)

  return (
    <div
      className={`bg-white border rounded-xl p-4 flex gap-3 ${
        member.isAlive ? 'border-stone-200' : 'border-stone-200 opacity-80'
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.name}
            className="w-12 h-12 rounded-full object-cover border border-stone-200"
          />
        ) : (
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-medium border ${
              member.gender === 'MALE'
                ? 'bg-sky-50 border-sky-200 text-sky-600'
                : member.gender === 'FEMALE'
                ? 'bg-pink-50 border-pink-200 text-pink-600'
                : 'bg-stone-100 border-stone-200 text-stone-600'
            }`}
          >
            {GENDER_ICON[member.gender]}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-800 truncate">{member.name}</span>
          {!member.isAlive && (
            <span className="text-xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">已故</span>
          )}
        </div>
        <div className="text-xs text-stone-500 mt-0.5 space-y-0.5">
          <div>
            {GENDER_LABEL[member.gender]}
            {birthYear && ` · ${birthYear}年`}
            {!member.isAlive && deathYear && ` — ${deathYear}年`}
          </div>
          {member.occupation && <div className="truncate">{member.occupation}</div>}
          {member.hometown && <div className="truncate">{member.hometown}</div>}
        </div>
      </div>

      {/* Actions */}
      {isAdmin && (
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="text-xs text-stone-500 hover:text-stone-800 transition-colors"
          >
            编辑
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            删除
          </button>
        </div>
      )}
    </div>
  )
}
