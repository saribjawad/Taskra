import { router } from '#/main'
import type { CreateWorkspaceFormPayload } from '#/routes/_authenticated/create-workspace'
import {
  createWorkspace,
  getUsersWorkspaces,
  switchWorkspace,
} from '#/service/workspace.service'
import type { ApiErrorResponse } from '#/type'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { AxiosError } from 'axios'

export const useGetUserWorkspace = () => {
  return useQuery({
    queryKey: ['users-workspaces'],
    queryFn: getUsersWorkspaces,
    retry: 2,
  })
}

export const useSwitchWorkspace = () => {
  const query = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (workspaceId: string) => switchWorkspace(workspaceId),
    onSuccess: (data) => {
      query.setQueryData(['me'], (old: any) => ({
        ...old,
        activeWorkspace: data.workspace_id,
      }))

      navigate({
        to: `/${data.workspace_id}`,
      })
    },
  })
}

export const useCreateWorkspace = () => {
  const navigate = useNavigate()

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
      // TODO: use the workspaceId from data
      console.log('On success', data)

      // TODO: update the 'to' route
      navigate({
        to: '/',
      })
    },
  })
}
