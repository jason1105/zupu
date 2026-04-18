'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import type { Family, FamilyAdmin } from '@/types'

export default function FamilySettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const familyId = params.familyId as string

  const [family, setFamily] = useState<Family | null>(null)
  const [admins, setAdmins] = useState<FamilyAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [adminError, setAdminError] = useState('')

  const isCreator = session?.user?.id && family?.createdById === session.user.id

  async function load() {
    const [fRes, aRes] = await Promise.all([
      fetch(`/api/families/${familyId}`),
      fetch(`/api/families/${familyId}/admins`),
    ])
    if (fRes.status === 401) { router.push('/login'); return }
    const fJson = await fRes.json()
    const aJson = await aRes.json()
    setFamily(fJson.data)
    setName(fJson.data.name)
    setDescription(fJson.data.description ?? '')
    setAdmins(aJson.data)
    setLoading(false)
  }

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') load()
  }, [status])

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault()
    setEditError('')
    setEditSuccess('')
    const res = await fetch(`/api/families/${familyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })
    const json = await res.json()
    if (!res.ok) { setEditError(json.error); return }
    setEditSuccess('保存成功')
    load()
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault()
    setAdminError('')
    const res = await fetch(`/api/families/${familyId}/admins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newAdminEmail }),
    })
    const json = await res.json()
    if (!res.ok) { setAdminError(json.error); return }
    setNewAdminEmail('')
    load()
  }

  async function handleRemoveAdmin(userId: string) {
    if (!confirm('确认移除该管理员？')) return
    const res = await fetch(`/api/families/${familyId}/admins/${userId}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { alert(json.error); return }
    load()
  }

  if (loading) return (
    <>
      <Header />
      <div className="flex items-center justify-center min-h-64 text-stone-400 text-sm">加载中…</div>
    </>
  )

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link href={`/families/${familyId}`} className="text-sm text-stone-500 hover:text-stone-800 mb-6 inline-block">
          ← 返回族谱
        </Link>
        <h1 className="text-2xl font-bold text-stone-800 mb-6">家族设置</h1>

        {/* Basic info */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-4">
          <h2 className="font-semibold text-stone-700 mb-4">基本信息</h2>
          <form onSubmit={handleSaveInfo} className="space-y-3">
            {editError && <p className="text-red-600 text-sm">{editError}</p>}
            {editSuccess && <p className="text-green-600 text-sm">{editSuccess}</p>}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">家族名称</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">家族简介</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-700 transition-colors"
            >
              保存
            </button>
          </form>
        </div>

        {/* Admin management */}
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <h2 className="font-semibold text-stone-700 mb-4">管理员</h2>
          <div className="space-y-2 mb-4">
            {admins.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <div>
                  <span className="font-medium text-stone-800">{a.user?.name}</span>
                  <span className="text-stone-400 text-sm ml-2">{a.user?.email}</span>
                  {a.userId === family?.createdById && (
                    <span className="ml-2 text-xs bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">创建者</span>
                  )}
                </div>
                {isCreator && a.userId !== family?.createdById && (
                  <button
                    onClick={() => handleRemoveAdmin(a.userId)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    移除
                  </button>
                )}
              </div>
            ))}
          </div>

          {isCreator && (
            <form onSubmit={handleAddAdmin} className="flex gap-2">
              {adminError && <p className="text-red-600 text-sm col-span-full">{adminError}</p>}
              <input
                type="email"
                placeholder="输入用户邮箱"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-700 transition-colors"
              >
                添加管理员
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  )
}
