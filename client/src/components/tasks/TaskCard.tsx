import type { TaskLabelType, TaskPriorityType, TaskStatusType } from '#/type'
import { useLocation, useNavigate, useParams } from '@tanstack/react-router'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
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
import { useQueryClient } from '@tanstack/react-query'
import { router } from '#/main'
import type { GetTasksResponse } from '#/service/task.service'

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
  const queryClient = useQueryClient()
  const pathname = useLocation({
    select: (location) => location.pathname,
  })
  const lastSegment = window.location.pathname.split('/').filter(Boolean).at(-1)

  const { mutate: updateTask, isPending: isUpdatingTask } = useUpdateTask()
  const { mutate: deleteTask, isPending } = useDeleteTask()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const { workspaceId } = useParams({ strict: false })
  const navigate = useNavigate()

  function onDelete() {
    deleteTask(props.id)
  }

  return (
    <>
      <div
        onClick={() => {
          if (!isPending) {
            navigate({
              to: '/$workspaceId/tasks/$taskId',
              params: { workspaceId: workspaceId!!, taskId: props.id },
            })
          }
        }}
        key={props.id}
        className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40 cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-medium">{props.title}</h3>
          </div>
          {/* TODO: improve the badge */}
          <div className="flex items-center gap-2">
            <Badge>{props.status}</Badge>

            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" className="mr-3">
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
                              updateTask(
                                {
                                  taskId: props.id,
                                  payload: {
                                    priority: p.value as TaskPriorityType,
                                  },
                                },
                                {
                                  // Update the query data manually
                                  onSuccess: () => {
                                    queryClient.setQueryData(
                                      [`${lastSegment}-tasks`],
                                      (old: GetTasksResponse) => {
                                        return {
                                          ...old,
                                          tasks: old.tasks.map((t) =>
                                            t.id === props.id
                                              ? {
                                                  ...t,
                                                  priority:
                                                    p.value as TaskPriorityType,
                                                }
                                              : t,
                                          ),
                                        }
                                      },
                                    )
                                  },
                                },
                              )
                            }}
                            key={p.name}
                            className={`flex items-center gap-3 ${props.priority === p.value ? 'bg-zinc-800' : ''}`}
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
          </div>
        </div>

        <Separator className="my-3" />

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {/* TODO: improve the badge */}
          <Badge variant="secondary">{props.priority}</Badge>

          {/* TODO: improve the badge */}
          <Badge variant="outline">{props.label}</Badge>

          <span>Assigned: {props.assignee}</span>

          <span className="ml-auto">
            Created {new Date(props.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      <DeleteTaskDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDelete={onDelete}
        isDeleting={isPending}
      />
    </>
  )
}

export default TaskCard
