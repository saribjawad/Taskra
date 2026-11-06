import CreateTaskDialog from './CreateTaskDialog'
import { useWorkspacePermissions } from '#/hooks/use-workspace-permissions'
import TaskCard from '#/components/tasks/TaskCard'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { Skeleton } from '#/components/ui/skeleton'
import { LABEL_ITEMS, PRIORITY_ITEMS, STATUS_ITEMS } from '#/constants'
import { useGetTasks } from '#/hooks/task.hook'
import { cn, normalizeSearchValue } from '#/lib/utils'
import type {
  TaskFilterType,
  TaskLabelType,
  TaskPriorityType,
  TaskStatusType,
} from '#/type'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

export type TaskListSearch = {
  page: number
  limit: number
  search?: string
  status?: TaskStatusType
  priority?: TaskPriorityType
  label?: TaskLabelType
}

type TaskListViewProps = {
  filter: TaskFilterType
  search: TaskListSearch
  onSearchChange: (search: Partial<TaskListSearch>) => void
  emptyMessage: string
  showCreateButton?: boolean
}

const ALL_VALUE = 'all'

const pageSizeItems = [5, 10, 20, 50]

const taskStatuses = STATUS_ITEMS.map((item) => item.value)
const taskPriorities = PRIORITY_ITEMS.map((item) => item.value)
const taskLabels = LABEL_ITEMS.map((item) => item.value)

export function parseTaskListSearch(
  search: Record<string, unknown>,
): TaskListSearch {
  const page = Number(search.page)
  const limit = Number(search.limit)
  const status = search.status
  const priority = search.priority
  const label = search.label
  const searchText = search.search

  return {
    // Keep URL params defensive so bad/shared links fall back to usable values.
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: pageSizeItems?.includes(limit) ? limit : 10,
    search:
      typeof searchText === 'string'
        ? normalizeSearchValue(searchText)
        : undefined,
    status: taskStatuses.includes(status as TaskStatusType)
      ? (status as TaskStatusType)
      : undefined,
    priority: taskPriorities.includes(priority as TaskPriorityType)
      ? (priority as TaskPriorityType)
      : undefined,
    label: taskLabels.includes(label as TaskLabelType)
      ? (label as TaskLabelType)
      : undefined,
  }
}

function TaskListSkeleton() {
  return (
    <div aria-label="Loading tasks" role="status">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 border-b border-border/60 px-3 py-4"
        >
          <Skeleton className="size-4 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

function FilterSelect({
  value,
  placeholder,
  allLabel,
  items,
  onChange,
}: {
  value?: string
  placeholder: string
  allLabel: string
  items: { label: string; value: string }[]
  onChange: (value: string) => void
}) {
  return (
    <Select value={value ?? ALL_VALUE} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        aria-label={placeholder}
        className={cn(
          'h-7 w-auto min-w-24 rounded-md border-transparent bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:bg-muted hover:text-foreground',
          value && 'bg-muted text-foreground',
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

export default function TaskListView({
  filter,
  search,
  onSearchChange,
  emptyMessage,
  showCreateButton,
}: TaskListViewProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const { can } = useWorkspacePermissions()
  // Keep the input responsive while the URL/query update waits for typing to pause.
  const [searchInput, setSearchInput] = useState(search.search ?? '')

  const { data, isLoading, isFetching, isError, refetch } = useGetTasks({
    filter,
    page: search.page,
    limit: search.limit,
    label: search.label,
    priority: search.priority,
    status: search.status,
    search: search.search,
  })

  function updateSearch(next: Partial<TaskListSearch>) {
    // The route owns navigation so TanStack can type each route's search params correctly.
    onSearchChange(next)
  }

  useEffect(() => {
    // Sync local input when search changes from navigation, clear filters, or browser history.
    setSearchInput(search.search ?? '')
  }, [search.search])

  useEffect(() => {
    const nextSearch = normalizeSearchValue(searchInput)

    if (nextSearch === search.search) {
      return
    }

    // Debounce text search only; selects and pagination should still feel instant.
    const timeoutId = window.setTimeout(() => {
      updateSearch({
        search: nextSearch,
        page: 1,
      })
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [search.search, searchInput])

  function setFilterValue(key: 'status' | 'priority' | 'label', value: string) {
    updateSearch({
      [key]: value === ALL_VALUE ? undefined : value,
      page: 1,
    })
  }

  const hasActiveFilters =
    Boolean(search.search) ||
    Boolean(search.status) ||
    Boolean(search.priority) ||
    Boolean(search.label)

  const activeFilterCount = [
    search.status,
    search.priority,
    search.label,
  ].filter(Boolean).length

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-3 pb-2">
        {/* Search input */}
        <div className="relative min-w-0 flex-1 sm:max-w-72">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search tasks"
            aria-label="Search tasks"
            className="h-9 border-transparent bg-transparent pl-7 text-sm shadow-none hover:bg-muted focus-visible:bg-background"
          />
        </div>

        {/* Filters */}
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
              {(
                [
                  { key: 'status', label: 'Status', items: STATUS_ITEMS },
                  { key: 'priority', label: 'Priority', items: PRIORITY_ITEMS },
                  { key: 'label', label: 'Label', items: LABEL_ITEMS },
                ] as const
              ).map(({ key, label, items }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <FilterSelect
                    value={search[key]}
                    placeholder={label}
                    allLabel={`Any ${key}`}
                    items={items}
                    onChange={(value) => setFilterValue(key, value)}
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
                updateSearch({
                  search: undefined,
                  status: undefined,
                  priority: undefined,
                  label: undefined,
                  page: 1,
                })
                setSearchInput('')
              }}
              aria-label="Clear task filters"
            >
              <X />
            </Button>
          )}
        </div>
      </div>

      {isError ? (
        <div
          role="alert"
          className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm"
        >
          <p className="text-muted-foreground">Unable to load tasks.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : isLoading ? (
        <TaskListSkeleton />
      ) : !data?.tasks.length ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            {hasActiveFilters ? 'No tasks match your filters.' : emptyMessage}
          </p>
          {showCreateButton && can('task:create') && (
            <CreateTaskDialog
              isDialogOpen={createOpen}
              setIsDialogOpen={setCreateOpen}
              trigger={
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  Create task
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <div aria-label="Tasks">
          {data.tasks.map((task) => (
            <TaskCard key={task.id} {...task} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 py-3">
        {/* Limit button */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Show</span>
          <Select
            value={String(search.limit)}
            onValueChange={(value) =>
              updateSearch({
                limit: Number(value),
                page: 1,
              })
            }
          >
            <SelectTrigger
              size="sm"
              aria-label="Tasks per page"
              className="h-7 w-16 rounded-md border-transparent bg-transparent px-2 text-xs shadow-none hover:bg-muted"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeItems.map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>tasks</span>
          {isFetching && !isLoading && <span>Updating...</span>}
        </div>

        {/* Pages button */}
        <div className="flex items-center justify-end gap-2">
          <span className="min-w-14 text-center text-xs text-muted-foreground">
            Page {search.page}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 rounded-md"
            disabled={search.page <= 1}
            onClick={() => updateSearch({ page: Math.max(1, search.page - 1) })}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 rounded-md"
            disabled={!data?.metadata.hasNextPage}
            onClick={() => updateSearch({ page: search.page + 1 })}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
