import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireFamilyAdmin, handleError, ApiError } from '@/lib/api-helpers'

type Params = { params: Promise<{ familyId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAuth()
    const { familyId } = await params

    const members = await prisma.familyMember.findMany({
      where: { familyId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: members })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { familyId } = await params
    await requireFamilyAdmin(session.user.id, familyId)

    const body = await req.json()
    const { name, gender, birthDate, deathDate, isAlive, occupation, hometown, photoUrl, bio } = body

    if (!name?.trim()) throw new ApiError('姓名为必填项', 400)
    if (!['MALE', 'FEMALE', 'OTHER'].includes(gender)) throw new ApiError('性别值无效', 400)

    const member = await prisma.familyMember.create({
      data: {
        familyId,
        name: name.trim(),
        gender,
        birthDate: birthDate ? new Date(birthDate) : null,
        deathDate: deathDate ? new Date(deathDate) : null,
        isAlive: isAlive !== undefined ? Boolean(isAlive) : true,
        occupation: occupation?.trim() || null,
        hometown: hometown?.trim() || null,
        photoUrl: photoUrl?.trim() || null,
        bio: bio?.trim() || null,
      },
    })

    return NextResponse.json({ data: member }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
