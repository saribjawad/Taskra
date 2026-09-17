import { getUserNotifications } from '#/service/notification.service'
import type { NotificationCursor } from '#/service/notification.service'
import { useInfiniteQuery } from '@tanstack/react-query'

export function useGetUserNotifications() {
  return useInfiniteQuery({
    queryKey: ['notificaitons', 'infinite'],
    initialPageParam: null as NotificationCursor | null,
    queryFn: async ({ pageParam }) => getUserNotifications(pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.cursor : undefined,
  })
}
