import { useEffect, useMemo, useRef, useState, useDeferredValue } from 'react'
import { Link } from '@tanstack/react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { CircleDotDashed, Search } from 'lucide-react'
import { LABEL_ITEMS, PRIORITY_ITEMS, STATUS_ITEMS } from '#/constants'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Skeleton } from '#/components/ui/skeleton'
import { getTasks } from '#/service/task.service'
import type { TaskLabelType, TaskPriorityType, TaskStatusType } from '#/type'
import type { Team } from '#/type/team'

const pageSize = 20

export function TeamIssuesPanel({
  team,
  workspaceId,
}: {
  team: Team
  workspaceId: string
}) {
  const [searchText, setSearchText] = useState('')
  const [status, setStatus] = useState<TaskStatusType | undefined>()
  const [priority, setPriority] = useState<TaskPriorityType | undefined>()
  const [label, setLabel] = useState<TaskLabelType | undefined>()
  const search = useDeferredValue(searchText.trim())
  const sentinelRef = useRef<HTMLDivElement>(null)
  // Use the workspace tasks endpoint until a team-specific tasks API exists.
  const {
    data,
    isPending,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      'team-issues',
      workspaceId,
      team.id,
      search,
      status,
      priority,
      label,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getTasks({
        page: pageParam,
        limit: pageSize,
        filter: 'all',
        search: search || undefined,
        status,
        priority,
        label,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.metadata.hasNextPage ? lastPage.metadata.page + 1 : undefined,
    enabled: Boolean(workspaceId && team.id),
  })

  const tasks = useMemo(
    () => data?.pages.flatMap((page) => page.tasks) ?? [],
    [data],
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void fetchNextPage()
      },
      { rootMargin: '240px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  function setFilter<T extends string>(
    value: string,
    setter: (next: T | undefined) => void,
  ) {
    setter(value === 'all' ? undefined : (value as T))
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">{team.name} issues</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tasks in this workspace.
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search issues"
            aria-label="Search team issues"
            className="h-9 pl-8"
          />
        </div>
        {(
          [
            ['Status', STATUS_ITEMS, status, setStatus],
            ['Priority', PRIORITY_ITEMS, priority, setPriority],
            ['Label', LABEL_ITEMS, label, setLabel],
          ] as const
        ).map(([name, items, value, setter]) => (
          <Select
            key={name}
            value={value ?? 'all'}
            onValueChange={(next) =>
              setFilter(next, setter as (next: string | undefined) => void)
            }
          >
            <SelectTrigger
              size="sm"
              aria-label={`Filter by ${name.toLowerCase()}`}
            >
              <SelectValue placeholder={name} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {name.toLowerCase()}s</SelectItem>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>

      {isPending ? (
        <div
          role="status"
          aria-label="Loading team issues"
          className="divide-y divide-border/60"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 py-4">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-4 w-2/5" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div role="alert" className="py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Unable to load issues.
          </p>
          <Button variant="link" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : tasks.length ? (
        <ul className="divide-y divide-border/60 border-y border-border/60">
          {tasks.map((task) => {
            const taskStatus = STATUS_ITEMS.find(
              (item) => item.value === task.status,
            )
            const taskPriority = PRIORITY_ITEMS.find(
              (item) => item.value === task.priority,
            )
            const taskLabel = LABEL_ITEMS.find(
              (item) => item.value === task.label,
            )

            return (
              <li key={task.id}>
                <Link
                  to="/$workspaceId/tasks/$taskId"
                  params={{ workspaceId, taskId: task.id }}
                  search={{ from: 'all' }}
                  className="flex min-w-0 items-center gap-3 rounded-sm px-2 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring sm:px-3"
                >
                  <CircleDotDashed className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {task.title}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {taskStatus?.label}
                  </span>
                  <span className="hidden text-xs text-muted-foreground lg:inline">
                    {taskPriority?.label}
                  </span>
                  <span className="hidden text-xs text-muted-foreground xl:inline">
                    {taskLabel?.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : hasNextPage ? (
        <div className="border-y border-border/60 py-10 text-center text-sm text-muted-foreground">
          Looking for team issues…
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center text-center">
          <CircleDotDashed className="mb-4 size-6 text-muted-foreground" />
          <h2 className="text-sm font-medium">No team issues found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tasks in this workspace will appear here.
          </p>
        </div>
      )}

      <div ref={sentinelRef} aria-hidden="true" className="h-px" />

      {isFetchingNextPage && (
        <p
          role="status"
          className="py-4 text-center text-xs text-muted-foreground"
        >
          Loading more issues…
        </p>
      )}
    </section>
  )
}
