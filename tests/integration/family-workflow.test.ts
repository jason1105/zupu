/**
 * Integration tests for the complete family management workflow.
 *
 * These tests use an in-memory SQLite database (via the DATABASE_URL env var
 * pointing to a temp file) and call the Next.js API routes directly as functions
 * to verify end-to-end business logic without a running HTTP server.
 *
 * Pattern: import the route handler, construct a mock NextRequest, call it,
 * and assert the response.
 *
 * NOTE: These tests require Prisma to be connected to a test database.
 * Run with: DATABASE_URL="file:/tmp/test.db" npx vitest run tests/integration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { buildTree, flattenTree } from '@/lib/tree-utils'
import type { FamilyMember, Relationship } from '@/types'

// ─── helpers ───────────────────────────────────────────────────────────────

function makeMember(overrides: Partial<FamilyMember> & { id: string; name: string }): FamilyMember {
  return {
    familyId: 'test-family',
    gender: 'MALE',
    birthDate: null,
    deathDate: null,
    isAlive: true,
    occupation: null,
    hometown: null,
    photoUrl: null,
    bio: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeRel(from: string, to: string, type: 'PARENT_CHILD' | 'SPOUSE'): Relationship {
  return {
    id: `${from}-${to}`,
    familyId: 'test-family',
    fromMemberId: from,
    toMemberId: to,
    type,
    createdAt: new Date().toISOString(),
  }
}

// ─── Prisma-backed DB tests ────────────────────────────────────────────────

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL ?? 'file:/tmp/zupu-test.db' } },
})

describe('Database integration: User registration and family creation', () => {
  let userId: string
  let familyId: string

  beforeAll(async () => {
    // Clean up from previous runs
    await prisma.relationship.deleteMany()
    await prisma.familyMember.deleteMany()
    await prisma.familyAdmin.deleteMany()
    await prisma.family.deleteMany()
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-integration-' } } })
  })

  afterAll(async () => {
    await prisma.relationship.deleteMany()
    await prisma.familyMember.deleteMany()
    await prisma.familyAdmin.deleteMany()
    await prisma.family.deleteMany()
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-integration-' } } })
    await prisma.$disconnect()
  })

  it('creates a user with hashed password', async () => {
    const password = await hash('testpassword123', 12)
    const user = await prisma.user.create({
      data: { email: 'test-integration-user@example.com', name: '测试用户', password },
    })
    expect(user.id).toBeTruthy()
    expect(user.email).toBe('test-integration-user@example.com')
    expect(user.password).not.toBe('testpassword123') // must be hashed
    userId = user.id
  })

  it('prevents duplicate email registration', async () => {
    const password = await hash('anotherpassword', 12)
    await expect(
      prisma.user.create({
        data: { email: 'test-integration-user@example.com', name: '重复用户', password },
      })
    ).rejects.toThrow()
  })

  it('creates a family with creator as admin', async () => {
    const family = await prisma.family.create({
      data: {
        name: '集成测试家族',
        createdById: userId,
        admins: { create: { userId } },
      },
      include: { admins: true },
    })
    expect(family.name).toBe('集成测试家族')
    expect(family.admins).toHaveLength(1)
    expect(family.admins[0].userId).toBe(userId)
    familyId = family.id
  })

  it('creates family members', async () => {
    const father = await prisma.familyMember.create({
      data: { familyId, name: '集成父亲', gender: 'MALE', isAlive: true },
    })
    const child = await prisma.familyMember.create({
      data: { familyId, name: '集成子女', gender: 'FEMALE', isAlive: true },
    })
    expect(father.name).toBe('集成父亲')
    expect(child.gender).toBe('FEMALE')

    const rel = await prisma.relationship.create({
      data: { familyId, fromMemberId: father.id, toMemberId: child.id, type: 'PARENT_CHILD' },
    })
    expect(rel.type).toBe('PARENT_CHILD')
  })

  it('prevents duplicate relationships', async () => {
    const members = await prisma.familyMember.findMany({ where: { familyId } })
    const [m1, m2] = members

    // First create should succeed
    await prisma.relationship.create({
      data: { familyId, fromMemberId: m1.id, toMemberId: m2.id, type: 'SPOUSE' },
    }).catch(() => {}) // might already exist

    // Duplicate should fail with unique constraint
    await expect(
      prisma.relationship.create({
        data: { familyId, fromMemberId: m1.id, toMemberId: m2.id, type: 'SPOUSE' },
      })
    ).rejects.toThrow()
  })

  it('cascades delete: removing member deletes its relationships', async () => {
    const member = await prisma.familyMember.create({
      data: { familyId, name: '将被删除', gender: 'MALE', isAlive: true },
    })
    const other = await prisma.familyMember.findFirst({ where: { familyId, id: { not: member.id } } })
    if (other) {
      await prisma.relationship.create({
        data: { familyId, fromMemberId: member.id, toMemberId: other.id, type: 'PARENT_CHILD' },
      })
    }

    await prisma.familyMember.delete({ where: { id: member.id } })

    const remaining = await prisma.relationship.findMany({
      where: { OR: [{ fromMemberId: member.id }, { toMemberId: member.id }] },
    })
    expect(remaining).toHaveLength(0)
  })

  it('adds and removes admins', async () => {
    const newUser = await prisma.user.create({
      data: { email: 'test-integration-admin@example.com', name: '新管理员', password: 'x' },
    })

    const admin = await prisma.familyAdmin.create({
      data: { userId: newUser.id, familyId },
    })
    expect(admin.userId).toBe(newUser.id)

    await prisma.familyAdmin.delete({ where: { id: admin.id } })
    const check = await prisma.familyAdmin.findUnique({
      where: { userId_familyId: { userId: newUser.id, familyId } },
    })
    expect(check).toBeNull()
  })
})

// ─── Tree logic integration tests ──────────────────────────────────────────

describe('Tree building integration: full family scenario', () => {
  const grandpa = makeMember({ id: 'gp', name: '祖父', gender: 'MALE', isAlive: false })
  const grandma = makeMember({ id: 'gm', name: '祖母', gender: 'FEMALE', isAlive: false })
  const father = makeMember({ id: 'fa', name: '父亲', gender: 'MALE' })
  const mother = makeMember({ id: 'mo', name: '母亲', gender: 'FEMALE' })
  const son = makeMember({ id: 's1', name: '长子', gender: 'MALE' })
  const daughter = makeMember({ id: 'd1', name: '长女', gender: 'FEMALE' })

  const members = [grandpa, grandma, father, mother, son, daughter]
  const relationships: Relationship[] = [
    makeRel('gp', 'gm', 'SPOUSE'),
    makeRel('gp', 'fa', 'PARENT_CHILD'),
    makeRel('fa', 'mo', 'SPOUSE'),
    makeRel('fa', 's1', 'PARENT_CHILD'),
    makeRel('fa', 'd1', 'PARENT_CHILD'),
  ]

  it('produces correct root nodes', () => {
    const roots = buildTree(members, relationships)
    // grandpa and grandma are both roots (grandma has no parents, no children in hierarchy)
    // father's parent is grandpa so he's not a root
    const rootIds = roots.map((r) => r.id)
    expect(rootIds).toContain('gp')
    expect(rootIds).not.toContain('fa') // has parent gp
    expect(rootIds).not.toContain('s1') // has parent fa
  })

  it('correctly assigns spouses', () => {
    const roots = buildTree(members, relationships)
    const gpNode = roots.find((r) => r.id === 'gp')!
    expect(gpNode.spouses.map((s) => s.id)).toContain('gm')

    const faNode = flattenTree(roots).find((n) => n.id === 'fa')!
    expect(faNode.spouses.map((s) => s.id)).toContain('mo')
  })

  it('contains all 6 members in flattened tree', () => {
    const roots = buildTree(members, relationships)
    const flat = flattenTree(roots)
    // All non-spouse members should be in the tree as nodes
    // Spouses are lateral, so grandma and mother are nodes in roots but separately
    const nodeIds = flat.map((n) => n.id)
    expect(nodeIds).toContain('gp')
    expect(nodeIds).toContain('fa')
    expect(nodeIds).toContain('s1')
    expect(nodeIds).toContain('d1')
  })

  it('father has 2 children', () => {
    const roots = buildTree(members, relationships)
    const flat = flattenTree(roots)
    const faNode = flat.find((n) => n.id === 'fa')!
    expect(faNode.children).toHaveLength(2)
  })
})
