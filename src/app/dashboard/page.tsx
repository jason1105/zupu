import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const families = await prisma.family.findMany({
    where: { admins: { some: { userId: session.user.id } } },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">我的家族</h1>
            <p className="text-stone-500 text-sm mt-1">管理您的家族族谱</p>
          </div>
          <Link
            href="/families/new"
            className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors text-sm font-medium"
          >
            + 新建家族
          </Link>
        </div>

        {families.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <div className="text-5xl mb-4">🌳</div>
            <p className="text-lg font-medium">还没有家族</p>
            <p className="text-sm mt-2">
              <Link href="/families/new" className="text-stone-600 hover:underline">
                创建第一个家族
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {families.map((f) => (
              <Link
                key={f.id}
                href={`/families/${f.id}`}
                className="block bg-white border border-stone-200 rounded-xl p-5 hover:shadow-md hover:border-stone-300 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-lg font-semibold text-stone-800 line-clamp-1">{f.name}</h2>
                  <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                    {f.createdById === session.user.id ? '创建者' : '管理员'}
                  </span>
                </div>
                {f.description && (
                  <p className="text-stone-500 text-sm line-clamp-2 mb-3">{f.description}</p>
                )}
                <div className="text-xs text-stone-400">
                  {f._count.members} 位成员
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
