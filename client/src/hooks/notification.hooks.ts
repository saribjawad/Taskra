import {
  deleteAllNotifications,
  deleteNotification,
  getUserNotifications,
  markAllNotificationsAsSeen,
  markNotificationAsSeen,
} from '#/service/notification.service'
import type { NotificationCursor } from '#/service/notification.service'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useAuth } from '#/context/auth/auth-hook'

export const notificationQueryKey = (workspaceId: string | null) =>
  ['notifications', workspaceId, 'infinite'] as const

export function useGetUserNotifications() {
  const { user } = useAuth()
  const workspaceId = user?.activeWorkspace ?? null

  return useInfiniteQuery({
    queryKey: notificationQueryKey(workspaceId),
    initialPageParam: null as NotificationCursor | null,
    queryFn: async ({ pageParam }) => getUserNotifications(pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.cursor : undefined,
    enabled: Boolean(workspaceId),
  })
}

export function useMarkNotificationAsSeen() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: markNotificationAsSeen,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: notificationQueryKey(user?.activeWorkspace ?? null),
      }),
  })
}

export function useMarkAllNotificationsAsSeen() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: markAllNotificationsAsSeen,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: notificationQueryKey(user?.activeWorkspace ?? null),
      }),
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: notificationQueryKey(user?.activeWorkspace ?? null),
      }),
  })
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: notificationQueryKey(user?.activeWorkspace ?? null),
      }),
  })
}
