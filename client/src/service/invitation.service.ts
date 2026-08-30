import { api } from '#/lib/api'
import type { MemberRole } from '#/type'

export type InvitationStatus =
  | 'pending'
  | 'expired'
  | 'accepted'
  | 'revoked'
  | 'declined'

interface VerifyWorkspaceInvitationResponse {
  id: string
  status: InvitationStatus
  email: string
  role: string // TODO: temp update after adding roles
  sentby: {
    id: string
    username: string
    email: string
  }
  workspace: {
    id: string
    name: string
  }
}

export async function verifyWorkspaceInvitation(
  token: string,
): Promise<VerifyWorkspaceInvitationResponse> {
  const resp = await api.get(`/workspace/invite/${token}/verify`)

  return resp.data.data
}

export async function acceptWorkspaceInvitation(token: string) {
  await api.post(`/workspace/invite/${token}/accept`)
}

export async function declineWorkspaceInvitation(token: string) {
  await api.post(`/workspace/invite/${token}/decline`)
}

interface InviteUserResponse {
  invited: string[]
  alreadyMembers: string[]
  alreadyInvited: string[]
  failedToCreate: string[]
  failedToSend: string[]
}

export async function inviteUser(
  emails: string[],
  workspaceId: string,
  role: MemberRole,
) {
  const resp = await api.post(`/workspace/${workspaceId}/invite`, {
    emails,
    role,
  })

  return resp.data.data
}

interface GetPendingInvitesResponse {
  id: string
  sent_by: string
  status: InvitationStatus
  email: string
  role: MemberRole
  expires_at: '2026-08-28T15:24:11.572Z'
  created_at: '2026-08-28T10:09:11.574Z'
}

export async function getPendingInvites(
  workspaceId: string,
): Promise<GetPendingInvitesResponse[]> {
  const resp = await api.get(`/workspace/${workspaceId}/invite/pending`)

  return resp.data.data
}

export async function revokeInvite(invitationId: string) {
  await api.post(`workspace/invite/${invitationId}/revoke`)
}
