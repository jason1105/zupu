'use client'

import { useState } from 'react'
import { CreateJoinRequestInput } from '@/types'

interface Props {
  familyId: string
  familyName: string
  onSuccess: () => void
  onCancel: () => void
}

export default function JoinRequestForm({ familyId, familyName, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<CreateJoinRequestInput>({ realName: '', reason: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const reasonLength = form.reason.trim().length
  const canSubmit = form.realName.trim() && reasonLength >= 20

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/families/${familyId}/join-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? '提交失败')
        return
      }
      onSuccess()
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-stone-500">申请加入「{familyName}」</p>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">真实姓名 *</label>
        <input
          type="text"
          value={form.realName}
          onChange={e => setForm(f => ({ ...f, realName: e.target.value }))}
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="请输入您的真实姓名"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          加入理由 * <span className={`text-xs ${reasonLength < 20 ? 'text-red-500' : 'text-green-600'}`}>({reasonLength}/20+)</span>
        </label>
        <textarea
          value={form.reason}
          onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
          rows={4}
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          placeholder="请详细说明您申请加入的理由（至少20个字）"
          required
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="flex-1 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? '提交中…' : '提交申请'}
        </button>
      </div>
    </form>
  )
}
