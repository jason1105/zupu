import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireFamilyAdmin, requireFamilyCreator, handleError, ApiError } from '@/lib/api-helpers'

type Params = { params: Promise<{ familyId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAuth()
    const { familyId } = await params

    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: {
        admins: { include: { user: { select: { id: true, email: true, name: true } } } },
        members: { orderBy: { name: 'asc' } },
      },
    })

    if (!family) throw new ApiError('家族不存在', 404)

    const relationships = await prisma.relationship.findMany({
      where: { familyId },
    })

    return NextResponse.json({ data: { ...family, relationships } })
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { familyId } = await params
    await requireFamilyAdmin(session.user.id, familyId)

    const { name, description } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: '家族名称为必填项' }, { status: 400 })
    }

    const family = await prisma.family.update({
      where: { id: familyId },
      data: { name: name.trim(), description: description?.trim() || null },
    })

    return NextResponse.json({ data: family })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { familyId } = await params
    await requireFamilyAdmin(session.user.id, familyId)

    const count = await prisma.familyMember.count({ where: { familyId } })
    if (count > 0) {
      return NextResponse.json(
        { error: '请先删除所有成员后再删除家族' },
        { status: 400 }
      )
    }

    await prisma.family.delete({ where: { id: familyId } })
    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    return handleError(err)
  }
}
