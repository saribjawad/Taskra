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
import { Skeleton } from '#/components/ui/skeleton'
import { useGetTasks } from '#/hooks/task.hook'
import { cn } from '#/lib/utils'
import type {
  TaskFilterType,
  TaskLabelType,
  TaskPriorityType,
  TaskStatusType,
} from '#/type'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
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

const statusItems: { label: string; value: TaskStatusType }[] = [
  { label: 'Backlog', value: 'backlog' },
  { label: 'Todo', value: 'todo' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
  { label: 'Cancelled', value: 'cancelled' },
]

const priorityItems: { label: string; value: TaskPriorityType }[] = [
  { label: 'Urgent', value: 'urgent' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
  { label: 'No priority', value: 'no_priority' },
]

const labelItems: { label: string; value: TaskLabelType }[] = [
  { label: 'Bug', value: 'bug' },
  { label: 'Feature', value: 'feature' },
  { label: 'Improvement', value: 'improvement' },
]

const pageSizeItems = [5, 10, 20, 50]

const taskStatuses = statusItems.map((item) => item.value)
const taskPriorities = priorityItems.map((item) => item.value)
const taskLabels = labelItems.map((item) => item.value)

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
    limit: pageSizeItems.includes(limit) ? limit : 10,
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
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <Skeleton className="h-5 w-2/5" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          <Skeleton className="my-3 h-px w-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="ml-auto h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

function normalizeSearchValue(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
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
  // Keep the input responsive while the URL/query update waits for typing to pause.
  const [searchInput, setSearchInput] = useState(search.search ?? '')

  const { data, isLoading, isFetching } = useGetTasks({
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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-2 border-b pb-2 lg:flex-row lg:items-center lg:justify-between">
        {/* Search input */}
        <div className="relative min-w-0 lg:w-72">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search..."
            className="h-7 border-transparent bg-transparent pl-7 text-sm shadow-none hover:bg-muted focus-visible:bg-background"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1">
          <FilterSelect
            value={search.status}
            placeholder="Status"
            allLabel="Any status"
            items={statusItems}
            onChange={(value) => setFilterValue('status', value)}
          />
          <FilterSelect
            value={search.priority}
            placeholder="Priority"
            allLabel="Any priority"
            items={priorityItems}
            onChange={(value) => setFilterValue('priority', value)}
          />
          <FilterSelect
            value={search.label}
            placeholder="Label"
            allLabel="Any label"
            items={labelItems}
            onChange={(value) => setFilterValue('label', value)}
          />

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

      {isLoading ? (
        <TaskListSkeleton />
      ) : !data?.tasks.length ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          {showCreateButton && <Button size="sm">Create new task</Button>}
        </div>
      ) : (
        <div className="space-y-3">
          {data.tasks.map((task) => (
            <TaskCard key={task.id} {...task} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t py-4 sm:flex-row sm:items-center sm:justify-between">
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
