import DeleteCommentDialog from '#/components/comments/DeleteCommentDialog'
import UpdateCommentDialog from '#/components/comments/UpdateCommentDialog'
import DeleteTaskDialog from '#/components/tasks/DeleteTaskDialog'
import TaskDescriptionViewer from '#/components/tasks/TaskDescriptionViewer'
import EditTaskDialog from '#/components/tasks/UpdateTaskDialog'
import { Badge } from '#/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '#/components/ui/breadcrumb'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Field } from '#/components/ui/field'
import { Separator } from '#/components/ui/separator'
import { SidebarTrigger } from '#/components/ui/sidebar'
import { Spinner } from '#/components/ui/spinner'
import { Textarea } from '#/components/ui/textarea'
import { useAuth } from '#/context/auth/auth-hook'
import { useGetPresignedUrl } from '#/hooks/attachment.hooks'
import {
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from '#/hooks/comment.hooks'
import {
  useDeleteTask,
  useGetTaskById,
  useMarkTaskAsComplete,
} from '#/hooks/task.hook'
import { useIsMobile } from '#/hooks/use-mobile'
import usePreviousLocation from '#/hooks/usePreviousLocation'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import {
  Ellipsis,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Pencil,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import z from 'zod'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/_app/tasks/$taskId',
)({
  component: RouteComponent,
})

/* ---------------------------------- */
/* Small presentational helpers       */
/* ---------------------------------- */

const AVATAR_COLORS = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-pink-500',
]

function avatarColor(seed: string) {
  const sum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

const STATUS_STYLES: Record<string, string> = {
  todo: 'bg-zinc-400',
  backlog: 'bg-zinc-400',
  in_progress: 'bg-amber-500',
  in_review: 'bg-sky-500',
  done: 'bg-emerald-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
}

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-zinc-400',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

function formatLabel(value?: string | null) {
  if (!value) return '—'
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function Dot({ className }: { className: string }) {
  return (
    <span className={`inline-block h-1.5 w-1.5 rounded-full ${className}`} />
  )
}

function Property({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value ?? '—'}</p>
    </div>
  )
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const size = bytes / 1024 ** i
  return `${i === 0 ? size : size.toFixed(1)} ${units[i]}`
}

function AttachmentTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) {
    return <ImageIcon className="size-4 text-muted-foreground" />
  }
  if (mimeType === 'application/pdf' || mimeType.includes('word')) {
    return <FileText className="size-4 text-muted-foreground" />
  }
  return <FileIcon className="size-4 text-muted-foreground" />
}

/* ---------------------------------- */
/* Main route                         */
/* ---------------------------------- */

const CreateCommentSchema = z.object({
  content: z.string('Invalid comment').trim().min(1),
})

