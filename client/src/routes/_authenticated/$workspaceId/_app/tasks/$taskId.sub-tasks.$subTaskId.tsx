import AttachmentField from '#/components/fields/AttachmentField'
import TaskDescriptionEditor from '#/components/tasks/TaskDescriptionEditor'
import TaskDescriptionViewer from '#/components/tasks/TaskDescriptionViewer'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { STATUS_ITEMS, PRIORITY_ITEMS, LABEL_ITEMS } from '#/constants'
import { useGetPresignedUrl } from '#/hooks/attachment.hooks'
import { useWorkspacePermissions } from '#/hooks/use-workspace-permissions'
import { useGetWorkspaceUsers } from '#/hooks/workspace.hooks'
import {
  useGetSubTask,
  useGetTaskById,
  useUpdateSubTask,
} from '#/hooks/task.hook'
import {
  avatarColor,
  cn,
  formatBytes,
  formatLabel,
  getInitials,
} from '#/lib/utils'
import type { UpdateSubTaskPayload } from '#/service/task.service'
import type { TaskLabelType, TaskPriorityType, TaskStatusType } from '#/type'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleX,
  FileText,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  Search,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Tag,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/_app/tasks/$taskId/sub-tasks/$subTaskId',
)({
  component: SubTaskDetailPage,
})

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
  no_priority: Circle,
}

function PropertyRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-3 py-2 text-xs">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

