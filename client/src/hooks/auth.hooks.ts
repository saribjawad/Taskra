import { router } from '#/main'
import type { SignInFormPayload } from '#/routes/_public/sign-in'
import type { SignUpFormPayload } from '#/routes/_public/sign-up'
import { signIn, signUp } from '#/service/auth.service'
import type { ApiErrorResponse } from '#/type'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { AxiosError } from 'axios'

export const useSignIn = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SignInFormPayload) => signIn(payload),
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
      navigate({
        to: '/',
      })
    },
  })
}

export const useSignUp = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: SignUpFormPayload) => signUp(payload),
    onError: (err: AxiosError<ApiErrorResponse>) => {
      // TODO: add err toast
      const serverErrorMessage =
        err.response?.data.message || 'An error occurred'
      console.error('error inside the on error', serverErrorMessage)
    },
    onSuccess: async () => {
      // TODO: add code message toast
      navigate({
        to: '/sign-in',
      })
    },
  })
}
