import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: '姓名、邮箱和密码均为必填项' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: '密码至少需要 8 位' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 409 })
    }

    const hashed = await hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
      select: { id: true, email: true, name: true, createdAt: true },
    })

    return NextResponse.json({ data: user }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
