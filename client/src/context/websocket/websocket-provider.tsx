import { toast } from 'sonner'
import { useAuth } from '#/context/auth/auth-hook'
import { notificationPresentation } from '#/constants/notifications'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { WebsocketContext } from './websocket-context'
import { useQueryClient } from '@tanstack/react-query'
import type { NotificationType } from '#/type/notification'
import type { ChatMessage } from '#/type/conversation'
import { addConversationMessageToCache } from '#/lib/query-cache/conversation'

export type MessageType = NotificationType

export interface MessagePayloadType {
  type: MessageType
  message: string
  metaData?: {
    taskId?: string
    projectId?: string
    actorId?: string
  }
}

export function WebsocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeUserIds, setActiveUserIds] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)

  const sendSocketAction = useCallback((action: object) => {
    const socket = socketRef.current
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(action))
    }
  }, [])

  const joinConversation = useCallback((conversationId: string) => {
    sendSocketAction({
      type: 'conversation:new',
      payload: { conversationId },
    })
  }, [sendSocketAction])

  const sendChatMessage = useCallback((conversationId: string, message: ChatMessage) => {
    sendSocketAction({
      type: 'message:send',
      payload: { conversationId, message },
    })
  }, [sendSocketAction])

  useEffect(() => {
    let isCurrentConnection = true
    setActiveUserIds([])
    setIsConnected(false)
    const activeWorkspace = user?.activeWorkspace
    if (!user?.id || !activeWorkspace) return

    const url = new URL(import.meta.env.VITE_API_URL || 'http://localhost:3000')

    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

    // Connect to WS
    const ws = new WebSocket(url)
    socketRef.current = ws

    ws.addEventListener('open', () => {
      if (!isCurrentConnection) return
      setIsConnected(true)
    })
    ws.addEventListener('close', () => {
      if (!isCurrentConnection) return
      if (socketRef.current === ws) socketRef.current = null
      setIsConnected(false)
      setActiveUserIds([])
    })

    // Event Listeners
    ws.addEventListener('message', (event) => {
      if (!isCurrentConnection) return
      const payload = JSON.parse(event.data)

      if (!payload || typeof payload !== 'object') return

      if (payload.type === 'active:users') {
        setActiveUserIds(
          Array.isArray(payload.payload?.users)
            ? payload.payload.users.filter(
                (id: unknown): id is string => typeof id === 'string',
              )
            : [],
        )
        return
      }

      if (payload.type === 'user:connected') {
        const id = payload.payload?.id
        if (typeof id === 'string' && id !== user.id) {
          setActiveUserIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
        }
        return
      }

      if (payload.type === 'user:disconnected') {
        const id = payload.payload?.id
        if (typeof id === 'string') {
          setActiveUserIds((ids) => ids.filter((activeId) => activeId !== id))
        }
        return
      }

      if (payload.type === 'message:new') {
        const conversationId = payload.payload?.conversationId
        const message = payload.payload?.message as ChatMessage | undefined
        if (
          typeof conversationId === 'string' &&
          message &&
          typeof message.id === 'string' &&
          typeof message.content === 'string'
        ) {
          addConversationMessageToCache(
            queryClient,
            activeWorkspace,
            conversationId,
            message,
          )
        }
        return
      }

      const { type, message, metaData } = payload as Partial<MessagePayloadType>

      // Return if type is not acceptable notification type
      if (
        typeof type !== 'string' ||
        !Object.hasOwn(notificationPresentation, type) ||
        typeof message !== 'string'
      )
        return

      switch (type) {
        case 'task:completed':
          {
            const { title, icon: Icon } = notificationPresentation[type]

            // Invalidate the out dated task
            queryClient.invalidateQueries({
              queryKey: [`task-${metaData?.taskId}`],
            })

            toast(title, {
              description: message,
              icon: <Icon className="size-4" />,
            })
          }
          break

        case 'task:assigned':
          {
            const { title, icon: Icon } = notificationPresentation[type]

            // Invalidate the out dated task
            queryClient.invalidateQueries({
              queryKey: [`task-${metaData?.taskId}`],
            })

            toast(title, {
              description: message,
              icon: <Icon className="size-4" />,
            })
          }
          break
        case 'task:reporter_assigned':
          {
            const { title, icon: Icon } = notificationPresentation[type]

            // Invalidate the out dated task
            queryClient.invalidateQueries({
              queryKey: [`task-${metaData?.taskId}`],
            })

            toast(title, {
              description: message,
              icon: <Icon className="size-4" />,
            })
          }
          break
        case 'task:commented':
          {
            const { title, icon: Icon } = notificationPresentation[type]

            // Invalidate the out dated task
            queryClient.invalidateQueries({
              queryKey: [`task-${metaData?.taskId}`],
            })

            toast(title, {
              description: message,
              icon: <Icon className="size-4" />,
            })
          }
          break
        case 'task:due_soon':
        case 'invite:accepted':
        case 'invite:declined':
          {
            const { title, icon: Icon } = notificationPresentation[type]

            toast(title, {
              description: message,
              icon: <Icon className="size-4" />,
            })
          }
          break

        case 'project:completed':
        case 'project:lead_assigned':
        case 'project:member_assigned':
        case 'project:task_added':
        case 'project:commented':
        case 'project:target_date_soon':
          {
            const { title, icon: Icon } = notificationPresentation[type]

            if (metaData?.projectId) {
              queryClient.invalidateQueries({
                queryKey: ['project', user.activeWorkspace, metaData.projectId],
              })
              queryClient.invalidateQueries({
                queryKey: ['project-tasks', metaData.projectId],
              })
            }
            queryClient.invalidateQueries({
              queryKey: ['projects', user.activeWorkspace],
            })

            toast(title, {
              description: message,
              icon: <Icon className="size-4" />,
            })
          }
          break
      }
    })

    return () => {
      isCurrentConnection = false
      if (socketRef.current === ws) socketRef.current = null
      ws.close()
    }
  }, [user?.id, user?.activeWorkspace])

  return (
    <WebsocketContext.Provider
      value={{ activeUserIds, isConnected, joinConversation, sendChatMessage }}
    >
      {children}
    </WebsocketContext.Provider>
  )
}
