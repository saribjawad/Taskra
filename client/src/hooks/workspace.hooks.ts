import { router } from '#/main'
import type { CreateWorkspaceFormPayload } from '#/routes/_authenticated/create-workspace'
import { createWorkspace } from '#/service/workspace.service'
import type { ApiErrorResponse } from '#/type'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { AxiosError } from 'axios'

export const useCreateWorkspace = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateWorkspaceFormPayload) =>
      createWorkspace(payload),
    onError: (err: AxiosError<ApiErrorResponse>) => {
      // TODO: add err toast
      const serverErrorMessage =
        err.response?.data.message || 'An error occurred'
      console.error('error inside the on error', serverErrorMessage)
    },
    onSuccess: async () => {
      // refetch useGetMe
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      await router.invalidate() // re-runs beforeLoad with fresh auth
      // TODO: update the 'to' route
      navigate({
        to: '/',
      })
    },
  })
}
