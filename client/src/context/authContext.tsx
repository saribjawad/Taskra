import { useGetMe } from '#/hooks/user.hooks'
import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

interface IUser {
  id: string
  email: string
  username: string
  activeWorkspace: string | null
}

export interface IAuthContext {
  user: IUser | null
  isLoading: boolean
}

const AuthContext = createContext<IAuthContext | null>(null)

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

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
