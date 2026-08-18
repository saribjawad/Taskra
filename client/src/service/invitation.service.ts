import { api } from '#/lib/api'

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
