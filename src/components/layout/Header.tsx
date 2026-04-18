'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session) return null

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-stone-800 tracking-tight">
          族谱
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors ${
              pathname === '/dashboard' ? 'text-stone-900' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            我的家族
          </Link>
          <Link
            href="/families/new"
            className="text-sm px-3 py-1.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
          >
            + 新建家族
          </Link>
          <span className="text-stone-400 text-sm">|</span>
          <span className="text-sm text-stone-600">{session.user.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
          >
            退出
          </button>
        </nav>
      </div>
    </header>
  )
}
