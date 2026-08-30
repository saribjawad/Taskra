export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer'

export type Member = {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: MemberRole
  joinedAt: string
}
