import { Link } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import {
  AlertCircle,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleX,
  Diamond,
  LoaderCircle,
  SignalHigh,
  SignalLow,
  SignalMedium,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { useGetProjectTasks } from '#/hooks/project.hooks'
import { cn, formatLabel } from '#/lib/utils'
import { LABEL_ITEMS, PRIORITY_ITEMS, STATUS_ITEMS } from '#/constants'
import type { ProjectDetail, ProjectTask } from '#/type/project'
import type { TaskLabelType, TaskPriorityType, TaskStatusType } from '#/type'

const statusIcons = {
  backlog: CircleDashed,
  todo: Circle,
  in_progress: CircleDot,
  done: CircleCheck,
  cancelled: CircleX,
}

const priorityIcons = {
  urgent: AlertCircle,
  high: SignalHigh,
  medium: SignalMedium,
  low: SignalLow,
  no_priority: null,
}

const ALL_VALUE = 'all'

function FilterSelect({
  value,
  placeholder,
  allLabel,
  items,
  onChange,
}: {
  value: string
  placeholder: string
  allLabel: string
  items: { label: string; value: string }[]
  onChange: (value: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        aria-label={placeholder}
        className={cn(
          'h-7 w-auto min-w-24 rounded-md border-transparent bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:bg-muted hover:text-foreground',
          value !== ALL_VALUE && 'bg-muted text-foreground',
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start">
        <SelectItem value={ALL_VALUE}>{allLabel}</SelectItem>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ProjectTaskRow({
  task,
  workspaceId,
  milestones,
}: {
  task: ProjectTask
  workspaceId: string
  milestones: ProjectDetail['milestones']
}) {
  const StatusIcon = statusIcons[task.status]
  const PriorityIcon = priorityIcons[task.priority]
  const label = LABEL_ITEMS.find((item) => item.value === task.label)?.label
  const milestone = milestones.find((item) => item.id === task.milestoneId)

  return (
    <Link
      to="/$workspaceId/tasks/$taskId"
      params={{ workspaceId, taskId: task.id }}
      search={{ from: 'all' }}
      className="group flex min-w-0 items-center gap-3 border-b border-border/60 px-2 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring sm:gap-4 sm:px-3"
    >
      <StatusIcon
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {task.title}
      </span>
      {task.milestoneId && (
        <span
          title={milestone?.name ?? 'Connected to a milestone'}
          className="inline-flex max-w-36 shrink-0 items-center gap-1.5 truncate rounded-md bg-muted/60 px-2 py-1 text-xs text-muted-foreground"
        >
          <Diamond className="size-3 shrink-0" />
          <span className="truncate">{milestone?.name ?? 'Milestone'}</span>
        </span>
      )}
      {label && (
        <span className="hidden w-24 truncate text-xs text-muted-foreground md:block">
          {label}
        </span>
      )}
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatLabel(task.status)}
      </span>
      {PriorityIcon ? (
        <PriorityIcon
          className="size-4 shrink-0 text-muted-foreground"
          aria-label={`${formatLabel(task.priority)} priority`}
        />
      ) : (
        <span className="w-4 shrink-0" aria-label="No priority" />
      )}
    </Link>
  )
}

export default function ProjectTasks({
  project,
  scrollRootRef,
}: {
  project: ProjectDetail
  scrollRootRef: RefObject<HTMLDivElement | null>
}) {
  const [milestoneFilter, setMilestoneFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [labelFilter, setLabelFilter] = useState('all')
  const filters = {
    milestoneId: milestoneFilter === 'all' ? undefined : milestoneFilter,
    status:
      statusFilter === 'all' ? undefined : (statusFilter as TaskStatusType),
    priority:
      priorityFilter === 'all'
        ? undefined
        : (priorityFilter as TaskPriorityType),
    label: labelFilter === 'all' ? undefined : (labelFilter as TaskLabelType),
  }
  const hasActiveFilters = Object.values(filters).some(Boolean)
  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const query = useGetProjectTasks(project.id, filters)
  const fetchNextPage = query.fetchNextPage
  const tasks = query.data?.pages.flatMap((page) => page.tasks) ?? []
  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestingRef = useRef(false)

  const loadNextPage = useCallback(async () => {
    if (
      !query.hasNextPage ||
      query.isFetching ||
      query.isFetchNextPageError ||
      requestingRef.current
    ) {
      return
    }

    requestingRef.current = true
    try {
      await fetchNextPage()
    } finally {
      requestingRef.current = false
    }
  }, [
    fetchNextPage,
    query.hasNextPage,
    query.isFetching,
    query.isFetchNextPageError,
  ])

  // Load near the bottom and when the bottom sentinel enters the scroll panel.
  useEffect(() => {
    const root = scrollRootRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return

    function handleScroll() {
      if (
        root &&
        root.clientHeight + root.scrollTop + 100 >= root.scrollHeight
      ) {
        void loadNextPage()
      }
    }

    root.addEventListener('scroll', handleScroll)
    handleScroll()
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadNextPage()
      },
      { root, rootMargin: '100px' },
    )
    observer.observe(sentinel)

    return () => {
      root.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [loadNextPage, tasks.length, scrollRootRef])

  return (
    <section aria-labelledby="project-tasks-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="project-tasks-heading" className="text-lg font-medium">
            Tasks
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tasks connected to this project.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                <SlidersHorizontal className="size-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded bg-muted px-1.5 text-xs text-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 gap-3 p-4">
              <p className="text-sm font-medium">Filter tasks</p>
              {[
                {
                  label: 'Status',
                  value: statusFilter,
                  allLabel: 'Any status',
                  items: STATUS_ITEMS,
                  onChange: setStatusFilter,
                },
                {
                  label: 'Priority',
                  value: priorityFilter,
                  allLabel: 'Any priority',
                  items: PRIORITY_ITEMS,
                  onChange: setPriorityFilter,
                },
                {
                  label: 'Label',
                  value: labelFilter,
                  allLabel: 'Any label',
                  items: LABEL_ITEMS,
                  onChange: setLabelFilter,
                },
                {
                  label: 'Milestone',
                  value: milestoneFilter,
                  allLabel: 'Any milestone',
                  items: project.milestones.map((milestone) => ({
                    label: milestone.name,
                    value: milestone.id,
                  })),
                  onChange: setMilestoneFilter,
                },
              ].map((filter) => (
                <div
                  key={filter.label}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-xs text-muted-foreground">
                    {filter.label}
                  </span>
                  <FilterSelect
                    value={filter.value}
                    placeholder={filter.label}
                    allLabel={filter.allLabel}
                    items={filter.items}
                    onChange={filter.onChange}
                  />
                </div>
              ))}
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 rounded-md text-muted-foreground"
              onClick={() => {
                setMilestoneFilter(ALL_VALUE)
                setStatusFilter(ALL_VALUE)
                setPriorityFilter(ALL_VALUE)
                setLabelFilter(ALL_VALUE)
              }}
              aria-label="Clear task filters"
            >
              <X />
            </Button>
          )}
        </div>
      </div>

      {query.isPending ? (
        <div
          className="space-y-3 py-2"
          role="status"
          aria-label="Loading project tasks"
        >
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-10 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="rounded-xl border border-dashed px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Unable to load project tasks.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed px-5 py-12 text-center">
          <h3 className="text-sm font-medium">
            {hasActiveFilters ? 'No tasks match these filters' : 'No tasks yet'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasActiveFilters
              ? 'Try changing or clearing the selected filters.'
              : 'Tasks connected to this project will appear here.'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                setMilestoneFilter('all')
                setStatusFilter('all')
                setPriorityFilter('all')
                setLabelFilter('all')
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            {tasks.map((task) => (
              <ProjectTaskRow
                key={task.id}
                task={task}
                workspaceId={project.workspace_id}
                milestones={project.milestones}
              />
            ))}
            {query.hasNextPage && (
              <div ref={sentinelRef} className="h-1" aria-hidden="true" />
            )}
          </div>
          {query.isFetchingNextPage && (
            <div
              role="status"
              className="flex justify-center py-3 text-muted-foreground"
            >
              <LoaderCircle className="size-4 animate-spin" />
              <span className="sr-only">Loading more tasks</span>
            </div>
          )}
          {query.isFetchNextPageError && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchNextPage()}
              >
                Retry loading tasks
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
