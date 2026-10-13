import { useContext } from 'react'
import { WebsocketContext } from './websocket-context'

export const useWebsocketContextHook = () => {
  const context = useContext(WebsocketContext)

  if (!context)
    throw new Error('useWebsocketContext must be used within WebsocketProvider')

  return context
}
