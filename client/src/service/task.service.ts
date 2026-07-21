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
