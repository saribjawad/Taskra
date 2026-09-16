import { toast } from 'sonner'
import { useAuth } from '#/context/auth/auth-hook'
import { notificationPresentation } from '#/constants/notifications'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { WebsocketContext } from './websocket-context'
import { useQueryClient } from '@tanstack/react-query'

export type MessageType =
  | 'task:completed'
  | 'task:assigned'
  | 'task:reporter_assigned'
  | 'task:commented'
  | 'task:due_soon'

export interface MessagePayloadType {
  type: MessageType
  message: string
  metaData?: {
    taskId?: string
    actorId?: string
  }
}

export function WebsocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!user?.id || !user.activeWorkspace) return

    const url = new URL(import.meta.env.VITE_API_URL || 'http://localhost:3000')

    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

    // Connect to WS
    const ws = new WebSocket(url)

    // Event Listeners
    ws.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data)

      if (!payload || typeof payload !== 'object') return

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
          {
            const { title, icon: Icon } = notificationPresentation[type]

            toast(title, {
              description: message,
              icon: <Icon className="size-4" />,
            })
          }
          break
      }
    })

    return () => ws.close()
  }, [user?.id, user?.activeWorkspace])

  return (
    <WebsocketContext.Provider value={{}}>{children}</WebsocketContext.Provider>
  )
}
