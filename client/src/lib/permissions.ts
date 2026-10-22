import type { MemberRole } from '#/type'

// Mirrors RequiredRoles in the server routes.
export const permissions = {
  'project:create': ['owner', 'admin'],
  'project:update': ['owner', 'admin', 'member'],
  'project:delete': ['owner', 'admin'],
  'project:members:update': ['owner', 'admin'],
  'project:milestone:create': ['owner', 'admin'],
  'project:milestone:update': ['owner', 'admin', 'member'],
  'project:comment:delete': ['owner', 'admin'],
  'team:create': ['owner', 'admin'],
  'team:delete': ['owner', 'admin'],
  'team:members:update': ['owner', 'admin'],
  'team:resources:update': ['owner', 'admin', 'member'],
  'team:update': ['owner', 'admin'],
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
