import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireFamilyAdmin, handleError, ApiError } from '@/lib/api-helpers'

type Params = { params: Promise<{ relationshipId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { relationshipId } = await params

    const rel = await prisma.relationship.findUnique({ where: { id: relationshipId } })
    if (!rel) throw new ApiError('关系记录不存在', 404)

    await requireFamilyAdmin(session.user.id, rel.familyId)

    await prisma.relationship.delete({ where: { id: relationshipId } })
    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    return handleError(err)
  }
}
