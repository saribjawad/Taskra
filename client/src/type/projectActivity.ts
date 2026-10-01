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

interface ProjectTimelineEntryBase {
  id: string
  projectId: string
  userId: string
  username: string
  activityType: 'comment' | 'activity'
  createdAt: string
  updatedAt: string | null
}

export interface ProjectCommentActivity extends ProjectTimelineEntryBase {
  activityType: 'comment'
  content: string
  type: null
  description: null
  metadata: null
}

export interface ProjectEventActivity extends ProjectTimelineEntryBase {
  activityType: 'activity'
  content: null
  type: ProjectActivityType
  description: string
  metadata: {
    field: string
    from: string
    to: string
  } | null
}

export type ProjectActivityEntry = ProjectCommentActivity | ProjectEventActivity
