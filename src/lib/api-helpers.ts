import { NextResponse } from 'next/server'
import { auth } from './auth'
import { prisma } from './prisma'

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number
  ) {
    super(message)
  }
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new ApiError('未登录', 401)
  }
  return session
}

export async function requireFamilyAdmin(userId: string, familyId: string) {
  const admin = await prisma.familyAdmin.findUnique({
    where: { userId_familyId: { userId, familyId } },
  })
  if (!admin) {
    throw new ApiError('无操作权限，仅管理员可执行此操作', 403)
  }
  return admin
}

export async function requireFamilyCreator(userId: string, familyId: string) {
  const family = await prisma.family.findUnique({ where: { id: familyId } })
  if (!family) throw new ApiError('家族不存在', 404)
  if (family.createdById !== userId) {
    throw new ApiError('无操作权限，仅创建者可执行此操作', 403)
  }
  return family
}

export function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  console.error(err)
  return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
}
