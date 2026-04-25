import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireFamilyAdmin, handleError, ApiError } from '@/lib/api-helpers'

export async function GET(request: NextRequest, { params }: { params: Promise<{ familyId: string }> }) {
  try {
    const session = await requireAuth()
    const { familyId } = await params
    await requireFamilyAdmin(session.user.id, familyId)
    const requests = await prisma.familyJoinRequest.findMany({
      where: { familyId },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: requests })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ familyId: string }> }) {
  try {
    const session = await requireAuth()
    const { familyId } = await params
    const userId = session.user.id

    const isAdmin = await prisma.familyAdmin.findUnique({
      where: { userId_familyId: { userId, familyId } },
    })
    if (isAdmin) throw new ApiError('您已是该家族管理员', 409)

    const body = await request.json()
    const { realName, reason } = body as { realName: string; reason: string }
    if (!realName?.trim()) throw new ApiError('真实姓名不能为空', 400)
    if (!reason || reason.trim().length < 20) throw new ApiError('加入理由不能少于20个字', 400)

    const existing = await prisma.familyJoinRequest.findUnique({
      where: { familyId_userId: { familyId, userId } },
    })

    if (existing) {
      if (existing.status === 'PENDING') throw new ApiError('您已有待审核的申请', 409)
      if (existing.status === 'APPROVED') throw new ApiError('您的申请已被批准', 409)
      // REJECTED — allow re-apply by updating
      const updated = await prisma.familyJoinRequest.update({
        where: { id: existing.id },
        data: { realName: realName.trim(), reason: reason.trim(), status: 'PENDING' },
      })
      return NextResponse.json({ data: updated }, { status: 200 })
    }

    const joinRequest = await prisma.familyJoinRequest.create({
      data: { familyId, userId, realName: realName.trim(), reason: reason.trim() },
    })
    return NextResponse.json({ data: joinRequest }, { status: 201 })
  } catch (e) {
    return handleError(e)
  }
}
