'use client'

import { useState, useEffect, useRef } from 'react'
import Modal from '@/components/ui/Modal'
import JoinRequestForm from './JoinRequestForm'

interface FamilyResult {
  id: string
  name: string
  description: string | null
  _count: { members: number }
  admins: { userId: string }[]
}

interface Props {
  currentUserId: string
}

export default function DiscoverFamilies({ currentUserId }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FamilyResult[]>([])
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState<FamilyResult | null>(null)
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [successMsg, setSuccessMsg] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      searchFamilies(query)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  async function searchFamilies(q: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/families/search?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      if (res.ok) setResults(json.data)
    } finally {
      setLoading(false)
    }
  }

  const visibleResults = results.filter(
    f => !f.admins.some(a => a.userId === currentUserId)
  )

  function handleSuccess() {
    if (applying) {
      setApplied(prev => new Set(prev).add(applying.id))
      setSuccessMsg(`已成功提交加入「${applying.name}」的申请，请等待管理员审核`)
      setApplying(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800">发现家族</h2>
          <p className="text-stone-500 text-sm mt-0.5">搜索并申请加入其他家族</p>
        </div>
      </div>

      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索家族名称…"
        className="w-full border border-stone-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
      />

      {successMsg && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          {successMsg}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-stone-400">搜索中…</p>
      ) : visibleResults.length === 0 ? (
        <p className="text-sm text-stone-400">{query ? '未找到匹配的家族' : '输入关键词搜索家族'}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleResults.map(f => (
            <div
              key={f.id}
              className="bg-white border border-stone-200 rounded-xl p-5 space-y-2"
            >
              <h3 className="text-base font-semibold text-stone-800">{f.name}</h3>
              {f.description && (
                <p className="text-stone-500 text-sm line-clamp-2">{f.description}</p>
              )}
              <p className="text-xs text-stone-400">{f._count.members} 位成员</p>
              <button
                onClick={() => { setApplying(f); setSuccessMsg('') }}
                disabled={applied.has(f.id)}
                className="w-full mt-1 px-4 py-1.5 text-sm border border-amber-500 text-amber-700 rounded-lg hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applied.has(f.id) ? '申请已提交' : '申请加入'}
              </button>
            </div>
          ))}
        </div>
      )}

      {applying && (
        <Modal title="申请加入家族" onClose={() => setApplying(null)}>
          <JoinRequestForm
            familyId={applying.id}
            familyName={applying.name}
            onSuccess={handleSuccess}
            onCancel={() => setApplying(null)}
          />
        </Modal>
      )}
    </div>
  )
}
