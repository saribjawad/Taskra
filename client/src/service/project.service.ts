import { api } from '#/lib/api'
import type { Project, ProjectDetail } from '#/type/project'

export interface GetProjectsResponse {
  metadata: {
    hasNextPage: boolean
    page: number
    limit: number
    offset: number
  }
  projects: Project[]
}

export async function getProjects(
  workspaceId: string,
  page: number,
  limit: number,
): Promise<GetProjectsResponse> {
  const response = await api.get(`/workspace/${workspaceId}/projects`, {
    params: { page, limit },
  })
  return response.data.data
}

export interface CreateProjectPayload {
  name: string
  shortSummary?: string
  description?: string
  status: Project['status']
  priority: Project['priority']
  leadId: string
  startDate?: string
  targetDate?: string
}

export async function createProject(
  payload: CreateProjectPayload,
): Promise<void> {
  await api.post('/projects', payload)
}

export async function getProject(projectId: string): Promise<ProjectDetail> {
  const response = await api.get(`/projects/${projectId}`)
  return response.data.data
}
