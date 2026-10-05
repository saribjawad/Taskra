import { api } from '#/lib/api'
import type { MemberRole } from '#/type'

export async function getMe(): Promise<{
  id: string
  email: string
  username: string
  fullName: string
  activeWorkspace: string | null
  role: MemberRole | null
}> {
  const resp = await api.get('/users/me')

  return resp.data.data
}