function PropertyPicker({
  label,
  value,
  disabled,
  children,
}: {
  label: string
  value: React.ReactNode
  disabled: boolean
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          aria-label={label}
          className="-ml-2 h-auto max-w-full justify-start gap-2 px-2 py-0.5 text-xs font-normal"
        >
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-56 gap-0 p-1.5"
        aria-label={label}
      >
        {children(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  )
}

function PickerOption({
  selected,
  onSelect,
  children,
}: {
  selected: boolean
  onSelect: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-8 w-full justify-start gap-2 px-2 text-xs font-normal"
      onClick={onSelect}
    >
      {children}
      <Check className={cn('ml-auto size-3.5', !selected && 'invisible')} />
    </Button>
  )
}

function SubTaskProperties({
  status,
  priority,
  label,
  assigneeId,
  users,
  disabled,
  onUpdate,
}: {
  status: TaskStatusType
  priority: TaskPriorityType
  label: TaskLabelType | null
  assigneeId: string | null
  users: { id: string; username: string; email: string }[]
  disabled: boolean
  onUpdate: (payload: UpdateSubTaskPayload) => Promise<boolean>
}) {
  const [search, setSearch] = useState('')
  const StatusIcon = statusIcons[status]
  const PriorityIcon = priorityIcons[priority]
  const assignee = users.find((user) => user.id === assigneeId)
  const filteredUsers = users.filter((user) =>
    `${user.username} ${user.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  async function choose(payload: UpdateSubTaskPayload, close: () => void) {
    if (await onUpdate(payload)) close()
  }

  return (
    <section
      className="rounded-xl border bg-muted/20 p-4"
      aria-label="Subtask properties"
    >
      <h2 className="mb-2 text-sm font-medium">Properties</h2>
      <dl>
        <PropertyRow label="Status">
          <PropertyPicker
            label="Change status"
            disabled={disabled}
            value={
              <>
                <StatusIcon className="size-3.5 text-muted-foreground" />
                {formatLabel(status)}
              </>
            }
          >
            {(close) =>
              STATUS_ITEMS.map((item) => {
                const Icon = statusIcons[item.value]
                return (
                  <PickerOption
                    key={item.value}
                    selected={status === item.value}
                    onSelect={() => void choose({ status: item.value }, close)}
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    {item.label}
                  </PickerOption>
                )
              })
            }
          </PropertyPicker>
        </PropertyRow>
        <PropertyRow label="Priority">
          <PropertyPicker
            label="Change priority"
            disabled={disabled}
            value={
              <>
                <PriorityIcon className="size-3.5 text-muted-foreground" />
                {PRIORITY_ITEMS.find((item) => item.value === priority)?.label}
              </>
            }
          >
            {(close) =>
              PRIORITY_ITEMS.map((item) => {
                const Icon = priorityIcons[item.value]
                return (
                  <PickerOption
                    key={item.value}
                    selected={priority === item.value}
                    onSelect={() =>
                      void choose({ priority: item.value }, close)
                    }
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    {item.label}
                  </PickerOption>
                )
              })
            }
          </PropertyPicker>
        </PropertyRow>
        <PropertyRow label="Assignee">
          <PropertyPicker
            label="Change assignee"
            disabled={disabled}
            value={
              assignee ? (
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar className="size-5">
                    <AvatarFallback
                      className={cn(
                        'text-[9px] text-white',
                        avatarColor(assignee.username),
                      )}
                    >
                      {getInitials(assignee.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">
                    {assignee.username || assignee.email}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )
            }
          >
            {(close) => (
              <>
                <div className="relative border-b">
                  <Search className="pointer-events-none absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search members…"
                    aria-label="Search workspace members"
                    className="h-8 border-0 bg-transparent pl-8 text-xs shadow-none"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  <PickerOption
                    selected={!assigneeId}
                    onSelect={() =>
                      void choose({ clearFields: ['assignee'] }, close)
                    }
                  >
                    Unassigned
                  </PickerOption>
                  {filteredUsers.map((user) => (
                    <PickerOption
                      key={user.id}
                      selected={assigneeId === user.id}
                      onSelect={() => void choose({ assignee: user.id }, close)}
                    >
                      <Avatar className="size-5">
                        <AvatarFallback
                          className={cn(
                            'text-[9px] text-white',
                            avatarColor(user.username),
                          )}
                        >
                          {getInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">
                        {user.username || user.email}
                      </span>
                    </PickerOption>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="px-2 py-3 text-xs text-muted-foreground">
                      No members found.
                    </p>
                  )}
                </div>
              </>
            )}
          </PropertyPicker>
        </PropertyRow>
        <PropertyRow label="Label">
          <PropertyPicker
            label="Change label"
            disabled={disabled}
            value={
              <>
                <Tag className="size-3.5 text-muted-foreground" />
                {LABEL_ITEMS.find((item) => item.value === label)?.label ??
                  'No label'}
              </>
            }
          >
            {(close) => (
              <>
                <PickerOption
                  selected={!label}
                  onSelect={() => void choose({ label: null }, close)}
                >
                  No label
                </PickerOption>
                {LABEL_ITEMS.map((item) => (
                  <PickerOption
                    key={item.value}
                    selected={label === item.value}
                    onSelect={() => void choose({ label: item.value }, close)}
                  >
                    {item.label}
                  </PickerOption>
                ))}
              </>
            )}
          </PropertyPicker>
        </PropertyRow>
      </dl>
    </section>
  )
}

function SubTaskDetailPage() {
  const { workspaceId, taskId, subTaskId } = Route.useParams()
  const navigate = useNavigate()
  const { can } = useWorkspacePermissions()
  const canEdit = can('task:update')
  const { data: task } = useGetTaskById({ taskId })
  const { data: subTask, isPending, isError } = useGetSubTask(taskId, subTaskId)
  const { data: users = [] } = useGetWorkspaceUsers(workspaceId)
  const { mutateAsync: update, isPending: isUpdating } = useUpdateSubTask(
    taskId,
    subTaskId,
  )
  const { mutate: getPresignedUrl, isPending: isGettingFile } =
    useGetPresignedUrl()
  const [title, setTitle] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [description, setDescription] = useState('')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isAddingFiles, setIsAddingFiles] = useState(false)

  useEffect(() => {
    if (subTask) {
      setTitle(subTask.title)
      setDescription(subTask.description ?? '')
    }
  }, [subTask])

  async function save(payload: UpdateSubTaskPayload) {
    try {
      await update(payload)
      toast.success('Subtask updated')
      return true
    } catch {
      toast.error('Could not update subtask. Please try again.')
      return false
    }
  }

  async function saveTitle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!subTask || !title.trim() || title.trim() === subTask.title) {
      setIsEditingTitle(false)
      return
    }
    if (await save({ title: title.trim() })) setIsEditingTitle(false)
  }

  async function saveDescription() {
    if (await save({ description: description || null })) {
      setIsEditingDescription(false)
    }
  }

  async function saveFiles(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!files.length) {
      setIsAddingFiles(false)
      return
    }
    if (await save({ attachments: files })) {
      setFiles([])
      setIsAddingFiles(false)
    }
  }

  async function removeAttachment(attachmentId: string) {
    await save({ removedAttachmentIds: [attachmentId] })
  }

  function goToTask() {
    navigate({
      to: '/$workspaceId/tasks/$taskId',
      params: { workspaceId, taskId },
      search: { from: 'all' },
    })
  }

  if (isPending) {
    return (
      <div className="flex h-dvh items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading subtask…
      </div>
    )
  }

  if (isError || !subTask) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 text-center">
        <TriangleAlert className="size-6 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Subtask could not be loaded</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It may have been removed or you may not have access.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={goToTask}>
          <ArrowLeft /> Back to task
        </Button>
      </div>
    )
  }

  const activeAttachments = subTask.attachments ?? []
  const propertyPanel = (
    <SubTaskProperties
      status={subTask.status}
      priority={subTask.priority}
      label={subTask.label}
      assigneeId={subTask.assignee}
      users={users}
      disabled={!canEdit || isUpdating}
      onUpdate={save}
    />
  )

  return (
    <main className="flex h-dvh min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b px-4 py-3 sm:px-6">
        <div className="flex w-full items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 max-w-[70vw] justify-start text-muted-foreground"
            onClick={goToTask}
          >
            <ArrowLeft className="shrink-0" />
            <span className="truncate">{task?.title ?? 'Task'}</span>
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="truncate text-sm font-medium">Subtask</span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="min-h-0 min-w-0 overflow-y-auto overscroll-contain">
          <div className="w-full space-y-9 px-4 py-7 sm:px-6 lg:px-10 lg:py-9">
            <div className="space-y-3">
              {isEditingTitle ? (
                <form onSubmit={saveTitle} className="flex items-center gap-2">
                  <Input
                    autoFocus
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={250}
                    aria-label="Subtask title"
                    disabled={isUpdating}
                    className="h-11 text-xl font-semibold sm:text-2xl"
                  />
                  <Button
                    type="submit"
                    size="icon-sm"
                    aria-label="Save title"
                    disabled={!title.trim() || isUpdating}
                  >
                    <Check />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Cancel title edit"
                    disabled={isUpdating}
                    onClick={() => {
                      setTitle(subTask.title)
                      setIsEditingTitle(false)
                    }}
                  >
                    <X />
                  </Button>
                </form>
              ) : (
                <div className="group flex items-start gap-2">
                  <h1 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight wrap-anywhere sm:text-3xl">
                    {subTask.title}
                  </h1>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit subtask title"
                      className="shrink-0 text-muted-foreground lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={() => setIsEditingTitle(true)}
                    >
                      <Pencil />
                    </Button>
                  )}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Subtask of{' '}
                <button
                  type="button"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                  onClick={goToTask}
                >
                  {task?.title ?? 'task'}
                </button>
              </p>
            </div>

            <div className="lg:hidden">{propertyPanel}</div>

            <section className="space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-sm font-medium">Description</h2>
                {canEdit && !isEditingDescription && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    <Pencil /> {description ? 'Edit' : 'Add description'}
                  </Button>
                )}
              </div>
              {isEditingDescription ? (
                <div className="space-y-3">
                  <TaskDescriptionEditor
                    value={description}
                    onChange={setDescription}
                    disabled={isUpdating}
                    className="min-h-40 rounded-md border px-3 py-2"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => {
                        setDescription(subTask.description ?? '')
                        setIsEditingDescription(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => void saveDescription()}
                    >
                      {isUpdating ? 'Saving…' : 'Save description'}
                    </Button>
                  </div>
                </div>
              ) : description ? (
                <div className="min-w-0 overflow-x-auto">
                  <TaskDescriptionViewer value={description} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No description provided.
                </p>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="flex items-center gap-2 text-sm font-medium">
                  <Paperclip className="size-4 text-muted-foreground" />
                  Attachments
                </h2>
                {canEdit && !isAddingFiles && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingFiles(true)}
                  >
                    <Plus /> Add attachment
                  </Button>
                )}
              </div>

              {isAddingFiles && (
                <form
                  onSubmit={saveFiles}
                  className="space-y-3 rounded-lg border bg-muted/10 p-4"
                >
                  <AttachmentField
                    value={files}
                    onChange={setFiles}
                    disabled={isUpdating}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => {
                        setFiles([])
                        setIsAddingFiles(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!files.length || isUpdating}
                    >
                      {isUpdating ? 'Uploading…' : 'Upload files'}
                    </Button>
                  </div>
                </form>
              )}

              {activeAttachments.length ? (
                <div className="divide-y rounded-lg border">
                  {activeAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex min-w-0 items-center gap-3 px-3 py-2.5"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        <FileText className="size-4 text-muted-foreground" />
                      </div>
                      <button
                        type="button"
                        disabled={isGettingFile}
                        onClick={() => getPresignedUrl(attachment.id)}
                        className="min-w-0 flex-1 text-left disabled:opacity-50"
                      >
                        <span className="block truncate text-sm font-medium">
                          {attachment.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatBytes(attachment.size)}
                        </span>
                      </button>
                      {canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Remove ${attachment.name}`}
                          disabled={isUpdating}
                          onClick={() => void removeAttachment(attachment.id)}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : !isAddingFiles ? (
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setIsAddingFiles(true)}
                  className="flex min-h-20 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:hover:border-border disabled:hover:text-muted-foreground"
                >
                  <Paperclip className="size-4" />
                  <span>
                    {canEdit ? 'Add files to this subtask' : 'No attachments'}
                  </span>
                </button>
              ) : null}
            </section>
          </div>
        </section>

        <aside
          aria-label="Subtask properties"
          className="hidden min-h-0 min-w-0 overflow-y-auto overscroll-contain border-l p-4 lg:block"
        >
          {propertyPanel}
        </aside>
      </div>
    </main>
  )
}
