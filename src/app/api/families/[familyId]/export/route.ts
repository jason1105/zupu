import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireFamilyAdmin, handleError, ApiError } from '@/lib/api-helpers'

type Params = { params: Promise<{ familyId: string }> }

const GENDER_LABEL: Record<string, string> = { MALE: '男', FEMALE: '女', OTHER: '其他' }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { familyId } = await params
    await requireFamilyAdmin(session.user.id, familyId)

    const format = req.nextUrl.searchParams.get('format') ?? 'json'
    if (!['json', 'csv'].includes(format)) throw new ApiError('format 仅支持 json 或 csv', 400)

    const family = await prisma.family.findUnique({ where: { id: familyId } })
    if (!family) throw new ApiError('家族不存在', 404)

    const members = await prisma.familyMember.findMany({ where: { familyId } })
    const relationships = await prisma.relationship.findMany({ where: { familyId } })

    if (format === 'json') {
      const payload = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        family: { name: family.name, description: family.description },
        members: members.map((m) => ({
          id: m.id,
          name: m.name,
          gender: m.gender,
          birthDate: m.birthDate?.toISOString().split('T')[0] ?? null,
          deathDate: m.deathDate?.toISOString().split('T')[0] ?? null,
          isAlive: m.isAlive,
          occupation: m.occupation,
          hometown: m.hometown,
          photoUrl: m.photoUrl,
          bio: m.bio,
        })),
        relationships: relationships.map((r) => ({
          fromMemberId: r.fromMemberId,
          toMemberId: r.toMemberId,
          type: r.type,
        })),
      }
      return new NextResponse(JSON.stringify(payload, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${family.name}-zupu.json"`,
        },
      })
    }

    // CSV format
    const header = 'id,姓名,性别,生日,忌日,在世,职业,籍贯'
    const rows = members.map((m) =>
      [
        m.id,
        `"${m.name}"`,
        GENDER_LABEL[m.gender] ?? m.gender,
        m.birthDate?.toISOString().split('T')[0] ?? '',
        m.deathDate?.toISOString().split('T')[0] ?? '',
        m.isAlive ? '是' : '否',
        `"${m.occupation ?? ''}"`,
        `"${m.hometown ?? ''}"`,
      ].join(',')
    )
    const csv = [header, ...rows].join('\n')

    return new NextResponse('\uFEFF' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${family.name}-members.csv"`,
      },
    })
  } catch (err) {
    return handleError(err)
  }
}
