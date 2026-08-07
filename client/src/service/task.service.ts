import { ACCEPTED_IMAGE_TYPES } from '#/components/tasks/AttachmentField'
import { api } from '#/lib/api'
import type {
  Task,
  TaskFilterType,
  TaskLabelType,
  TaskPriorityType,
  TaskStatusType,
} from '#/type'

interface GetTasksResponse {
  metadata: {
    hasNextPage: Boolean
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

interface GetTaskResponse {
  id: string
  title: string
  description: string
  status: TaskStatusType
  priority: TaskPriorityType
  label: TaskLabelType
  assignee: {
    id: string
    username: string
    email: string
  }
  updated_at: string
  created_at: string
  workspace_id: string
  created_by: Date
  comments: [
    {
      id: string
      content: string
      user: {
        id: string
        username: string
      }
      updated_at: Date
      created_at: Date
    },
  ]
  attachments: Attachments[]
}

export async function getTaskById(taskId: string): Promise<GetTaskResponse> {
  const resp = await api.get(`/tasks/${taskId}`)
  return resp.data.data
}

export interface CreateTaskParams {
  title: string
  description: string
  status: TaskStatusType
  priority: TaskPriorityType
  label: TaskLabelType
  assignee?: string
  attachments: (File | undefined)[] | undefined
}

export async function createTask(params: CreateTaskParams): Promise<void> {
  const { attachments, description, label, priority, status, title, assignee } =
    params

  const formData = new FormData()

  formData.append('title', title)
  formData.append('description', description)
  formData.append('status', status)
  formData.append('priority', priority)
  formData.append('label', label)
  if (assignee) {
    formData.append('assignee', assignee)
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
  title: string
  description: string
  status: TaskStatusType
  priority: TaskPriorityType
  label: TaskLabelType
  assignee?: string
}

export async function updateTask(
  taskId: string,
  payload: UpdateTaskPayload,
): Promise<void> {
  await api.patch(`/tasks/${taskId}`, payload)
}

export async function deleteTask(taskId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}`)
}
