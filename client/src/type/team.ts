export interface Team {
  id: string
  name: string
  identifier?: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  id: string
  teamMemberId: string
  username: string
  fullName: string | null
  email: string
  joinedAt: string
}

export interface TeamLink {
  id: string
  teamId: string
  title: string
  url: string
  createdAt: string
  updatedAt: string
}

export interface TeamDocument {
  id: string
  teamId: string
  name: string
  content: string | null
  createdAt: string
  updatedAt: string
}
