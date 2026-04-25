import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, handleError } from '@/lib/api-helpers'

export async function GET() {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const families = await prisma.family.findMany({
      where: {
        admins: { some: { userId } },
      },
      include: {
        admins: { include: { user: { select: { id: true, email: true, name: true } } } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: families })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { name, description } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: '家族名称为必填项' }, { status: 400 })
    }
    if (!description?.trim()) {
      return NextResponse.json({ error: '家族说明为必填项' }, { status: 400 })
    }

    const family = await prisma.family.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        createdById: session.user.id,
        admins: {
          create: { userId: session.user.id },
        },
      },
      include: {
        admins: { include: { user: { select: { id: true, email: true, name: true } } } },
        _count: { select: { members: true } },
      },
    })

    return NextResponse.json({ data: family }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
