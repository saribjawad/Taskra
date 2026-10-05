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

export async function markNotificationAsSeen(
  notificationId: string,
): Promise<void> {
  await api.patch(`/notifications/${notificationId}/seen`)
}

export async function markAllNotificationsAsSeen(): Promise<void> {
  await api.patch('/notifications/seen')
}

export async function deleteNotification(
  notificationId: string,
): Promise<void> {
  await api.delete(`/notifications/${notificationId}`)
}

export async function deleteAllNotifications(): Promise<void> {
  await api.delete('/notifications/all')
}
