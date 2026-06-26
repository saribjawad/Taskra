import { api } from '#/lib/api'
import type { CreateWorkspaceFormPayload } from '#/routes/_authenticated/create-workspace'

export async function createWorkspace(payload: CreateWorkspaceFormPayload) {
  const resp = await api.post('/workspace', payload)

  console.log(resp)
}
