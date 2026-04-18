import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireFamilyAdmin, handleError, ApiError } from '@/lib/api-helpers'
import { Prisma } from '@prisma/client'

type Params = { params: Promise<{ familyId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAuth()
    const { familyId } = await params

    const relationships = await prisma.relationship.findMany({
      where: { familyId },
      include: { fromMember: true, toMember: true },
    })

    return NextResponse.json({ data: relationships })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { familyId } = await params
    await requireFamilyAdmin(session.user.id, familyId)

    const { fromMemberId, toMemberId, type } = await req.json()

    if (!fromMemberId || !toMemberId) throw new ApiError('fromMemberId 和 toMemberId 为必填项', 400)
    if (!['PARENT_CHILD', 'SPOUSE'].includes(type)) throw new ApiError('关系类型无效', 400)
    if (fromMemberId === toMemberId) throw new ApiError('不能与自己建立关系', 400)

    // Verify both members belong to this family
    const members = await prisma.familyMember.findMany({
      where: { id: { in: [fromMemberId, toMemberId] }, familyId },
    })
    if (members.length !== 2) throw new ApiError('成员不属于该家族', 400)

    try {
      const relationship = await prisma.relationship.create({
        data: { familyId, fromMemberId, toMemberId, type },
        include: { fromMember: true, toMember: true },
      })
      return NextResponse.json({ data: relationship }, { status: 201 })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ApiError('该关系已存在', 409)
      }
      throw e
    }
  } catch (err) {
    return handleError(err)
  }
}
