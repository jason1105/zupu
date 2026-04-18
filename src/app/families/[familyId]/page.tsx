'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Header from '@/components/layout/Header'
import MemberList from '@/components/member/MemberList'
import MemberForm from '@/components/member/MemberForm'
import RelationshipForm from '@/components/relationship/RelationshipForm'
import Modal from '@/components/ui/Modal'
import type { Family, FamilyMember, Relationship } from '@/types'

// FamilyTree uses D3 which is client-only, so we use dynamic import
const FamilyTree = dynamic(() => import('@/components/tree/FamilyTree'), { ssr: false })

type View = 'tree' | 'list'

export default function FamilyDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const familyId = params.familyId as string

  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('tree')

  const [modal, setModal] = useState<
    null | 'addMember' | 'editMember' | 'addRelationship' | 'importConfirm'
  >(null)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)

  const isAdmin =
    session?.user?.id &&
    family?.admins?.some((a) => a.userId === session.user.id) === true

  const load = useCallback(async () => {
    const res = await fetch(`/api/families/${familyId}`)
    if (res.status === 401) { router.push('/login'); return }
    if (!res.ok) { router.push('/dashboard'); return }
    const json = await res.json()
    setFamily(json.data)
    setMembers(json.data.members ?? [])
    setRelationships(json.data.relationships ?? [])
    setLoading(false)
  }, [familyId, router])

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') load()
  }, [status, load, router])

  async function handleDeleteMember(memberId: string) {
    if (!confirm('确认删除该成员？相关关系记录也将一并删除。')) return
    const res = await fetch(`/api/members/${memberId}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  async function handleDeleteRelationship(relId: string) {
    await fetch(`/api/relationships/${relId}`, { method: 'DELETE' })
    load()
  }

  function handleExport(format: 'json' | 'csv') {
    window.location.href = `/api/families/${familyId}/export?format=${format}`
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      alert('文件格式错误，请选择有效的 JSON 文件')
      return
    }
    const res = await fetch(`/api/families/${familyId}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) {
      alert(json.error ?? '导入失败')
      return
    }
    alert(`导入成功：${json.data.membersCreated} 位成员，${json.data.relationshipsCreated} 条关系`)
    load()
  }

  if (loading || !family) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-64 text-stone-400 text-sm">
          加载中…
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
        {/* Top bar */}
        <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-4 flex-shrink-0">
          <Link href="/dashboard" className="text-stone-400 hover:text-stone-700 text-sm">
            ← 返回
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-stone-800">{family.name}</h1>
            {family.description && (
              <p className="text-stone-500 text-xs mt-0.5">{family.description}</p>
            )}
          </div>

          {/* View toggle */}
          <div className="flex bg-stone-100 rounded-lg p-0.5 text-sm">
            {(['tree', 'list'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  view === v ? 'bg-white shadow-sm text-stone-800 font-medium' : 'text-stone-500'
                }`}
              >
                {v === 'tree' ? '🌳 树状' : '📋 列表'}
              </button>
            ))}
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => setModal('addMember')}
                className="px-3 py-1.5 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-700 transition-colors"
              >
                + 添加成员
              </button>
              <button
                onClick={() => setModal('addRelationship')}
                className="px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg text-sm hover:bg-stone-50 transition-colors"
              >
                + 添加关系
              </button>
              <div className="relative group">
                <button className="px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg text-sm hover:bg-stone-50 transition-colors">
                  数据 ▾
                </button>
                <div className="absolute right-0 top-8 hidden group-hover:flex flex-col bg-white border border-stone-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                  <button
                    onClick={() => handleExport('json')}
                    className="px-3 py-2 text-sm text-left hover:bg-stone-50 transition-colors"
                  >
                    导出 JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="px-3 py-2 text-sm text-left hover:bg-stone-50 transition-colors"
                  >
                    导出 CSV
                  </button>
                  <label className="px-3 py-2 text-sm text-left hover:bg-stone-50 cursor-pointer transition-colors">
                    导入 JSON
                    <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                  </label>
                </div>
              </div>
              <Link
                href={`/families/${familyId}/settings`}
                className="px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg text-sm hover:bg-stone-50 transition-colors"
              >
                设置
              </Link>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view === 'tree' ? (
            <div className="w-full h-full">
              <FamilyTree members={members} relationships={relationships} />
            </div>
          ) : (
            <div className="overflow-y-auto h-full p-4">
              <MemberList
                members={members}
                isAdmin={!!isAdmin}
                onEdit={(m) => { setEditingMember(m); setModal('editMember') }}
                onDelete={handleDeleteMember}
              />

              {/* Relationships section */}
              {relationships.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-base font-semibold text-stone-700 mb-3">关系记录</h2>
                  <div className="space-y-2">
                    {relationships.map((r) => {
                      const from = members.find((m) => m.id === r.fromMemberId)
                      const to = members.find((m) => m.id === r.toMemberId)
                      return (
                        <div
                          key={r.id}
                          className="flex items-center gap-3 bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm"
                        >
                          <span className="font-medium">{from?.name ?? '—'}</span>
                          <span className="text-stone-400">
                            {r.type === 'PARENT_CHILD' ? '→（亲子）→' : '↔（夫妻）↔'}
                          </span>
                          <span className="font-medium">{to?.name ?? '—'}</span>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteRelationship(r.id)}
                              className="ml-auto text-xs text-red-400 hover:text-red-600 transition-colors"
                            >
                              删除
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {modal === 'addMember' && (
        <Modal title="添加成员" onClose={() => setModal(null)}>
          <MemberForm
            familyId={familyId}
            onSuccess={() => { setModal(null); load() }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal === 'editMember' && editingMember && (
        <Modal title="编辑成员" onClose={() => setModal(null)}>
          <MemberForm
            familyId={familyId}
            initial={editingMember}
            onSuccess={() => { setModal(null); setEditingMember(null); load() }}
            onCancel={() => { setModal(null); setEditingMember(null) }}
          />
        </Modal>
      )}

      {modal === 'addRelationship' && (
        <Modal title="建立关系" onClose={() => setModal(null)}>
          <RelationshipForm
            familyId={familyId}
            members={members}
            onSuccess={() => { setModal(null); load() }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </>
  )
}
