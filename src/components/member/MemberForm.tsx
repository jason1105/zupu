'use client'

import { useState } from 'react'
import type { FamilyMember, Gender } from '@/types'

interface Props {
  familyId: string
  initial?: Partial<FamilyMember>
  onSuccess: () => void
  onCancel: () => void
}

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: '男' },
  { value: 'FEMALE', label: '女' },
  { value: 'OTHER', label: '其他' },
]

export default function MemberForm({ familyId, initial, onSuccess, onCancel }: Props) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    gender: (initial?.gender ?? 'MALE') as Gender,
    birthDate: initial?.birthDate ? initial.birthDate.split('T')[0] : '',
    isAlive: initial?.isAlive !== undefined ? initial.isAlive : true,
    deathDate: initial?.deathDate ? initial.deathDate.split('T')[0] : '',
    occupation: initial?.occupation ?? '',
    hometown: initial?.hometown ?? '',
    photoUrl: initial?.photoUrl ?? '',
    bio: initial?.bio ?? '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = isEdit ? `/api/members/${initial!.id}` : `/api/families/${familyId}/members`
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          birthDate: form.birthDate || null,
          deathDate: form.deathDate || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? '操作失败')
        return
      }
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-stone-700 mb-1">
            姓名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            性别 <span className="text-red-500">*</span>
          </label>
          <select
            value={form.gender}
            onChange={(e) => update('gender', e.target.value as Gender)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            {GENDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">生日</label>
          <input
            type="date"
            value={form.birthDate}
            onChange={(e) => update('birthDate', e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isAlive}
              onChange={(e) => update('isAlive', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium text-stone-700">在世</span>
          </label>
        </div>
      </div>

      {!form.isAlive && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">忌日</label>
          <input
            type="date"
            value={form.deathDate}
            onChange={(e) => update('deathDate', e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">职业</label>
          <input
            type="text"
            value={form.occupation}
            onChange={(e) => update('occupation', e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
            placeholder="如：教师、农民"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">籍贯</label>
          <input
            type="text"
            value={form.hometown}
            onChange={(e) => update('hometown', e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
            placeholder="如：湖南省长沙市"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">照片 URL</label>
        <input
          type="url"
          value={form.photoUrl}
          onChange={(e) => update('photoUrl', e.target.value)}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">简介</label>
        <textarea
          rows={2}
          value={form.bio}
          onChange={(e) => update('bio', e.target.value)}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50 font-medium transition-colors"
        >
          {loading ? '保存中…' : isEdit ? '保存修改' : '添加成员'}
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
