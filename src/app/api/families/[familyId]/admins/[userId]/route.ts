import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireFamilyCreator, handleError, ApiError } from '@/lib/api-helpers'

type Params = { params: Promise<{ familyId: string; userId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { familyId, userId } = await params
    const family = await requireFamilyCreator(session.user.id, familyId)

    if (userId === family.createdById) {
      throw new ApiError('不能移除家族创建者的管理员权限', 400)
    }

    const admin = await prisma.familyAdmin.findUnique({
      where: { userId_familyId: { userId, familyId } },
    })
    if (!admin) throw new ApiError('该用户不是管理员', 404)

    await prisma.familyAdmin.delete({ where: { id: admin.id } })
    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    return handleError(err)
  }
}
