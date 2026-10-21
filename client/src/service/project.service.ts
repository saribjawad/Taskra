import { api } from '#/lib/api'
import type {
  Project,
  ProjectDetail,
  ProjectTask,
  ProjectTaskProgress,
} from '#/type/project'
import type { TaskLabelType, TaskPriorityType, TaskStatusType } from '#/type'
import type { ProjectActivityEntry } from '#/type/projectActivity'

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
  leadId?: string
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

export async function getProjectTaskProgress(
  projectId: string,
): Promise<ProjectTaskProgress> {
  const response = await api.get(`/projects/${projectId}/progress`)
  return response.data.data
}

export interface GetProjectTasksResponse {
  tasks: ProjectTask[]
  hasMore: boolean
  cursor: { time: string; id: string } | null
}

export interface ProjectTaskFilters {
  milestoneId?: string
  status?: TaskStatusType
  priority?: TaskPriorityType
  label?: TaskLabelType
}

export async function getProjectTasks(
  projectId: string,
  cursor?: { time: string; id: string },
  filters: ProjectTaskFilters = {},
): Promise<GetProjectTasksResponse> {
  const response = await api.get(`/projects/${projectId}/tasks`, {
    params: {
      ...(cursor && { cursorTime: cursor.time, cursorId: cursor.id }),
      ...filters,
    },
  })
  return response.data.data
}

export type UpdateProjectPayload = Partial<
  Pick<Project, 'name' | 'status' | 'priority'> & {
    shortSummary: string
    description: string
    leadId: string
    startDate: string
    targetDate: string
  }
>

export async function updateProject(
  projectId: string,
  payload: UpdateProjectPayload,
): Promise<void> {
  await api.patch(`/projects/${projectId}`, payload)
}

export async function deleteProject(projectId: string): Promise<void> {
  await api.delete(`/projects/${projectId}`)
}

export interface MilestonePayload {
  name: string
  description?: string
  targetDate?: string
}

export interface MilestoneUpdatePayload {
  name?: string
  description?: string | null
  targetDate?: string | null
}

export async function createProjectMilestone(
  projectId: string,
  payload: MilestonePayload,
): Promise<void> {
  await api.post(`/projects/${projectId}/milestone`, payload)
}

export async function updateProjectMilestone(
  projectId: string,
  milestoneId: string,
  payload: MilestoneUpdatePayload,
): Promise<void> {
  await api.patch(`/projects/${projectId}/milestone/${milestoneId}`, payload)
}

export async function deleteProjectMilestone(
  projectId: string,
  milestoneId: string,
): Promise<void> {
  await api.delete(`/projects/${projectId}/milestone/${milestoneId}`)
}

export async function addProjectMembers(projectId: string, userIds: string[]) {
  const response = await api.post(`/projects/${projectId}/members`, {
    memberIds: userIds,
  })
  const result = response.data.data as { added: string[]; failed: string[] }
  if (
    !userIds.every((id) => result.added.includes(id)) ||
    result.failed.length
  ) {
    throw new Error(
      'Some members could not be added. Refresh the list and try again.',
    )
  }
}

export async function removeProjectMembers(
  projectId: string,
  membershipIds: string[],
) {
  // Removal expects the project_members row ID, not the user's ID.
  const response = await api.delete(`/projects/${projectId}/members`, {
    data: { memberIds: membershipIds },
  })

  const result = response.data.data as { removed: string[]; failed: string[] }

  if (result.failed.length > 0) {
    throw new Error(
      'Some members could not be removed. Refresh the list and try again.',
    )
  }
}

export interface GetProjectActivitiesResponse {
  projectActivities: ProjectActivityEntry[]
  hasMore: boolean
  cursor: { time: string; id: string } | null
}

export async function createProjectComment(
  projectId: string,
  content: string,
): Promise<void> {
  await api.post(`/projects/${projectId}/comments`, { content })
}

export async function updateProjectComment(
  projectId: string,
  commentId: string,
  content: string,
): Promise<void> {
  await api.patch(`/projects/${projectId}/comments/${commentId}`, { content })
}

export async function deleteProjectComment(
  projectId: string,
  commentId: string,
): Promise<void> {
  await api.delete(`/projects/${projectId}/comments/${commentId}`)
}

export async function getProjectActivities(
  projectId: string,
  cursor?: { time: string; id: string },
): Promise<GetProjectActivitiesResponse> {
  const resp = await api.get(`/projects/${projectId}/activity`, {
    params: {
      ...(cursor && { cursorTime: cursor.time, cursorId: cursor.id }),
    },
  })
  return resp.data.data
}
