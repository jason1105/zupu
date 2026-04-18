'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('两次输入的密码不一致')
      return
    }
    if (form.password.length < 8) {
      setError('密码至少需要 8 位')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? '注册失败')
        return
      }
      router.push('/login?registered=1')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-1">创建账号</h1>
        <p className="text-stone-500 text-sm">加入族谱，开始记录您的家族历史</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {[
          { label: '姓名', field: 'name', type: 'text', placeholder: '您的姓名' },
          { label: '邮箱', field: 'email', type: 'email', placeholder: 'your@email.com' },
          { label: '密码', field: 'password', type: 'password', placeholder: '至少 8 位' },
          { label: '确认密码', field: 'confirm', type: 'password', placeholder: '再次输入密码' },
        ].map(({ label, field, type, placeholder }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
            <input
              type={type}
              required
              value={form[field as keyof typeof form]}
              onChange={(e) => update(field, e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              placeholder={placeholder}
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50 font-medium transition-colors"
        >
          {loading ? '注册中…' : '创建账号'}
        </button>
      </form>

      <p className="text-center text-stone-500 text-sm mt-6">
        已有账号？{' '}
        <Link href="/login" className="text-stone-700 font-medium hover:underline">
          立即登录
        </Link>
      </p>
    </div>
  )
}
