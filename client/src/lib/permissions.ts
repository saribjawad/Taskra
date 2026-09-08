import type { MemberRole } from '#/type'

// Mirrors RequiredRoles in the server routes.
export const permissions = {
  'task:create': ['owner', 'admin', 'member'],
  'task:update': ['owner', 'admin', 'member'],
  'task:complete': ['owner', 'admin', 'member'],
  'task:delete': ['owner', 'admin'],
  'comment:create': ['owner', 'admin', 'member'],
  'comment:update': ['owner', 'admin', 'member'],
  'comment:delete': ['owner', 'admin', 'member'],
  'invitation:manage': ['owner', 'admin'],
  'member:remove': ['owner'],
  'workspace:delete': ['owner'],
} satisfies Record<string, MemberRole[]>

export type PermissionAction = keyof typeof permissions

export function hasPermission(
  role: MemberRole | null | undefined,
  action: PermissionAction,
): boolean {
  const allowedRoles: readonly MemberRole[] = permissions[action]
  return role != null && allowedRoles.includes(role)
}
