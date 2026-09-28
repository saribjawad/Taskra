export type ProjectActivityType =
  | 'project_created'
  | 'project_updated'
  | 'lead_changed'
  | 'member_added'
  | 'member_removed'
  | 'priority_changed'
  | 'status_changed'
  | 'start_date_changed'
  | 'end_date_changed'
  | 'milestone_added'
  | 'milestone_removed'
  | 'milestone_changed'

export interface ProjectActivity {
  id: string
  projectId: string
  userId: string
  type: ProjectActivityType
  description: string
  metadata: {
    field: string
    from: string
    to: string
  } | null
  updatedAt: string
  createdAt: string
}
