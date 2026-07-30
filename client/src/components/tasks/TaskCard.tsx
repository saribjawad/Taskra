import type { TaskLabelType, TaskPriorityType, TaskStatusType } from '#/type'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { Ellipsis, Trash2 } from 'lucide-react'
import DeleteTaskDialog from './DeleteTaskDialog'
import { useState } from 'react'
import { useDeleteTask } from '#/hooks/task.hook'

interface TaskCardProps {
  id: string
  title: string
  status: TaskStatusType
  priority: TaskPriorityType
  label: TaskLabelType
  assignee: string
  created_at: Date
}

function TaskCard(props: TaskCardProps) {
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
