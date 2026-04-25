import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, handleError } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const q = request.nextUrl.searchParams.get('q') ?? ''
    const families = await prisma.family.findMany({
      where: q ? { name: { contains: q } } : undefined,
      include: { _count: { select: { members: true } }, admins: { select: { userId: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: families })
  } catch (e) {
    return handleError(e)
  }
}
