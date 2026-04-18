import { describe, it, expect } from 'vitest'
import { buildTree, flattenTree, getMemberDepth } from '@/lib/tree-utils'
import type { FamilyMember, Relationship } from '@/types'

function makeMember(id: string, name: string, gender: 'MALE' | 'FEMALE' = 'MALE'): FamilyMember {
  return {
    id,
    familyId: 'fam1',
    name,
    gender,
    birthDate: null,
    deathDate: null,
    isAlive: true,
    occupation: null,
    hometown: null,
    photoUrl: null,
    bio: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function makeRel(fromMemberId: string, toMemberId: string, type: 'PARENT_CHILD' | 'SPOUSE'): Relationship {
  return {
    id: `${fromMemberId}-${toMemberId}-${type}`,
    familyId: 'fam1',
    fromMemberId,
    toMemberId,
    type,
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('buildTree', () => {
  it('returns empty array when no members', () => {
    const result = buildTree([], [])
    expect(result).toHaveLength(0)
  })

  it('returns single root node when member has no relationships', () => {
    const members = [makeMember('m1', '张三')]
    const result = buildTree(members, [])
    expect(result).toHaveLength(1)
    expect(result[0].member.name).toBe('张三')
    expect(result[0].children).toHaveLength(0)
    expect(result[0].spouses).toHaveLength(0)
  })

  it('correctly builds parent-child hierarchy', () => {
    const members = [makeMember('p1', '父'), makeMember('c1', '子')]
    const rels = [makeRel('p1', 'c1', 'PARENT_CHILD')]
    const result = buildTree(members, rels)

    expect(result).toHaveLength(1) // only root
    const root = result[0]
    expect(root.member.name).toBe('父')
    expect(root.children).toHaveLength(1)
    expect(root.children[0].member.name).toBe('子')
  })

  it('attaches spouse to parent node, not as tree child', () => {
    const members = [
      makeMember('p1', '丈夫', 'MALE'),
      makeMember('p2', '妻子', 'FEMALE'),
      makeMember('c1', '儿子', 'MALE'),
    ]
    const rels = [
      makeRel('p1', 'p2', 'SPOUSE'),
      makeRel('p1', 'c1', 'PARENT_CHILD'),
    ]
    const result = buildTree(members, rels)

    // Spouse (p2) should not be a root node independently if it's a spouse
    // p2 has no children so it would be a root, but it IS independent root
    // p1 is also a root (no parents)
    // In the tree, p1 should have spouse=[p2]
    const p1Node = result.find((n) => n.id === 'p1')
    expect(p1Node).toBeDefined()
    expect(p1Node!.spouses).toHaveLength(1)
    expect(p1Node!.spouses[0].name).toBe('妻子')
    expect(p1Node!.children).toHaveLength(1)
  })

  it('handles three-generation family', () => {
    const members = [
      makeMember('g1', '祖父'),
      makeMember('f1', '父亲'),
      makeMember('c1', '儿子'),
    ]
    const rels = [
      makeRel('g1', 'f1', 'PARENT_CHILD'),
      makeRel('f1', 'c1', 'PARENT_CHILD'),
    ]
    const result = buildTree(members, rels)

    expect(result).toHaveLength(1)
    const grandfather = result[0]
    expect(grandfather.member.name).toBe('祖父')
    expect(grandfather.children).toHaveLength(1)
    const father = grandfather.children[0]
    expect(father.member.name).toBe('父亲')
    expect(father.children).toHaveLength(1)
    expect(father.children[0].member.name).toBe('儿子')
  })

  it('handles multiple roots (unrelated families)', () => {
    const members = [
      makeMember('a1', '甲'),
      makeMember('b1', '乙'),
    ]
    const result = buildTree(members, [])
    expect(result).toHaveLength(2)
  })

  it('prevents infinite loop from circular relationships', () => {
    const members = [makeMember('a', '甲'), makeMember('b', '乙')]
    // Circular: a is parent of b, and b appears as parent of a (data error)
    const rels = [
      makeRel('a', 'b', 'PARENT_CHILD'),
      makeRel('b', 'a', 'PARENT_CHILD'), // creates cycle
    ]
    // Should not throw or loop forever
    expect(() => buildTree(members, rels)).not.toThrow()
  })

  it('handles member with multiple children', () => {
    const members = [
      makeMember('p1', '父亲'),
      makeMember('c1', '长子'),
      makeMember('c2', '次子'),
      makeMember('c3', '幺女', 'FEMALE'),
    ]
    const rels = [
      makeRel('p1', 'c1', 'PARENT_CHILD'),
      makeRel('p1', 'c2', 'PARENT_CHILD'),
      makeRel('p1', 'c3', 'PARENT_CHILD'),
    ]
    const result = buildTree(members, rels)
    expect(result[0].children).toHaveLength(3)
  })
})

describe('flattenTree', () => {
  it('returns all nodes in BFS order', () => {
    const members = [
      makeMember('g1', '祖父'),
      makeMember('f1', '父亲'),
      makeMember('c1', '儿子'),
    ]
    const rels = [
      makeRel('g1', 'f1', 'PARENT_CHILD'),
      makeRel('f1', 'c1', 'PARENT_CHILD'),
    ]
    const roots = buildTree(members, rels)
    const flat = flattenTree(roots)
    expect(flat).toHaveLength(3)
    expect(flat[0].member.name).toBe('祖父')
    expect(flat[1].member.name).toBe('父亲')
    expect(flat[2].member.name).toBe('儿子')
  })

  it('returns empty array for empty roots', () => {
    expect(flattenTree([])).toHaveLength(0)
  })
})

describe('getMemberDepth', () => {
  it('returns 0 for root node', () => {
    const members = [makeMember('m1', '根')]
    const roots = buildTree(members, [])
    expect(getMemberDepth('m1', roots)).toBe(0)
  })

  it('returns correct depth for nested member', () => {
    const members = [
      makeMember('g1', '祖父'),
      makeMember('f1', '父亲'),
      makeMember('c1', '儿子'),
    ]
    const rels = [
      makeRel('g1', 'f1', 'PARENT_CHILD'),
      makeRel('f1', 'c1', 'PARENT_CHILD'),
    ]
    const roots = buildTree(members, rels)
    expect(getMemberDepth('g1', roots)).toBe(0)
    expect(getMemberDepth('f1', roots)).toBe(1)
    expect(getMemberDepth('c1', roots)).toBe(2)
  })

  it('returns -1 for non-existent member', () => {
    const members = [makeMember('m1', '某人')]
    const roots = buildTree(members, [])
    expect(getMemberDepth('nonexistent', roots)).toBe(-1)
  })
})
