import { ACCEPTED_IMAGE_TYPES } from '#/components/fields/AttachmentField'
import { api } from '#/lib/api'
import type {
  Task,
  TaskActivity,
  TaskFilterType,
  TaskLabelType,
  TaskPriorityType,
  TaskStatusType,
} from '#/type'

export interface GetTasksResponse {
  metadata: {
    hasNextPage: boolean
    page: number
    limit: number
    offset: number
  }
  tasks: Task[]
}

export interface GetTasksParams {
  page?: number
  limit?: number
  label?: TaskLabelType
  priority?: TaskPriorityType
  status?: TaskStatusType
  search?: string
  filter?: TaskFilterType
}

export async function getTasks(
  params: GetTasksParams,
): Promise<GetTasksResponse> {
  const queryParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.set(key, value)
    }
  })

  const queryString = new URLSearchParams(queryParams).toString()

  const resp = await api.get(`/tasks?${queryString}`)

  return resp.data.data
}

type AttachmentsMimeTypes =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

type Attachments = {
  id: string
  task_id: string
  name: string
  size: number
  mime_type: AttachmentsMimeTypes
  created_at: Date
}

export interface GetTaskResponse {
  id: string
  team_id: string
  project_id: string | null
  project_milestone_id: string | null
  title: string
  description: string
  status: TaskStatusType
  priority: TaskPriorityType
  label: TaskLabelType
  assignee: {
    id: string
    username: string
    email: string
  } | null
  reporter: {
    id: string
    username: string
    email: string
  } | null
  start_date: string | null
  due_date: string | null
  completed_date: string | null
  updated_at: string
  created_at: string
  workspace_id: string
  created_by: Date
  attachments: Attachments[]
}

export async function connectTaskToProject(
  taskId: string,
  payload: { projectId: string | null; milestoneId?: string },
) {
  await api.post(`/tasks/${taskId}/project`, payload)
}

export async function getTaskById(taskId: string): Promise<GetTaskResponse> {
  const resp = await api.get(`/tasks/${taskId}`)
  return resp.data.data
}

export interface CreateTaskParams {
  teamId: string
  title: string
  description: string
  status: TaskStatusType
  priority: TaskPriorityType
  label: TaskLabelType
  assignee?: string
  reporter?: string
  attachments: (File | undefined)[] | undefined
  startDate: string | undefined
  dueDate: string | undefined
}

export async function createTask(params: CreateTaskParams): Promise<void> {
  const {
    attachments,
    description,
    label,
    priority,
    status,
    title,
    assignee,
    reporter,
    dueDate,
    startDate,
    teamId,
  } = params

  const formData = new FormData()

  formData.append('teamId', teamId)
  formData.append('title', title)
  formData.append('description', description)
  formData.append('status', status)
  formData.append('priority', priority)
  formData.append('label', label)
  if (startDate) {
    formData.append('startDate', startDate)
  }
  if (dueDate) {
    formData.append('dueDate', dueDate)
  }
  if (assignee) {
    formData.append('assignee', assignee)
  }
  if (reporter) {
    formData.append('reporter', reporter)
  }

  if (attachments) {
    for (const file of attachments) {
      if (file && ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        formData.append('images', file)
      } else if (file && file.type === 'application/pdf') {
        formData.append('pdf', file)
      } else if (file) {
        formData.append('document', file)
      }
    }
  }

  await api.post(`/tasks`, formData)
}

export interface UpdateTaskPayload {
  title?: string
  description?: string
  status?: TaskStatusType
  priority?: TaskPriorityType
  label?: TaskLabelType
  assignee?: string
  reporter?: string
  clearFields?: ('assignee' | 'reporter')[]
  attachments?: (File | undefined)[] | undefined
  startDate?: string | undefined
  dueDate?: string | undefined
  removedAttachmentIds?: string[]
}

export async function updateTask(
  taskId: string,
  payload: UpdateTaskPayload,
): Promise<void> {
  const formData = new FormData()

  const { attachments, clearFields, removedAttachmentIds, ...fields } = payload

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value)
    }
  })

  clearFields?.forEach((field) => {
    formData.append('clearFields', field)
  })

  removedAttachmentIds?.forEach((id) => {
    formData.append('removedAttachmentIds[]', id)
  })

  attachments?.forEach((file) => {
    if (!file) return

    const field = ACCEPTED_IMAGE_TYPES.includes(file.type)
      ? 'images'
      : file.type === 'application/pdf'
        ? 'pdf'
        : 'document'

    formData.append(field, file)
  })

  await api.patch(`/tasks/${taskId}`, formData)
}

export async function deleteTask(taskId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}`)
}

export async function markTaskAsCompleted(taskId: string): Promise<void> {
  await api.patch(`/tasks/${taskId}/completed`)
}

export interface GetTaskActivitiesResponse {
  activities: TaskActivity[]
  hasMore: boolean
  cursor: { time: string; id: string } | null
}

export async function getTaskActivities(
  taskId: string,
  cursor?: { time: string; id: string },
): Promise<GetTaskActivitiesResponse> {
  const result = await api.get(`/tasks/${taskId}/activity`, {
    params: {
      ...(cursor && { cursorTime: cursor.time, cursorId: cursor.id }),
    },
  })
  return result.data.data
}
