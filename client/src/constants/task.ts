import type { TaskLabelType, TaskPriorityType, TaskStatusType } from '#/type'

export const STATUS_ITEMS: { label: string; value: TaskStatusType }[] = [
  { label: 'Backlog', value: 'backlog' },
  { label: 'Todo', value: 'todo' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
  { label: 'Cancelled', value: 'cancelled' },
]

export const PRIORITY_ITEMS: { label: string; value: TaskPriorityType }[] = [
  { label: 'Urgent', value: 'urgent' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
  { label: 'No priority', value: 'no_priority' },
]

export const LABEL_ITEMS: { label: string; value: TaskLabelType }[] = [
  { label: 'Bug', value: 'bug' },
  { label: 'Feature', value: 'feature' },
  { label: 'Improvement', value: 'improvement' },
]
