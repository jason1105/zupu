import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireFamilyAdmin, handleError, ApiError } from '@/lib/api-helpers'

type Params = { params: Promise<{ memberId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAuth()
    const { memberId } = await params

    const member = await prisma.familyMember.findUnique({ where: { id: memberId } })
    if (!member) throw new ApiError('成员不存在', 404)

    const relationships = await prisma.relationship.findMany({
      where: { OR: [{ fromMemberId: memberId }, { toMemberId: memberId }] },
      include: {
        fromMember: true,
        toMember: true,
      },
    })

    return NextResponse.json({ data: { ...member, relationships } })
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { memberId } = await params

    const existing = await prisma.familyMember.findUnique({ where: { id: memberId } })
    if (!existing) throw new ApiError('成员不存在', 404)

    await requireFamilyAdmin(session.user.id, existing.familyId)

    const body = await req.json()
    const { name, gender, birthDate, deathDate, isAlive, occupation, hometown, photoUrl, bio } = body

    if (!name?.trim()) throw new ApiError('姓名为必填项', 400)
    if (!['MALE', 'FEMALE', 'OTHER'].includes(gender)) throw new ApiError('性别值无效', 400)

    const member = await prisma.familyMember.update({
      where: { id: memberId },
      data: {
        name: name.trim(),
        gender,
        birthDate: birthDate ? new Date(birthDate) : null,
        deathDate: deathDate ? new Date(deathDate) : null,
        isAlive: Boolean(isAlive),
        occupation: occupation?.trim() || null,
        hometown: hometown?.trim() || null,
        photoUrl: photoUrl?.trim() || null,
        bio: bio?.trim() || null,
      },
    })

    return NextResponse.json({ data: member })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { memberId } = await params

    const existing = await prisma.familyMember.findUnique({ where: { id: memberId } })
    if (!existing) throw new ApiError('成员不存在', 404)

    await requireFamilyAdmin(session.user.id, existing.familyId)

    await prisma.familyMember.delete({ where: { id: memberId } })
    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    return handleError(err)
  }
}
