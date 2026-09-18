export type NotificationType =
  | 'task:completed'
  | 'task:assigned'
  | 'task:reporter_assigned'
  | 'task:commented'
  | 'task:due_soon'
  | 'invite:accepted'
  | 'invite:declined'

export interface Notification {
  id: string
  userId: string
  actorId?: string | null
  taskId?: string | null
  workspaceId: string
  seen: boolean
  type: NotificationType
  message: string
  updatedAt: string
  createdAt: string
}
