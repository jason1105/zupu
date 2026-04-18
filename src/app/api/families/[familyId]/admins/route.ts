import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireFamilyCreator, handleError, ApiError } from '@/lib/api-helpers'
import { Prisma } from '@prisma/client'

type Params = { params: Promise<{ familyId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAuth()
    const { familyId } = await params

    const admins = await prisma.familyAdmin.findMany({
      where: { familyId },
      include: { user: { select: { id: true, email: true, name: true } } },
    })

    return NextResponse.json({ data: admins })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { familyId } = await params
    await requireFamilyCreator(session.user.id, familyId)

    const { email } = await req.json()
    if (!email?.trim()) throw new ApiError('邮箱为必填项', 400)

    const targetUser = await prisma.user.findUnique({ where: { email: email.trim() } })
    if (!targetUser) throw new ApiError('该邮箱对应的用户不存在', 404)

    try {
      const admin = await prisma.familyAdmin.create({
        data: { userId: targetUser.id, familyId },
        include: { user: { select: { id: true, email: true, name: true } } },
      })
      return NextResponse.json({ data: admin }, { status: 201 })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ApiError('该用户已是管理员', 409)
      }
      throw e
    }
  } catch (err) {
    return handleError(err)
  }
}
