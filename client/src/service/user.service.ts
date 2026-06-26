import { api } from '#/lib/api'

export async function getMe(): Promise<{
  id: string
  email: string
  username: string
  activeWorkspace: string | null
}> {
  const resp = await api.get('/users/me')

  return resp.data.data
}
