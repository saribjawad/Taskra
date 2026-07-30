import { useGetMe } from '#/hooks/user.hooks'
import type { ReactNode } from 'react'
import { AuthContext } from './auth-context'

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useGetMe()

  return (
    <AuthContext.Provider
      value={{
        user: data ?? null,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
