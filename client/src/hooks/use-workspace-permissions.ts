import { useAuth } from '#/context/auth/auth-hook'
import { hasPermission, type PermissionAction } from '#/lib/permissions'
import { useParams } from '@tanstack/react-router'

export function useWorkspacePermissions() {
  const { user } = useAuth()
  const { workspaceId } = useParams({ strict: false })
  const role =
    workspaceId && workspaceId === user?.activeWorkspace ? user.role : null

  function can(action: PermissionAction) {
    return hasPermission(role, action)
  }

  return { can }
}
