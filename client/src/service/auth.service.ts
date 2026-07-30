import { api } from '#/lib/api'
import type { SignInFormPayload } from '#/routes/_public/sign-in'
import type { SignUpFormPayload } from '#/routes/_public/sign-up'
import type { VerifyEmailFormPayload } from '#/routes/_public/verify-email'

interface SignInResponse {
  message: string
  statusCode: 200
  success: true
}

interface SignUpResponse {
  statusCode: 201
  message: string
  success: true
}

interface VerifyEmailResponse {
  statusCode: 201
  message: string
  success: true
}

export async function signIn(
  payload: SignInFormPayload,
): Promise<SignInResponse> {
  const resp = await api.post('/sign-in', payload)

  return resp.data.data
}

export async function signUp(
  payload: SignUpFormPayload,
): Promise<SignUpResponse> {
  const resp = await api.post('/sign-up', payload)

  return resp.data.data
}

export async function verifyEmail(
  payload: VerifyEmailFormPayload,
): Promise<VerifyEmailResponse> {
  const resp = await api.patch('/verify-email', payload)

  return resp.data.data
}

export async function resendCode(email: string): Promise<VerifyEmailResponse> {
  const resp = await api.post('/resend-code', {
    email,
  })

  return resp.data.data
}
