import { api } from '#/lib/api'

interface GetTasksResponse {
  metadata: {
    hasNextPage: Boolean
    page: number
    limit: number
    offset: number
  }
  tasks: {
    id: string
    title: string
    description: string
    status: string
    priority: string
    label: string
    assignee: string
    updated_at: Date
    created_at: Date
    workspace_id: string
    created_by: string
  }[]
}

interface GetTasksParams {
  page?: number
  limit?: number
  label?: string
  priority?: string
  status?: string
  search?: string
  filter?: string
}

export async function getTasks(
  payload?: any,
  params: GetTasksParams = {
    page: 1,
    limit: 10,
    filter: 'assigned',
  },
): Promise<GetTasksResponse> {
  const queryParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.set(key, value)
    }
  })

  const queryString = new URLSearchParams(queryParams).toString()

  const resp = await api.get(`/tasks?${queryString}`, payload)

  return resp.data.data
}
