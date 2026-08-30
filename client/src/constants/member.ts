import type { MemberRole } from '#/type'

export const ROLE_LABEL: Record<MemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
}
