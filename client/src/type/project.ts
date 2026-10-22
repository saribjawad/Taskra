import type { TaskLabelType, TaskPriorityType, TaskStatusType } from './task'

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
  team_id: string
  team: { id: string; name: string }
  start_date: string | null
  target_date: string | null
  created_at: string
  updated_at: string
}

export interface ProjectPerson {
  id: string | null
  username: string | null
  email: string | null
}

export interface ProjectMilestone {
  id: string
  project_id: string
  name: string
  description: string | null
  target_date: string | null
  created_at: string
  updated_at: string
}

export interface ProjectTask {
  id: string
  title: string
  status: TaskStatusType
  priority: TaskPriorityType
  label: TaskLabelType
  workspaceId: string
  projectId: string | null
  milestoneId: string | null
  team: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

export interface ProjectTaskProgress {
  scope: number
  completed: number
  assignees: {
    id: string
    username: string
    email: string
    taskCount: number
  }[]
}

export interface ProjectDetail extends Omit<Project, 'lead_id'> {
  lead: ProjectPerson | null
  members: {
    id: string
    project_id: string
    user: ProjectPerson | null
    created_at: string
    updated_at: string
  }[]
  milestones: ProjectMilestone[]
}
