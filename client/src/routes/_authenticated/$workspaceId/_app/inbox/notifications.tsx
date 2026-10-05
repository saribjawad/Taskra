import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Bell, Check, CheckCheck, Mail, MailOpen, Trash2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { notificationPresentation } from '#/constants/notifications'
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { cn } from '#/lib/utils'
import {
  useGetUserNotifications,
  useDeleteNotification,
  useMarkNotificationAsSeen,
} from '#/hooks/notification.hooks'
import { Spinner } from '#/components/ui/spinner'
import { toast } from 'sonner'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/_app/inbox/notifications',
)({
  component: NotificationInbox,
})

function NotificationInbox() {
  const scrollRef = useRef<HTMLElement>(null)

  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [readOverrides, setReadOverrides] = useState<Record<string, boolean>>(
    {},
  )
  const [deletedOverrides, setDeletedOverrides] = useState<
    Record<string, boolean>
  >({})
  const { mutate: markNotificationAsSeen } = useMarkNotificationAsSeen()
  const { mutate: deleteNotification } = useDeleteNotification()
  const { data, isPending, isError, isFetching, hasNextPage, fetchNextPage } =
    useGetUserNotifications()

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? []

  // Formating data, adding read, time, group
  const formatedNotifications = notifications
    .filter((item) => !deletedOverrides[item.id])
    .map((item) => {
      const createdAt = new Date(item.createdAt)

      return {
        ...item,
        read: readOverrides[item.id] ?? item.seen,
        time: formatDistanceToNow(createdAt, { addSuffix: true }),
        group: isToday(createdAt)
          ? 'Today'
          : isYesterday(createdAt)
            ? 'Yesterday'
            : 'Earlier',
      }
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))

  const unread = formatedNotifications.filter((item) => !item.read).length
  const visible = formatedNotifications.filter(
    (item) => filter === 'all' || !item.read,
  )

  function markAsRead(id: string) {
    const notification = formatedNotifications.find((item) => item.id === id)

    if (!notification || notification.read) return

    setReadOverrides((items) => ({ ...items, [id]: true }))
    markNotificationAsSeen(id, {
      onError: () => {
        setReadOverrides((items) => ({ ...items, [id]: false }))
        toast.error('Could not mark notification as read')
      },
    })
  }

  function removeNotification(id: string) {
    setDeletedOverrides((items) => ({ ...items, [id]: true }))
    deleteNotification(id, {
      onSuccess: () => toast.success('Notification deleted'),
      onError: () => {
        setDeletedOverrides((items) => ({ ...items, [id]: false }))
        toast.error('Could not delete notification')
      },
    })
  }

  // Infinite Scroll
  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    let requesting = false

    function handleScroll() {
      // Check if near bottom
      if (
        element &&
        hasNextPage &&
        !isFetching &&
        !isError &&
        !requesting &&
        element.clientHeight + element.scrollTop + 40 >= element.scrollHeight
      ) {
        requesting = true
        void fetchNextPage().finally(() => {
          requesting = false
        })
      }
    }

    element.addEventListener('scroll', handleScroll)

    handleScroll()

    return () => element.removeEventListener('scroll', handleScroll)
  }, [hasNextPage, isFetching, isError, fetchNextPage, visible.length])

  return (
    <section
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain"
      aria-label="Notifications"
    >
      <div>
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Your notifications
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Task assignments, comments, and reminders in one place.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              disabled={unread === 0}
              onClick={() =>
                setReadOverrides((items) => ({
                  ...items,
                  ...Object.fromEntries(
                    formatedNotifications.map((item) => [item.id, true]),
                  ),
                }))
              }
            >
              <CheckCheck className="size-4" />
              <span>Mark all as read</span>
            </Button>
          </div>
          <div className="mb-5 flex items-center justify-between gap-3 border-b pb-3">
            <div className="flex gap-1" aria-label="Filter notifications">
              {(['all', 'unread'] as const).map((value) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="sm"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={cn(
                    'h-8 text-muted-foreground',
                    filter === value && 'bg-muted text-foreground',
                  )}
                >
                  {value === 'all' ? 'All' : 'Unread'}
                  {value === 'unread' && (
                    <span className="text-xs text-muted-foreground">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatedNotifications.length > 9
                ? '9+'
                : formatedNotifications.length}{' '}
              notifications
            </span>
          </div>
          {isPending ? (
            <p
              className="flex flex-col items-center gap-3 py-20 text-center text-sm text-muted-foreground"
              role="status"
            >
              <Spinner className="size-5" />
              Loading notifications…
            </p>
          ) : isError ? (
            <p
              className="py-20 text-center text-sm text-destructive"
              role="alert"
            >
              Unable to load notifications. Please try again later.
            </p>
          ) : visible.length === 0 ? (
            <div
              className="flex flex-col items-center px-4 py-20 text-center"
              role="status"
            >
              <div className="mb-4 rounded-full bg-muted p-3">
                <Bell className="size-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium">
                {notifications.length === 0
                  ? 'No notifications yet'
                  : 'You’re all caught up'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === 'unread' && notifications.length > 0
                  ? 'No unread notifications. Your updates are in All.'
                  : 'Your notifications will appear here.'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => setFilter('all')}
              >
                View all notifications
              </Button>
            </div>
          ) : (
            (['Today', 'Yesterday', 'Earlier'] as const).map((group) => {
              const items = visible.filter((item) => item.group === group)

              if (!items.length) return null

              return (
                <section key={group} className="mb-7" aria-label={group}>
                  <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                    {group}
                  </h3>
                  <ul className="divide-y divide-border/60">
                    {items.map((item) => {
                      const { icon: Icon, title } =
                        notificationPresentation[item.type]
                      return (
                        <li
                          key={item.id}
                          className={cn(
                            'group flex items-start gap-3 rounded-md px-2 py-4 sm:px-3',
                            !item.read && 'bg-muted/30',
                          )}
                        >
                          <div
                            className={cn(
                              'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border text-muted-foreground',
                              !item.read &&
                                'border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400',
                            )}
                          >
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                              <span className="text-xs text-muted-foreground">
                                {title}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {item.time}
                              </span>
                            </div>
                            <p
                              className={cn(
                                'mt-1 text-sm leading-5 wrap-break-words',
                                !item.read
                                  ? 'font-medium text-foreground'
                                  : 'text-foreground/80',
                              )}
                            >
                              {title}
                            </p>
                            <p className="mt-1 text-sm leading-6 wrap-break-words text-muted-foreground">
                              {item.message}
                            </p>
                          </div>
                          <div className="flex w-8 shrink-0 flex-col items-center gap-1 pt-1">
                            <span
                              className={cn(
                                'size-1.5 rounded-full',
                                !item.read ? 'bg-indigo-500' : 'bg-transparent',
                              )}
                            >
                              <span className="sr-only">
                                {item.read ? 'Read' : 'Unread'}
                              </span>
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7 text-muted-foreground"
                              disabled={item.read}
                              aria-label={`${item.read ? 'Already read' : 'Mark as read'}: ${title}`}
                              title={
                                item.read ? 'Already read' : 'Mark as read'
                              }
                              onClick={() => markAsRead(item.id)}
                            >
                              {item.read ? (
                                <Mail className="size-3.5" />
                              ) : (
                                <MailOpen className="size-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7 text-muted-foreground hover:text-destructive"
                              aria-label={`Delete notification: ${title}`}
                              title="Delete notification"
                              onClick={() => removeNotification(item.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })
          )}
          <p className="flex items-center justify-center gap-1.5 pb-3 text-xs text-muted-foreground">
            <Check className="size-3" />
            You’re viewing your notifications
          </p>
        </div>
      </div>
    </section>
  )
}
