import { useWorkspacePermissions } from '#/hooks/use-workspace-permissions'
import type { TaskLabelType, TaskPriorityType, TaskStatusType } from '#/type'
import { Link, useLocation, useParams } from '@tanstack/react-router'
import { LABEL_ITEMS, STATUS_ITEMS } from '#/constants'
import { cn } from '#/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import {
  CircleAlert,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleX,
  Ellipsis,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import DeleteTaskDialog from './DeleteTaskDialog'
import { useState } from 'react'
import { useDeleteTask, useUpdateTask } from '#/hooks/task.hook'

interface TaskCardProps {
  id: string
  title: string
  status: TaskStatusType
  priority: TaskPriorityType
  label: TaskLabelType
  assignee: string
  created_at: Date
}

const priorityItems = [
  {
    name: 'Low',
    value: 'low',
    icon: <SignalLow />,
  },
  {
    name: 'Medium',
    value: 'medium',
    icon: <SignalMedium />,
  },
  {
    name: 'High',
    value: 'high',
    icon: <SignalHigh />,
  },
  {
    name: 'Urgent',
    value: 'urgent',
    icon: <CircleAlert />,
  },
  {
    name: 'No Priority',
    value: 'no_priority',
    icon: <Ellipsis />,
  },
]

function TaskCard(props: TaskCardProps) {
  const { can } = useWorkspacePermissions()
  const { pathname } = useLocation()
  const lastSegment = pathname.split('/').filter(Boolean).at(-1)
  const returnFilter =
    lastSegment === 'assigned' ||
    lastSegment === 'created' ||
    lastSegment === 'all'
      ? lastSegment
      : 'all'

  const { mutate: updateTask, isPending: isUpdatingTask } = useUpdateTask()
  const { mutate: deleteTask, isPending } = useDeleteTask()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const { workspaceId } = useParams({ strict: false })
  const statusLabel = STATUS_ITEMS.find(
    (item) => item.value === props.status,
  )?.label
  const priority = priorityItems.find((item) => item.value === props.priority)
  const label = LABEL_ITEMS.find((item) => item.value === props.label)?.label
  const StatusIcon = {
    backlog: CircleDashed,
    todo: Circle,
    in_progress: CircleDot,
    done: CircleCheck,
    cancelled: CircleX,
  }[props.status]

  function onDelete() {
    deleteTask(props.id)
  }

  return (
    <>
      <div className="group flex items-center gap-3 border-b border-border/60 px-2 py-4 transition-colors hover:bg-muted/40 sm:gap-5 sm:px-3">
        <Link
          to="/$workspaceId/tasks/$taskId"
          params={{ workspaceId: workspaceId!, taskId: props.id }}
          search={{ from: returnFilter }}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span title={statusLabel} className="shrink-0 text-muted-foreground">
            <StatusIcon
              className={cn(
                'size-4',
                props.status === 'done' &&
                  'text-emerald-600 dark:text-emerald-400',
              )}
            />
            <span className="sr-only">{statusLabel}: </span>
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium">{props.title}</h3>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{statusLabel}</span>
              <span>{props.assignee || 'Unassigned'}</span>
              <span className="sm:hidden">{label}</span>
            </div>
          </div>
        </Link>
        <span className="hidden w-24 truncate text-xs text-muted-foreground sm:block">
          {label}
        </span>
        <span
          title={`${priority?.name} priority`}
          className="shrink-0 text-muted-foreground [&_svg]:size-4"
        >
          {priority?.icon}
          <span className="sr-only">{priority?.name} priority</span>
        </span>
        <time
          dateTime={new Date(props.created_at).toISOString()}
          title={`Created ${new Date(props.created_at).toLocaleDateString()}`}
          className="hidden w-14 shrink-0 text-right text-xs text-muted-foreground md:block"
        >
          {new Date(props.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </time>
        {can('task:update') && (
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Task actions"
                  variant="ghost"
                  size="icon-sm"
                  disabled={isUpdatingTask || isPending}
                  onClick={(event) => event.stopPropagation()}
                >
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" className="mr-3">
                {can('task:delete') && (
                  <DropdownMenuItem
                    disabled={isPending}
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                    onSelect={() => {
                      setDeleteOpen(true)
                    }}
                  >
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                )}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <TrendingUp />
                    Priority
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    >
                      {priorityItems.map((p) => (
                        <DropdownMenuItem
                          onSelect={() => {
                            updateTask({
                              taskId: props.id,
                              payload: {
                                priority: p.value as TaskPriorityType,
                              },
                            })
                          }}
                          key={p.name}
                          className={`flex items-center gap-3 ${props.priority === p.value ? 'bg-accent' : ''}`}
                        >
                          {p.icon}
                          {p.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      <DeleteTaskDialog
        open={can('task:delete') && deleteOpen}
        onOpenChange={setDeleteOpen}
        onDelete={onDelete}
        isDeleting={isPending}
      />
    </>
  )
}

export default TaskCard
