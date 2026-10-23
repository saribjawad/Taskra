import AttachmentField from '#/components/fields/AttachmentField'
import TaskDescriptionEditor from '#/components/tasks/TaskDescriptionEditor'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { LABEL_ITEMS, PRIORITY_ITEMS, STATUS_ITEMS } from '#/constants'
import {
  useCreateSubTask,
  useGetSubTasks,
  useUpdateSubTask,
} from '#/hooks/task.hook'
import { useGetWorkspaceUsers } from '#/hooks/workspace.hooks'
import { useWorkspacePermissions } from '#/hooks/use-workspace-permissions'
import { cn } from '#/lib/utils'
import type {
  CreateSubTaskPayload,
  SubTaskSummary,
} from '#/service/task.service'
import type { TaskLabelType, TaskPriorityType, TaskStatusType } from '#/type'
import { useNavigate } from '@tanstack/react-router'
import { Check, ChevronDown, Circle, CircleCheck, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

function SubTaskRow({
  taskId,
  workspaceId,
  subTask,
  assigneeName,
  disabled,
}: {
  taskId: string
  workspaceId: string
  subTask: SubTaskSummary
  assigneeName?: string
  disabled: boolean
}) {
  const navigate = useNavigate()
  const { mutateAsync: update, isPending } = useUpdateSubTask(
    taskId,
    subTask.id,
  )
  const complete = subTask.status === 'done'

  return (
    <div className="group flex min-h-10 items-center gap-2 rounded-md px-2 transition-colors hover:bg-muted/50">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground hover:text-foreground"
        aria-label={
          complete ? 'Mark subtask incomplete' : 'Mark subtask complete'
        }
        disabled={disabled || isPending}
        onClick={async () => {
          try {
            await update({ status: complete ? 'todo' : 'done' })
          } catch {
            toast.error('Could not update subtask. Please try again.')
          }
        }}
      >
        {complete ? (
          <CircleCheck className="size-4 text-emerald-500" />
        ) : (
          <Circle className="size-4" />
        )}
      </Button>
      <button
        type="button"
        className={cn(
          'min-w-0 flex-1 truncate text-left text-sm transition-colors hover:text-foreground',
          complete && 'text-muted-foreground line-through',
        )}
        onClick={() =>
          navigate({
            to: '/$workspaceId/tasks/$taskId/sub-tasks/$subTaskId',
            params: { workspaceId, taskId, subTaskId: subTask.id },
            search: { from: 'all' },
          })
        }
      >
        {subTask.title}
      </button>
      {assigneeName && (
        <span className="max-w-36 truncate text-xs text-muted-foreground">
          {assigneeName}
        </span>
      )}
    </div>
  )
}

export default function SubTasksSection({
  taskId,
  workspaceId,
}: {
  taskId: string
  workspaceId: string
}) {
  const { can } = useWorkspacePermissions()
  const { data: subTasks = [], isPending, isError } = useGetSubTasks(taskId)
  const { data: users = [] } = useGetWorkspaceUsers(workspaceId)
  const { mutateAsync: create, isPending: isCreating } =
    useCreateSubTask(taskId)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isComposing, setIsComposing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatusType>('backlog')
  const [priority, setPriority] = useState<TaskPriorityType>('no_priority')
  const [label, setLabel] = useState<TaskLabelType | ''>('')
  const [assignee, setAssignee] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const completedCount = subTasks.filter(
    (subTask) => subTask.status === 'done',
  ).length
  const canEdit = can('task:update')

  function resetComposer() {
    setTitle('')
    setDescription('')
    setStatus('backlog')
    setPriority('no_priority')
    setLabel('')
    setAssignee('')
    setAttachments([])
    setIsComposing(false)
  }

  async function submitSubTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle || isCreating) return

    const payload: CreateSubTaskPayload = {
      title: trimmedTitle,
      ...(description && { description }),
      status,
      priority,
      ...(label && { label }),
      ...(assignee && { assignee }),
      attachments,
    }

    try {
      await create(payload)
      resetComposer()
    } catch {
      toast.error('Could not create subtask. Please try again.')
    }
  }

  const assigneeNames = new Map(
    users.map((user) => [user.id, user.username || user.email]),
  )

  return (
    <section className="space-y-2" aria-label="Subtasks">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="size-5 text-muted-foreground"
          aria-label={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          <ChevronDown
            className={cn(
              'size-3.5 transition-transform',
              !isExpanded && '-rotate-90',
            )}
          />
        </Button>
        <button
          type="button"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          Subtasks
        </button>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{subTasks.length}
        </span>
        {canEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="ml-auto text-muted-foreground"
            aria-label="Add subtask"
            onClick={() => {
              setIsExpanded(true)
              setIsComposing(true)
            }}
          >
            <Plus />
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-0.5">
          {isPending ? (
            <p className="px-2 py-2 text-sm text-muted-foreground">
              Loading subtasks…
            </p>
          ) : isError ? (
            <p className="px-2 py-2 text-sm text-muted-foreground">
              Could not load subtasks.
            </p>
          ) : subTasks.length === 0 && !isComposing ? (
            <button
              type="button"
              disabled={!canEdit}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground disabled:hover:bg-transparent"
              onClick={() => setIsComposing(true)}
            >
              <Plus className="size-3.5" /> Add a subtask
            </button>
          ) : (
            subTasks.map((subTask) => (
              <SubTaskRow
                key={subTask.id}
                taskId={taskId}
                workspaceId={workspaceId}
                subTask={subTask}
                assigneeName={
                  subTask.assignee
                    ? assigneeNames.get(subTask.assignee)
                    : undefined
                }
                disabled={!canEdit}
              />
            ))
          )}

          {isComposing && (
            <form
              onSubmit={submitSubTask}
              className="space-y-3 rounded-lg border bg-card/50 p-3"
            >
              <Input
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Subtask title"
                maxLength={250}
                disabled={isCreating}
                aria-label="Subtask title"
              />
              <TaskDescriptionEditor
                value={description}
                onChange={setDescription}
                disabled={isCreating}
                className="min-h-28 rounded-md border px-3 py-2"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as TaskStatusType)}
                >
                  <SelectTrigger size="sm" className="w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={priority}
                  onValueChange={(value) =>
                    setPriority(value as TaskPriorityType)
                  }
                >
                  <SelectTrigger size="sm" className="w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={label || 'no_label'}
                  onValueChange={(value) =>
                    setLabel(
                      value === 'no_label' ? '' : (value as TaskLabelType),
                    )
                  }
                >
                  <SelectTrigger size="sm" className="w-auto">
                    <SelectValue placeholder="Label" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_label">No label</SelectItem>
                    {LABEL_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={assignee || 'unassigned'}
                  onValueChange={(value) =>
                    setAssignee(value === 'unassigned' ? '' : value)
                  }
                >
                  <SelectTrigger size="sm" className="w-auto">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.username || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <AttachmentField
                value={attachments}
                onChange={setAttachments}
                disabled={isCreating}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isCreating}
                  onClick={resetComposer}
                >
                  <X /> Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!title.trim() || isCreating}
                >
                  {isCreating ? (
                    'Creating…'
                  ) : (
                    <>
                      <Check /> Create subtask
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  )
}
