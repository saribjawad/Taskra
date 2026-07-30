import { createContext } from 'react'

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

export const AuthContext = createContext<IAuthContext | null>(null)
