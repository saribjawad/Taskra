import { api } from '#/lib/api'
import type { CreateWorkspaceFormPayload } from '#/routes/_authenticated/create-workspace'

interface CreateWorkspaceResponse {
  statusCode: number
  message: string
  data: {
    workspaceId: string
  }
  success: boolean
}

export async function createWorkspace(
  payload: CreateWorkspaceFormPayload,
): Promise<CreateWorkspaceResponse> {
  const resp = await api.post('/workspace', payload)

  return resp.data.data
}
