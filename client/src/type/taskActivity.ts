export type TaskActivityType =
  | 'task_created'
  | 'status_changed'
  | 'priority_changed'
  | 'title_changed'
  | 'assignee_changed'
  | 'reporter_changed'
  | 'comment_added'
  | 'attachment_added'
  | 'task_completed'

interface TaskTimelineEntryBase {
  id: string
  taskId: string
  userId: string
  username: string
  createdAt: string
}

export interface TaskCommentActivity extends TaskTimelineEntryBase {
  activityType: 'comment'
  content: string
  updatedAt: string | null
}

export interface TaskEventActivity extends TaskTimelineEntryBase {
  activityType: 'activity'
  type: TaskActivityType
  metadata: {
    field: string
    from: string
    to: string
  } | null
  description: string
}

export type TaskActivity = TaskCommentActivity | TaskEventActivity
