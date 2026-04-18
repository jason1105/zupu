'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        setError('邮箱或密码错误')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-1">族谱</h1>
        <p className="text-stone-500 text-sm">传承家族历史，记录每一位先辈</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">邮箱</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">密码</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50 font-medium transition-colors"
        >
          {loading ? '登录中…' : '登录'}
        </button>
      </form>

      <p className="text-center text-stone-500 text-sm mt-6">
        还没有账号？{' '}
        <Link href="/register" className="text-stone-700 font-medium hover:underline">
          立即注册
        </Link>
      </p>
    </div>
  )
}