function RouteComponent() {
  const { user } = useAuth()

  // Use states
  const [taskDeleteOpen, setTaskDeleteOpen] = useState(false)
  const [commentDeleteOpen, setCommentDeleteOpen] = useState(false)
  const [commentUpdateOpen, setCommentUpdateOpen] = useState(false)
  const [selectedCommment, setSelectedComment] = useState<{
    id: string
    content: string
  } | null>()
  const [isEditDialogOpen, setEditIsDialogOpen] = useState<boolean>(false)

  // Use form
  const { handleSubmit, reset, control } = useForm({
    resolver: zodResolver(CreateCommentSchema),
    defaultValues: {
      content: '',
    },
  })

  // Hooks
  const prevLocation = usePreviousLocation()

  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const isMobile = useIsMobile()

  // Mutations
  const { mutate: deleteTask, isPending: isDeletingTask } = useDeleteTask()
  const { mutate: createComment, isPending: isCommenting } = useCreateComment()
  const { mutate: markTaskAsComplete, isPending: isMarkingTaskAsComplete } =
    useMarkTaskAsComplete()
  const { mutate: deleteComment, isPending: isDeletingComment } =
    useDeleteComment()
  const { mutate: updateComment, isPending: isUpdatingComment } =
    useUpdateComment()
  const { data: task, isLoading } = useGetTaskById({ taskId: params.taskId!! })
  const { mutate: getPresignedUrl, isPending: isGettingPresignedUrl } =
    useGetPresignedUrl()

  // Helpers
  function onClickingAttachment(attachmentId: string) {
    getPresignedUrl(attachmentId)
  }

  function onTaskDelete() {
    deleteTask(params.taskId!!)
    navigate({
      to: prevLocation,
    })
  }

  function onCommentDelete() {
    if (selectedCommment) {
      deleteComment({ taskId: params.taskId!!, commentId: selectedCommment.id })
    }
    setSelectedComment(null)
    setCommentDeleteOpen(false)
  }

  function onComment(data: z.infer<typeof CreateCommentSchema>) {
    createComment(
      { taskId: params.taskId!!, comment: data.content },
      {
        onSuccess: () => reset(),
      },
    )
  }

  function onUpdate(newContent: string) {
    if (selectedCommment) {
      updateComment({
        taskId: params.taskId!!,
        comment: {
          id: selectedCommment?.id,
          content: newContent,
        },
      })
    }
    setCommentUpdateOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading task…
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center gap-2 text-center">
        <TriangleAlert className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium">Something went wrong</p>
        <p className="text-sm text-muted-foreground">
          This task couldn't be loaded. Try again.
        </p>
      </div>
    )
  }

  function onMarkAsComplete() {
    if (task) {
      markTaskAsComplete(task.id)
    }
  }

  const properties = [
    { label: 'Assignee', value: task.assignee?.username },
    { label: 'Reporter', value: task.reporter?.username },
    { label: 'Email', value: task.assignee?.email },
    {
      label: 'Status',
      value: (
        <span className="inline-flex items-center gap-1.5">
          <Dot className={STATUS_STYLES[task.status] ?? 'bg-zinc-400'} />
          {formatLabel(task.status)}
        </span>
      ),
    },
    {
      label: 'Priority',
      value: (
        <span className="inline-flex items-center gap-1.5">
          <Dot className={PRIORITY_STYLES[task.priority] ?? 'bg-zinc-400'} />
          {formatLabel(task.priority)}
        </span>
      ),
    },
    { label: 'Label', value: formatLabel(task.label) },
    {
      label: 'Start Date',
      value: formatLabel(
        task.start_date && new Date(task.start_date).toLocaleDateString(),
      ),
    },
    {
      label: 'Due Date',
      value: formatLabel(
        task.due_date && new Date(task.due_date).toLocaleDateString(),
      ),
    },
    {
      label: 'Completed Date',
      value: formatLabel(
        task.completed_date &&
          new Date(task.completed_date).toLocaleDateString(),
      ),
    },
    {
      label: 'Created',
      value: new Date(task.created_at).toLocaleDateString(),
    },
    {
      label: 'Updated',
      value: new Date(task.updated_at).toLocaleDateString(),
    },
  ]

  return (
    <>
      <main className="flex h-dvh w-full min-h-0 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 flex-col gap-2 px-4 pt-3 sm:px-6">
          <nav className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {isMobile && <SidebarTrigger />}
              <Breadcrumb className="min-w-0">
                <BreadcrumbList className="flex-nowrap">
                  <BreadcrumbItem className="shrink-0">
                    <BreadcrumbLink
                      className="cursor-pointer"
                      onClick={() => {
                        navigate({
                          to: prevLocation,
                        })
                      }}
                    >
                      My Tasks
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="shrink-0" />
                  <BreadcrumbItem className="min-w-0 truncate text-foreground">
                    {task.title}
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {task && task.status !== 'done' ? (
              <Button onClick={onMarkAsComplete} className="" variant="green">
                {isMarkingTaskAsComplete && <Spinner />}
                Mark as done
              </Button>
            ) : (
              ''
            )}
          </nav>
          <Separator />
        </div>

        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Main */}
          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
              <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
                {/* Title + actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{formatLabel(task.label)}</Badge>
                      <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        <Dot
                          className={
                            STATUS_STYLES[task.status] ?? 'bg-zinc-400'
                          }
                        />
                        {formatLabel(task.status)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        <Dot
                          className={
                            PRIORITY_STYLES[task.priority] ?? 'bg-zinc-400'
                          }
                        />
                        {formatLabel(task.priority)}
                      </span>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      {task.title}
                    </h1>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <EditTaskDialog
                      task={{
                        id: task.id,
                        description: task.description,
                        label: task.label,
                        priority: task.priority,
                        status: task.status,
                        title: task.title,
                        assignee: task.assignee ?? undefined,
                        reporter: task.reporter ?? undefined,
                        completed_date: task.completed_date,
                        due_date: task.due_date,
                        start_date: task.start_date,
                        attachments: task.attachments ?? [],
                      }}
                      isDialogOpen={isEditDialogOpen}
                      setIsDialogOpen={setEditIsDialogOpen}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditIsDialogOpen(true)}
                        >
                          <Pencil />
                          Edit
                        </Button>
                      }
                    />
                    <Button
                      onClick={() => setTaskDeleteOpen(true)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 />
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Properties — visible only below the desktop sidebar breakpoint */}
                <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 rounded-lg border p-4 sm:grid-cols-3 lg:hidden">
                  {properties.map((p) => (
                    <Property key={p.label} label={p.label} value={p.value} />
                  ))}
                </div>

                <Separator className="my-8" />

                {/* Description */}
                <section>
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Description
                  </h2>
                  {/* key forces a remount so BlockNote picks up fresh
                      initialContent when navigating between tasks — its
                      initialContent prop is only read on first mount */}
                  <div className="min-w-0 overflow-x-auto">
                    <TaskDescriptionViewer
                      key={task.id}
                      value={task.description}
                    />
                  </div>
                </section>

                {/* Attachments */}
                {task.attachments?.length > 0 && (
                  <>
                    <Separator className="my-10" />
                    <section>
                      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        <Paperclip className="size-3.5" />
                        Attachments ({task.attachments.length})
                      </h2>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {task.attachments.map((file) => (
                          <div
                            onClick={() => {
                              onClickingAttachment(file.id)
                            }}
                            key={file.id}
                            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
                          >
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                              <AttachmentTypeIcon mimeType={file.mime_type} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {file.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatBytes(file.size)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}

                <Separator className="my-10" />

                {/* Activity */}
                <section>
                  <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Activity ({task.comments.length})
                  </h2>

                  <div className="space-y-6">
                    {task.comments.length <= 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No activity yet.
                      </p>
                    ) : (
                      task.comments.map((comment) => {
                        const isUsersComment = comment.user.id === user?.id

                        return (
                          <div
                            key={comment.id}
                            className="group flex items-start justify-between gap-2"
                          >
                            <div className="flex min-w-0 flex-1 gap-3">
                              <div
                                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ${avatarColor(comment.user.username)}`}
                              >
                                {comment.user.username[0].toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-baseline gap-2">
                                  <span className="text-sm font-medium">
                                    {comment.user.username}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(
                                      comment.created_at,
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                <p className="wrap-break-word text-sm leading-relaxed text-muted-foreground">
                                  {comment.content}
                                </p>
                              </div>
                            </div>

                            {isUsersComment && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                                  >
                                    <Ellipsis />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  side="bottom"
                                  className="mr-3"
                                >
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedComment(comment)
                                    }}
                                    onSelect={() => {
                                      setCommentDeleteOpen(true)
                                    }}
                                  >
                                    <Trash2 />
                                    Delete
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedComment(comment)
                                    }}
                                    onSelect={() => {
                                      setCommentUpdateOpen(true)
                                    }}
                                  >
                                    <Pencil />
                                    Edit
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </section>
              </div>
            </div>

            {/* Add comment — fixed footer */}
            <div className="shrink-0 border-t bg-background px-4 py-4 sm:px-8">
              <form
                onSubmit={handleSubmit(onComment)}
                className="mx-auto max-w-3xl"
              >
                <Controller
                  control={control}
                  name="content"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Textarea
                        disabled={isCommenting}
                        aria-invalid={fieldState.invalid}
                        {...field}
                        placeholder="Leave a comment…"
                        rows={2}
                        className="resize-none"
                      />
                    </Field>
                  )}
                />
                <div className="mt-3 flex justify-end">
                  <Button size="sm" disabled={isCommenting}>
                    {isCommenting ? 'Commenting…' : 'Add comment'}
                  </Button>
                </div>
              </form>
            </div>
          </section>

          {/* Right panel — desktop only */}
          <aside className="hidden w-72 shrink-0 overflow-y-auto border-l bg-background px-6 py-8 lg:block">
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Properties
            </h3>

            <div className="space-y-6">
              {properties.map((p) => (
                <Property key={p.label} label={p.label} value={p.value} />
              ))}
            </div>

            {task.attachments?.length > 0 && (
              <>
                <Separator className="my-6" />
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Attachments
                </h3>
                <div className="space-y-2">
                  {task.attachments.map((file) => (
                    <div key={file.id} className="flex items-center gap-2">
                      <AttachmentTypeIcon mimeType={file.mime_type} />
                      <span className="truncate text-xs text-muted-foreground">
                        {file.name}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </aside>
        </div>
      </main>

      <DeleteTaskDialog
        open={taskDeleteOpen}
        onOpenChange={setTaskDeleteOpen}
        onDelete={onTaskDelete}
        isDeleting={isDeletingTask}
      />
      <DeleteCommentDialog
        open={commentDeleteOpen}
        onOpenChange={setCommentDeleteOpen}
        isDeleting={isDeletingComment}
        onDelete={onCommentDelete}
      />
      <UpdateCommentDialog
        open={commentUpdateOpen}
        onOpenChange={setCommentUpdateOpen}
        isUpdating={isUpdatingComment}
        onUpdate={onUpdate}
        comment={selectedCommment!!}
      />
    </>
  )
}
