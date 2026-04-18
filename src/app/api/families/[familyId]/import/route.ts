import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireFamilyAdmin, handleError, ApiError } from '@/lib/api-helpers'
import type { ImportData } from '@/types'

type Params = { params: Promise<{ familyId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { familyId } = await params
    await requireFamilyAdmin(session.user.id, familyId)

    const body: ImportData = await req.json()

    if (!body.members || !Array.isArray(body.members)) {
      throw new ApiError('导入数据格式错误：缺少 members 字段', 400)
    }
    if (!body.relationships || !Array.isArray(body.relationships)) {
      throw new ApiError('导入数据格式错误：缺少 relationships 字段', 400)
    }

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Map original id → new id
      const idMap = new Map<string, string>()

      const createdMembers = await Promise.all(
        body.members.map(async (m) => {
          const member = await tx.familyMember.create({
            data: {
              familyId,
              name: m.name,
              gender: m.gender,
              birthDate: m.birthDate ? new Date(m.birthDate) : null,
              deathDate: m.deathDate ? new Date(m.deathDate) : null,
              isAlive: m.isAlive ?? true,
              occupation: m.occupation ?? null,
              hometown: m.hometown ?? null,
              photoUrl: m.photoUrl ?? null,
              bio: m.bio ?? null,
            },
          })
          idMap.set(m.id, member.id)
          return member
        })
      )

      const createdRelationships = await Promise.all(
        body.relationships
          .filter((r) => idMap.has(r.fromMemberId) && idMap.has(r.toMemberId))
          .map((r) =>
            tx.relationship.create({
              data: {
                familyId,
                fromMemberId: idMap.get(r.fromMemberId)!,
                toMemberId: idMap.get(r.toMemberId)!,
                type: r.type,
              },
            })
          )
      )

      return {
        membersCreated: createdMembers.length,
        relationshipsCreated: createdRelationships.length,
      }
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
