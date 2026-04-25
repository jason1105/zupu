import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireFamilyAdmin, handleError, ApiError } from '@/lib/api-helpers'

type Params = Promise<{ familyId: string; requestId: string }>

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requireAuth()
    const { familyId, requestId } = await params
    await requireFamilyAdmin(session.user.id, familyId)

    const body = await request.json()
    const { action } = body as { action: 'APPROVE' | 'REJECT' }
    if (action !== 'APPROVE' && action !== 'REJECT') throw new ApiError('无效操作', 400)

    const joinRequest = await prisma.familyJoinRequest.findUnique({ where: { id: requestId } })
    if (!joinRequest || joinRequest.familyId !== familyId) throw new ApiError('申请不存在', 404)
    if (joinRequest.status !== 'PENDING') throw new ApiError('该申请已处理', 409)

    const updated = await prisma.familyJoinRequest.update({
      where: { id: requestId },
      data: { status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' },
    })

    if (action === 'APPROVE') {
      await prisma.familyAdmin.upsert({
        where: { userId_familyId: { userId: joinRequest.userId, familyId } },
        create: { userId: joinRequest.userId, familyId },
        update: {},
      })
    }

    return NextResponse.json({ data: updated })
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await requireAuth()
    const { familyId, requestId } = await params

    const joinRequest = await prisma.familyJoinRequest.findUnique({ where: { id: requestId } })
    if (!joinRequest || joinRequest.familyId !== familyId) throw new ApiError('申请不存在', 404)
    if (joinRequest.userId !== session.user.id) throw new ApiError('无操作权限', 403)
    if (joinRequest.status !== 'PENDING') throw new ApiError('只能撤回待审核的申请', 409)

    await prisma.familyJoinRequest.delete({ where: { id: requestId } })
    return NextResponse.json({ data: { success: true } })
  } catch (e) {
    return handleError(e)
  }
}
