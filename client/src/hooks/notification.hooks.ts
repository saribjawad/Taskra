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

const notificationQueryKey = ['notificaitons', 'infinite']

export function useGetUserNotifications() {
  return useInfiniteQuery({
    queryKey: notificationQueryKey,
    initialPageParam: null as NotificationCursor | null,
    queryFn: async ({ pageParam }) => getUserNotifications(pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.cursor : undefined,
  })
}

export function useMarkNotificationAsSeen() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markNotificationAsSeen,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationQueryKey }),
  })
}

export function useMarkAllNotificationsAsSeen() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsAsSeen,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationQueryKey }),
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationQueryKey }),
  })
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationQueryKey }),
  })
}
