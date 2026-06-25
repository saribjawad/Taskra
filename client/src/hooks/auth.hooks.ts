import type { SignInFormPayload } from '#/routes/sign-in'
import type { SignUpFormPayload } from '#/routes/sign-up'
import { signIn, signUp } from '#/service/auth.service'
import type { ApiErrorResponse } from '#/type'
import { useMutation } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

export const useSignIn = () => {
  return useMutation({
    mutationFn: (payload: SignInFormPayload) => signIn(payload),
    onError: (err: AxiosError<ApiErrorResponse>) => {
      // TODO: add err toast
      const serverErrorMessage =
        err.response?.data.message || 'An error occurred'
      console.error('error inside the on error', serverErrorMessage)
    },
  })
}

export const useSignUp = () => {
  return useMutation({
    mutationFn: (payload: SignUpFormPayload) => signUp(payload),
    onError: (err: AxiosError<ApiErrorResponse>) => {
      // TODO: add err toast
      const serverErrorMessage =
        err.response?.data.message || 'An error occurred'
      console.error('error inside the on error', serverErrorMessage)
    },
  })
}
