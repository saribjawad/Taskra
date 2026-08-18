import type { SignInFormPayload } from '#/routes/_public/sign-in'
import type { SignUpFormPayload } from '#/routes/_public/sign-up'
import type { VerifyEmailFormPayload } from '#/routes/_public/verify-email'
import {
  forgotPassword,
  resendCode,
  resetPassword,
  signIn,
  signOut,
  signUp,
  verifyEmail,
} from '#/service/auth.service'
import type { ApiErrorResponse } from '#/type'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'

export const useSignIn = () => {
  const navigate = useNavigate()
  const inviteRedirect = sessionStorage.getItem('invite-redirect')
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SignInFormPayload) => signIn(payload),
    onError: (err: AxiosError<ApiErrorResponse>) => {
      const serverErrorMessage =
        err.response?.data.message || 'An error occurred'
      toast.error(serverErrorMessage)
    },
    onSuccess: async () => {
      // refetch useGetMe
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      if (inviteRedirect) {
        navigate({
          to: JSON.parse(inviteRedirect),
        })
      } else {
        navigate({
          to: '/',
        })
      }
    },
  })
}

export const useSignOut = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => signOut(),
    onError: (err: AxiosError<ApiErrorResponse>) => {
      const serverErrorMessage =
        err.response?.data.message || 'An error occurred'
      toast.error(serverErrorMessage)
    },
    onSuccess: () => {
      queryClient.setQueryData(['me'], null)
      navigate({
        to: '/sign-in',
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
      toast.error(serverErrorMessage)
    },
    onSuccess: async (_, variables) => {
      toast('Verify your email to get started')
      navigate({
        to: `/verify-email?email=${variables.email}`,
      })
    },
  })
}

export const useVerifyEmail = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: VerifyEmailFormPayload) => verifyEmail(payload),
    onError: (err: AxiosError<ApiErrorResponse>) => {
      // TODO: add err toast
      const serverErrorMessage =
        err.response?.data.message || 'An error occurred'
      console.error('error inside the on error', serverErrorMessage)
    },
    onSuccess: async () => {
      toast('Email verified')
      navigate({
        to: '/sign-in',
      })
    },
  })
}

export const useResendCode = () => {
  return useMutation({
    mutationFn: (email: string) => resendCode(email),
    onError: (err: AxiosError<ApiErrorResponse>) => {
      // TODO: add err toast
      const serverErrorMessage =
        err.response?.data.message || 'An error occurred'
      console.error('error inside the on error', serverErrorMessage)
    },
    onSuccess: async () => {
      toast('If an account exists, a verification code has been sent.')
    },
  })
}

export const useForgotPassword = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (email: string) => forgotPassword(email),
    onError: (err: AxiosError<ApiErrorResponse>) => {
      const serverErrorMessage =
        err.response?.data.message || 'An error occurred'
      toast.error(serverErrorMessage)
    },
    onSuccess: () => {
      toast(
        "If an account exists for that email, we've sent a password reset link to it.",
      )
      navigate({
        to: '/sign-in',
      })
    },
  })
}

export const useResetPassword = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      resetPassword(token, password),
    onError: (err: AxiosError<ApiErrorResponse>) => {
      const serverErrorMessage =
        err.response?.data.message || 'An error occurred'
      toast.error(serverErrorMessage)
    },
    onSuccess: () => {
      toast(
        'Your password has been reset. You can now sign in with your new password.',
      )
      navigate({
        to: '/sign-in',
      })
    },
  })
}
