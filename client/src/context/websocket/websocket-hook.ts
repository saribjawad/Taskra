import { useContext } from 'react'
import { WebsocketContext } from './websocket-context'

export const useWebsocketContextHook = () => {
  const context = useContext(WebsocketContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
