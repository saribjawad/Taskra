import { api } from '#/lib/api'

export async function getMe() {
  const resp = await api.get('/users/me')
  return resp.data.data
}
