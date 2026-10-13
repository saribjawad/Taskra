import { createContext } from 'react'
import type { ChatMessage } from '#/type/conversation'

export interface WebsocketContextValue {
  activeUserIds: string[]
  isConnected: boolean
  joinConversation: (conversationId: string) => void
  sendChatMessage: (conversationId: string, message: ChatMessage) => void
}

export const WebsocketContext = createContext<WebsocketContextValue | null>(
  null,
)
