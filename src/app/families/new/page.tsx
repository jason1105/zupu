'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewFamilyPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? '创建失败')
        return
      }
      router.push(`/families/${json.data.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-lg mx-auto px-4 py-12">
        <Link href="/dashboard" className="text-sm text-stone-500 hover:text-stone-800 mb-6 inline-block">
          ← 返回
        </Link>
        <h1 className="text-2xl font-bold text-stone-800 mb-6">新建家族</h1>

        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                家族名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                placeholder="如：张氏家族"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">家族简介</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
                placeholder="可选，简短描述家族来源或特色"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50 font-medium transition-colors"
              >
                {loading ? '创建中…' : '创建家族'}
              </button>
              <Link
                href="/dashboard"
                className="px-4 py-2.5 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors text-center"
              >
                取消
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
