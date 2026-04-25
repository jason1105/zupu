'use client'

import { useEffect, useState, useCallback } from 'react'
import { FamilyJoinRequest } from '@/types'

interface Props {
  familyId: string
}

export default function JoinRequestList({ familyId }: Props) {
  const [requests, setRequests] = useState<FamilyJoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/families/${familyId}/join-requests`)
      const json = await res.json()
      if (res.ok) setRequests(json.data)
    } finally {
      setLoading(false)
    }
  }, [familyId])

  useEffect(() => { loadRequests() }, [loadRequests])

  async function handleAction(requestId: string, action: 'APPROVE' | 'REJECT') {
    setProcessing(requestId)
    try {
      const res = await fetch(`/api/families/${familyId}/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) await loadRequests()
    } finally {
      setProcessing(null)
    }
  }

  const pending = requests.filter(r => r.status === 'PENDING')
  const handled = requests.filter(r => r.status !== 'PENDING')

  if (loading) return <p className="text-sm text-stone-400">加载中…</p>

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-3">待审核 ({pending.length})</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-stone-400">暂无待审核申请</p>
        ) : (
          <div className="space-y-3">
            {pending.map(r => (
              <RequestCard
                key={r.id}
                request={r}
                processing={processing === r.id}
                onAction={action => handleAction(r.id, action)}
              />
            ))}
          </div>
        )}
      </div>

      {handled.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-3">已处理 ({handled.length})</h3>
          <div className="space-y-3">
            {handled.map(r => (
              <RequestCard key={r.id} request={r} processing={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RequestCard({
  request,
  processing,
  onAction,
}: {
  request: FamilyJoinRequest
  processing: boolean
  onAction?: (action: 'APPROVE' | 'REJECT') => void
}) {
  const statusLabel: Record<string, string> = {
    PENDING: '待审核',
    APPROVED: '已批准',
    REJECTED: '已拒绝',
  }
  const statusColor: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  }

  return (
    <div className="border border-stone-200 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-stone-800">{request.realName}</p>
          <p className="text-xs text-stone-400">{request.user?.email} · {new Date(request.createdAt).toLocaleDateString('zh-CN')}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[request.status]}`}>
          {statusLabel[request.status]}
        </span>
      </div>
      <p className="text-sm text-stone-600 whitespace-pre-wrap">{request.reason}</p>
      {request.status === 'PENDING' && onAction && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onAction('APPROVE')}
            disabled={processing}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            批准
          </button>
          <button
            onClick={() => onAction('REJECT')}
            disabled={processing}
            className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            拒绝
          </button>
        </div>
      )}
    </div>
  )
}
