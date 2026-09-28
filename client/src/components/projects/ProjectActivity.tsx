import { useEffect, useId, useRef } from 'react'
import type { RefObject } from 'react'
import {
  ActivityEventRow,
  ActivityEventSkeleton,
} from '#/components/activity/ActivityEventRow'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import type { ProjectDetail } from '#/type/project'
import type { ProjectActivity as ProjectActivityItem } from '#/type/projectActivity'
import { useGetProjectActivity } from '#/hooks/project.hooks'
import {
  Box,
  CalendarDays,
  CircleDot,
  Flag,
  RefreshCw,
  Sparkles,
  UsersRound,
  UserRound,
} from 'lucide-react'

function getProjectActivityIcon(type: ProjectActivityItem['type']) {
  const className = 'size-3.5'

  switch (type) {
    case 'project_created':
      return <Box className={className} />
    case 'lead_changed':
      return <UserRound className={className} />
    case 'member_added':
    case 'member_removed':
      return <UsersRound className={className} />
    case 'priority_changed':
      return <Flag className={className} />
    case 'status_changed':
      return <CircleDot className={className} />
    case 'start_date_changed':
    case 'end_date_changed':
      return <CalendarDays className={className} />
    case 'milestone_added':
    case 'milestone_removed':
    case 'milestone_changed':
      return <Sparkles className={className} />
    default:
      return <RefreshCw className={className} />
  }
}

export default function ProjectActivity({
  project,
  compact = false,
  onSeeAll,
  scrollRootRef,
}: {
  project: ProjectDetail
  compact?: boolean
  onSeeAll?: () => void
  scrollRootRef?: RefObject<HTMLDivElement | null>
}) {
  const headingId = useId()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const {
    data,
    isError,
    isPending,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetProjectActivity(project.id)
  const activities = data?.pages.flatMap((page) => page.projectActivities) ?? []

  useEffect(() => {
    if (compact || !hasNextPage || isFetchingNextPage) return

    const target = loadMoreRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void fetchNextPage()
        }
      },
      { root: scrollRootRef?.current ?? null, rootMargin: '120px' },
    )
    observer.observe(target)

    return () => observer.disconnect()
  }, [compact, fetchNextPage, hasNextPage, isFetchingNextPage, scrollRootRef])

  return (
    <section
      aria-labelledby={headingId}
      className={cn(compact && 'rounded-xl border bg-muted/20 p-4')}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-sm font-medium">
          Activity
        </h2>
        {onSeeAll && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground"
            onClick={onSeeAll}
          >
            See all
          </Button>
        )}
      </div>

      {isPending ? (
        <ActivityEventSkeleton />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">
          Could not load project activity.
        </p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <div className="space-y-3">
          {(compact ? activities.slice(0, 2) : activities).map((activity) => (
            <ActivityEventRow
              key={activity.id}
              icon={getProjectActivityIcon(activity.type)}
              description={activity.description}
              createdAt={activity.createdAt}
            />
          ))}
          {!compact && hasNextPage && (
            <div ref={loadMoreRef} className="py-2">
              {isFetchingNextPage && <ActivityEventSkeleton />}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
