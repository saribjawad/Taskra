import type { TaskPriorityType } from './task'

export type ProjectStatus =
  | 'backlog'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface Project {
  id: string
  name: string
  short_summary: string | null
  description: string | null
  priority: TaskPriorityType
  status: ProjectStatus
  lead_id: string | null
  workspace_id: string
  start_date: string | null
  target_date: string | null
  created_at: string
  updated_at: string
}
