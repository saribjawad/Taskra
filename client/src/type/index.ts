export interface ApiErrorResponse {
  message: string
  success: false
  statusCode: number
  errors: []
}

export type TaskStatusType =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'done'
  | 'cancelled'
export type TaskFilterType = 'assigned' | 'created' | 'all'
export type TaskPriorityType =
  | 'urgent'
  | 'high'
  | 'medium'
  | 'low'
  | 'no_priority'
export type TaskLabelType = 'bug' | 'feature' | 'improvement'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatusType
  priority: TaskPriorityType
  label: TaskLabelType
  assignee: string
  updated_at: Date
  created_at: Date
  workspace_id: string
  created_by: string
}
