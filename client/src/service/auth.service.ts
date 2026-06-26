import { api } from '#/lib/api'
import type { SignInFormPayload } from '#/routes/_public/sign-in'
import type { SignUpFormPayload } from '#/routes/_public/sign-up'

export async function signIn(payload: SignInFormPayload) {
  const resp = await api.post('/sign-in', payload)
  console.log(resp)
}

export async function signUp(payload: SignUpFormPayload) {
  const resp = await api.post('/sign-up', payload)
  console.log(resp)
}
