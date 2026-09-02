import { api } from '#/lib/api'
import type { CreateWorkspaceFormPayload } from '#/routes/_authenticated/create-workspace'
import type { MemberRole } from '#/type'

interface CreateWorkspaceResponse {
  workspaceId: string
}

interface GetUserWorkspacesResponse {
  id: string
  name: string
}

interface GetWorkspaceUsersResponse {
  id: string
  username: string
  email: string
  role: MemberRole
  joined_at: string
}

interface SwitchWorkspaceResponse {
  id: string
  workspace_id: string
  user_id: string
}

interface DeleteWorkspaceResponse {
  newActiveWorkspaceId: string
}

export async function getUsersWorkspaces(): Promise<
  GetUserWorkspacesResponse[]
> {
  const resp = await api.get('/workspace')

  return resp.data.data
}

export async function getWorkspaceUsers(
  workspaceId: string,
): Promise<GetWorkspaceUsersResponse[]> {
  const resp = await api.get(`/workspace/${workspaceId}/users`)

  return resp.data.data
}

export async function removeUserFromWorkspace(
  workspaceId: string,
  memberId: string,
) {
  await api.delete(`/workspace/${workspaceId}/member/${memberId}`)
}

export async function deleteWorkspace(
  workspaceId: string,
): Promise<DeleteWorkspaceResponse> {
  const resp = await api.delete(`/workspace/${workspaceId}`)

  return resp.data.data
}

export async function switchWorkspace(
  workspaceId: string,
): Promise<SwitchWorkspaceResponse> {
  const resp = await api.post(`/workspace/${workspaceId}`)

  return resp.data.data
}

export async function createWorkspace(
  payload: CreateWorkspaceFormPayload,
): Promise<CreateWorkspaceResponse> {
  const resp = await api.post('/workspace', payload)

  return resp.data.data
}
