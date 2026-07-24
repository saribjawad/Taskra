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
}

export async function createTask(params: CreateTaskParams): Promise<void> {
  await api.post(`/tasks`, params)
}

export async function deleteTask(taskId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}`)
}
