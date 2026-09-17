import { api } from '#/lib/api'
import type { Notification } from '#/type/notification'

export type NotificationCursor = {
  time: string
  id: string
}

interface GetUserNotificationResponse {
  notifications: Notification[]
  hasMore: boolean
  cursor: NotificationCursor | null
}

export async function getUserNotifications(
  cursor: NotificationCursor | null = null,
): Promise<GetUserNotificationResponse> {
  const resp = await api.get('/notifications', {
    params: cursor
      ? { cursorTime: cursor.time, cursorId: cursor.id }
      : undefined,
  })

  return resp.data.data
}
