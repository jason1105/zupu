export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type RelationshipType = 'PARENT_CHILD' | 'SPOUSE'

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface Family {
  id: string
  name: string
  description: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  admins?: FamilyAdmin[]
  members?: FamilyMember[]
  _count?: { members: number }
}

export interface FamilyAdmin {
  id: string
  userId: string
  familyId: string
  createdAt: string
  user?: Pick<User, 'id' | 'email' | 'name'>
}

export interface FamilyMember {
  id: string
  familyId: string
  name: string
  gender: Gender
  birthDate: string | null
  deathDate: string | null
  isAlive: boolean
  occupation: string | null
  hometown: string | null
  photoUrl: string | null
  bio: string | null
  createdAt: string
  updatedAt: string
}

export interface Relationship {
  id: string
  familyId: string
  fromMemberId: string
  toMemberId: string
  type: RelationshipType
  createdAt: string
  fromMember?: FamilyMember
  toMember?: FamilyMember
}

// Tree visualization types
export interface TreeNode {
  id: string
  member: FamilyMember
  children: TreeNode[]
  spouses: FamilyMember[]
  x?: number
  y?: number
}

// API request/response types
export interface ApiResponse<T> {
  data: T
}

export interface ApiError {
  error: string
}

export interface CreateFamilyInput {
  name: string
  description?: string
}

export interface CreateMemberInput {
  name: string
  gender: Gender
  birthDate?: string
  deathDate?: string
  isAlive?: boolean
  occupation?: string
  hometown?: string
  photoUrl?: string
  bio?: string
}

export interface CreateRelationshipInput {
  fromMemberId: string
  toMemberId: string
  type: RelationshipType
}

export interface ImportData {
  version: string
  family: { name: string; description?: string }
  members: Array<Omit<FamilyMember, 'familyId' | 'createdAt' | 'updatedAt'>>
  relationships: Array<Pick<Relationship, 'fromMemberId' | 'toMemberId' | 'type'>>
}
