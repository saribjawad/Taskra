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
  creator: string
  reporter: string
  start_date: Date | null
  due_date: Date | null
  completed_date: Date | null
  workspace_id: string
  team_id: string
  team: { id: string; name: string }
  updated_at: Date
  created_at: Date
}
