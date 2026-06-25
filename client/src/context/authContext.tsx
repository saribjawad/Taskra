import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface IUser {
  id: string
  email: string
  username: string
  active_workspace: string | null
}

interface IAuthContext {
  user: IUser | null
}

const AuthContext = createContext<IAuthContext | null>(null)

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null)

  useEffect(() => {
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
