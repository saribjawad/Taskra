import { getMe } from '#/service/user.service'
import type { CreateWorkspaceFormPayload } from '#/routes/_authenticated/create-workspace'
import {
  createWorkspace,
  deleteWorkspace,
  getUsersWorkspaces,
  getWorkspaceUsers,
  removeUserFromWorkspace,
  switchWorkspace,
} from '#/service/workspace.service'
import type { ApiErrorResponse } from '#/type'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'

export const useGetUserWorkspace = () => {
  return useQuery({
    queryKey: ['users-workspaces'],
    queryFn: getUsersWorkspaces,
    retry: 2,
  })
}

export const useGetWorkspaceUsers = (workspaceId: string) => {
  return useQuery({
    queryKey: [`workspace-${workspaceId}-users`],
    queryFn: () => getWorkspaceUsers(workspaceId),
    retry: 2,
  })
}

export const useDeleteWorkspace = () => {
  const query = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (workspaceId: string) => deleteWorkspace(workspaceId),
    onSuccess: async (data, deletedWorkspaceId) => {
      // Manually update the user's active workspace & remove deleted workspace from users workspaces
      query.setQueryData(['me'], await getMe())

      query.setQueryData(['users-workspaces'], (old: any) => {
        return old.filter(
          (w: { id: string; name: string }) => w.id !== deletedWorkspaceId,
        )
      })

      if (data.newActiveWorkspaceId) {
        navigate({
          to: `/${data.newActiveWorkspaceId}`,
        })
      } else {
        navigate({
          to: '/create-workspace',
        })
      }
    },
  })
}

export const useRemoveMemberFromWorkspace = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      workspaceId,
      memberId,
    }: {
      workspaceId: string
      memberId: string
    }) => removeUserFromWorkspace(workspaceId, memberId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`workspace-${variables.workspaceId}-users`],
      })
      toast.success('Member removed from workspace')
    },
    onError: () => {
      toast.error('Failed to remove member')
    },
  })
}

export const useSwitchWorkspace = () => {
  const query = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (workspaceId: string) => switchWorkspace(workspaceId),
    onSuccess: async (data) => {
      query.setQueryData(['me'], await getMe())
      // Mark caches stale without fetching the old page with the new session.
      await query.invalidateQueries({ refetchType: 'none' })

      navigate({
        to: `/${data.workspace_id}`,
      })
    },
  })
}

export const useCreateWorkspace = () => {
  const navigate = useNavigate()
  const query = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateWorkspaceFormPayload) =>
      createWorkspace(payload),
    onError: (err: AxiosError<ApiErrorResponse>) => {
      // TODO: add err toast
      const serverErrorMessage =
        err.response?.data.message || 'An error occurred'
      console.error('error inside the on error', serverErrorMessage)
    },
    onSuccess: async (data) => {
      query.setQueryData(['me'], await getMe())

      navigate({
        to: `/${data.workspaceId}`,
      })
    },
  })
}
