import { api } from '#/lib/api'
import type { Team, TeamDocument, TeamLink, TeamMember } from '#/type/team'

export async function getTeams(): Promise<Team[]> {
  const response = await api.get('/teams')
  return response.data.data ?? []
}

export async function createTeam(values: {
  name: string
  identifier: string
  description?: string
}) {
  await api.post('/teams', values)
}

export async function deleteTeam(teamId: string): Promise<void> {
  await api.delete(`/teams/${teamId}`)
}

export async function getTeamLinks(teamId: string): Promise<TeamLink[]> {
  const response = await api.get(`/teams/${teamId}/link`)
  return response.data.data ?? []
}

export async function createTeamLink(
  teamId: string,
  values: { title: string; url: string },
) {
  const response = await api.post(`/teams/${teamId}/link`, values)
  return response.data.data as TeamLink
}

export async function getTeamDocuments(
  teamId: string,
): Promise<TeamDocument[]> {
  const response = await api.get(`/teams/${teamId}/document`)
  return response.data.data ?? []
}

export async function createTeamDocument(
  teamId: string,
  values: { name: string; content?: string },
) {
  const response = await api.post(`/teams/${teamId}/document`, values)
  return response.data.data as TeamDocument
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const response = await api.get(`/teams/${teamId}/member`)
  return response.data.data ?? []
}

export async function addTeamMembers(teamId: string, memberIds: string[]) {
  const response = await api.post(`/teams/${teamId}/member`, { memberIds })
  return response.data.data as {
    added: string[]
    alreadyAdded: string[]
    failed: string[]
  }
}

export async function removeTeamMember(teamId: string, memberId: string) {
  await api.delete(`/teams/${teamId}/member/${memberId}`)
}
