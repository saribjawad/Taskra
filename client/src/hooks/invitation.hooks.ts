import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acceptWorkspaceInvitation,
  declineWorkspaceInvitation,
  getPendingInvites,
  inviteUser,
  revokeInvite,
  verifyWorkspaceInvitation,
} from '#/service/invitation.service'
import { router } from '#/main'
import { useNavigate } from '@tanstack/react-router'
import type { MemberRole } from '#/type'
import { toast } from 'sonner'

export function useVerifyInvitation(token: string) {
  return useQuery({
    queryKey: ['invitation', 'verify', token],
    queryFn: async () => verifyWorkspaceInvitation(token),
    enabled: Boolean(token),
    retry: false,
  })
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (token: string) => acceptWorkspaceInvitation(token),
    onSuccess: async (_) => {
      sessionStorage.removeItem('invite-redirect')

      queryClient.invalidateQueries({ queryKey: ['me'] })
      queryClient.invalidateQueries({ queryKey: ['users-workspaces'] })
      await router.invalidate()
    },
  })
}

export function useDeclineInvitation() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (token: string) => declineWorkspaceInvitation(token),
    onSuccess: (_) => {
      sessionStorage.removeItem('invite-redirect')

      navigate({
        to: '/',
      })
    },
  })
}

export function useInviteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      emails,
      workspaceId,
      role,
    }: {
      emails: string[]
      workspaceId: string
      role: MemberRole
    }) => inviteUser(emails, workspaceId, role),
    // TODO: improve the toast message
    onSuccess: (data) => {
      const messages = [
        ...data.invited,
        ...data.alreadyMembers,
        ...data.alreadyInvited,
        ...data.failedToCreate,
        ...data.failedToSend,
      ]

      toast('Invitation results', {
        description: messages.join('\n'),
      })

      queryClient.invalidateQueries({
        queryKey: ['pending-invites'],
      })
    },
  })
}

export function useGetPendingInvites(workspaceId: string) {
  return useQuery({
    queryKey: ['pending-invites'],
    queryFn: () => getPendingInvites(workspaceId),
    enabled: !!workspaceId,
  })
}

export function useRevokeInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => revokeInvite(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invites'] })
      console.log('revoked invitation')
    },
  })
}
