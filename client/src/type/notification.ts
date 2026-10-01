export type NotificationType =
  | 'task:completed'
  | 'task:assigned'
  | 'task:reporter_assigned'
  | 'task:commented'
  | 'task:due_soon'
  | 'invite:accepted'
  | 'invite:declined'
  | 'project:completed'
  | 'project:lead_assigned'
  | 'project:member_assigned'
  | 'project:task_added'
  | 'project:commented'
  | 'project:target_date_soon'

export interface Notification {
  id: string
  userId: string
  actorId?: string | null
  taskId?: string | null
  projectId?: string | null
  workspaceId: string
  seen: boolean
  type: NotificationType
  message: string
  updatedAt: string
  createdAt: string
}
