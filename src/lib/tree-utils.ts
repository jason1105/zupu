import type { FamilyMember, Relationship, TreeNode } from '@/types'

/**
 * Builds a forest (array of root TreeNodes) from flat member/relationship lists.
 * PARENT_CHILD: fromMember is parent, toMember is child.
 * SPOUSE: lateral connection, not part of the vertical hierarchy.
 */
export function buildTree(
  members: FamilyMember[],
  relationships: Relationship[]
): TreeNode[] {
  if (members.length === 0) return []

  const memberMap = new Map<string, FamilyMember>(members.map((m) => [m.id, m]))

  // childrenOf[parentId] = childId[]
  const childrenOf = new Map<string, string[]>()
  // parentsOf[childId] = parentId[]
  const parentsOf = new Map<string, string[]>()
  // spousesOf[memberId] = memberId[]
  const spousesOf = new Map<string, string[]>()

  for (const rel of relationships) {
    if (rel.type === 'PARENT_CHILD') {
      if (!childrenOf.has(rel.fromMemberId)) childrenOf.set(rel.fromMemberId, [])
      childrenOf.get(rel.fromMemberId)!.push(rel.toMemberId)

      if (!parentsOf.has(rel.toMemberId)) parentsOf.set(rel.toMemberId, [])
      parentsOf.get(rel.toMemberId)!.push(rel.fromMemberId)
    } else if (rel.type === 'SPOUSE') {
      if (!spousesOf.has(rel.fromMemberId)) spousesOf.set(rel.fromMemberId, [])
      spousesOf.get(rel.fromMemberId)!.push(rel.toMemberId)

      if (!spousesOf.has(rel.toMemberId)) spousesOf.set(rel.toMemberId, [])
      spousesOf.get(rel.toMemberId)!.push(rel.fromMemberId)
    }
  }

  // Root nodes: members with no parents
  const rootIds = members
    .filter((m) => !parentsOf.has(m.id) || parentsOf.get(m.id)!.length === 0)
    .map((m) => m.id)

  // Prevent infinite loops caused by circular relationships
  const visited = new Set<string>()

  function buildNode(memberId: string): TreeNode | null {
    if (visited.has(memberId)) return null
    const member = memberMap.get(memberId)
    if (!member) return null

    visited.add(memberId)

    const childIds = childrenOf.get(memberId) ?? []
    const children: TreeNode[] = []
    for (const childId of childIds) {
      const childNode = buildNode(childId)
      if (childNode) children.push(childNode)
    }

    const spouseIds = spousesOf.get(memberId) ?? []
    const spouses = spouseIds
      .map((id) => memberMap.get(id))
      .filter((m): m is FamilyMember => m !== undefined)

    return { id: memberId, member, children, spouses }
  }

  const roots: TreeNode[] = []
  for (const rootId of rootIds) {
    const node = buildNode(rootId)
    if (node) roots.push(node)
  }

  return roots
}

/**
 * Flattens a tree into a list of all nodes (BFS order).
 */
export function flattenTree(roots: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = []
  const queue = [...roots]
  while (queue.length > 0) {
    const node = queue.shift()!
    result.push(node)
    queue.push(...node.children)
  }
  return result
}

/**
 * Returns the generation depth of a member (0 = root).
 */
export function getMemberDepth(memberId: string, roots: TreeNode[]): number {
  function search(nodes: TreeNode[], depth: number): number {
    for (const node of nodes) {
      if (node.id === memberId) return depth
      const found = search(node.children, depth + 1)
      if (found >= 0) return found
    }
    return -1
  }
  return search(roots, 0)
}
