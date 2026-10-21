import { useWorkspacePermissions } from '#/hooks/use-workspace-permissions'
import DeleteCommentDialog from '#/components/comments/DeleteCommentDialog'
import UpdateCommentDialog from '#/components/comments/UpdateCommentDialog'
import DeleteTaskDialog from '#/components/tasks/DeleteTaskDialog'
import TaskDescriptionViewer from '#/components/tasks/TaskDescriptionViewer'
import TaskProjectPicker from '#/components/tasks/TaskProjectPicker'
import EditTaskDialog from '#/components/tasks/UpdateTaskDialog'
import TaskProperties from '#/components/tasks/TaskProperties'
import {
  ActivityEventRow,
  ActivityEventSkeleton,
} from '#/components/activity/ActivityEventRow'
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
import { SidebarTrigger } from '#/components/ui/sidebar'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { Spinner } from '#/components/ui/spinner'
import { Textarea } from '#/components/ui/textarea'
import { PRIORITY_STYLES, STATUS_STYLES } from '#/constants'
import { useAuth } from '#/context/auth/auth-hook'
import { useGetPresignedUrl } from '#/hooks/attachment.hooks'
import {
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from '#/hooks/comment.hooks'
import {
  useDeleteTask,
  useGetTaskActivity,
  useGetTaskById,
  useMarkTaskAsComplete,
} from '#/hooks/task.hook'
import { useIsMobile } from '#/hooks/use-mobile'
import {
  avatarColor,
  formatBytes,
  formatDateTime,
  formatLabel,
  getInitials,
} from '#/lib/utils'
import type { TaskEventActivity } from '#/type'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import {
  CheckCircle2,
  Circle,
  CircleDot,
  Ellipsis,
  Flag,
  File as FileIcon,
  FileText,
  FolderPlus,
  FolderX,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Milestone,
  Paperclip,
  PanelRight,
  Pencil,
  RefreshCw,
  Tag,
  Trash2,
  TriangleAlert,
  Type,
  UserRound,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import z from 'zod'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/_app/tasks/$taskId',
)({
  validateSearch: (search) => ({
    from:
      search.from === 'assigned' ||
      search.from === 'created' ||
      search.from === 'all'
        ? search.from
        : 'all',
  }),
  component: RouteComponent,
})

function Dot({ className }: { className: string }) {
  return (
    <span className={`inline-block h-1.5 w-1.5 rounded-full ${className}`} />
  )
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

function ActivityIcon({ type }: { type: TaskEventActivity['type'] }) {
  const className = 'size-3.5'

  if (type === 'task_completed') return <CheckCircle2 className={className} />
  if (type === 'comment_added') return <MessageSquare className={className} />
  if (type === 'attachment_added') return <Paperclip className={className} />
  if (type === 'assignee_changed' || type === 'reporter_changed') {
    return <UserRound className={className} />
  }
  if (type === 'priority_changed') return <Flag className={className} />
  if (type === 'status_changed') return <CircleDot className={className} />
  if (type === 'title_changed') return <Type className={className} />
  if (type === 'task_created') return <Circle className={className} />
  if (type === 'task_connected_to_project') {
    return <FolderPlus className={className} />
  }
  if (type === 'task_connected_to_milestone') {
    return <Milestone className={className} />
  }
  if (type === 'task_removed_from_project') {
    return <FolderX className={className} />
  }

  return <RefreshCw className={className} />
}

const CreateCommentSchema = z.object({
  content: z.string('Invalid comment').trim().min(1),
})

function RouteComponent() {
  const { can } = useWorkspacePermissions()
  // Hooks
  const { user } = useAuth()
  const { from } = Route.useSearch()
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const isMobile = useIsMobile()

  // States
  const [propertiesOpen, setPropertiesOpen] = useState(false)
  // Close the mobile panel when the desktop properties sidebar becomes visible.
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const closeOnDesktop = () => {
      if (desktop.matches) setPropertiesOpen(false)
    }
    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [])
  const [taskDeleteOpen, setTaskDeleteOpen] = useState(false)
  const [commentDeleteOpen, setCommentDeleteOpen] = useState(false)
  const [commentUpdateOpen, setCommentUpdateOpen] = useState(false)
  const [selectedCommment, setSelectedComment] = useState<{
    id: string
    content: string
  } | null>()
  const [isEditDialogOpen, setEditIsDialogOpen] = useState(false)
  const activityScrollRootRef = useRef<HTMLElement>(null)
  const activityLoadMoreRef = useRef<HTMLDivElement>(null)
  const isRequestingNextActivityPage = useRef(false)

  // Use Form
  const { handleSubmit, reset, control } = useForm({
    resolver: zodResolver(CreateCommentSchema),
    defaultValues: {
      content: '',
    },
  })

  const returnTo = `/${params.workspaceId}/my-tasks/${from}`

  // Mutations/Queries
  const { data: task, isLoading: isTasksLoading } = useGetTaskById({
    taskId: params.taskId!!,
  })
  const {
    data: taskActivityPages,
    isPending: isTaskActivityLoading,
    isError: isTaskActivityError,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
    refetch: refetchTaskActivity,
  } = useGetTaskActivity(params.taskId!!)
  const { mutate: createComment, isPending: isCommenting } = useCreateComment()
  const { mutate: markTaskAsComplete, isPending: isMarkingTaskAsComplete } =
    useMarkTaskAsComplete()
  const { mutate: deleteTask, isPending: isDeletingTask } = useDeleteTask()
  const { mutate: deleteComment, isPending: isDeletingComment } =
    useDeleteComment()
  const { mutate: updateComment, isPending: isUpdatingComment } =
    useUpdateComment()
  const { mutate: getPresignedUrl, isPending: isGettingPresignedUrl } =
    useGetPresignedUrl()

  const activities =
    taskActivityPages?.pages.flatMap((page) => page.activities) ?? []

  const loadNextActivityPage = useCallback(async () => {
    if (!hasNextPage || isFetching || isRequestingNextActivityPage.current) {
      return
    }

    isRequestingNextActivityPage.current = true
    try {
      await fetchNextPage()
    } finally {
      isRequestingNextActivityPage.current = false
    }
  }, [fetchNextPage, hasNextPage, isFetching])

  useEffect(() => {
    const root = activityScrollRootRef.current
    const sentinel = activityLoadMoreRef.current
    if (!root || !sentinel) return

    function handleScroll() {
      if (
        root &&
        root.clientHeight + root.scrollTop + 100 >= root.scrollHeight
      ) {
        void loadNextActivityPage()
      }
    }

    root.addEventListener('scroll', handleScroll)
    handleScroll()
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadNextActivityPage()
      },
      { root, rootMargin: '100px' },
    )
    observer.observe(sentinel)

    return () => {
      root.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [activities.length, loadNextActivityPage])

  function onClickingAttachment(attachmentId: string) {
    getPresignedUrl(attachmentId)
  }

  function onTaskDelete() {
    deleteTask(params.taskId!!, {
      onSuccess: () => {
        navigate({
          to: returnTo,
        })
      },
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
          id: selectedCommment.id,
          content: newContent,
        },
      })
    }
    setCommentUpdateOpen(false)
  }

  if (isTasksLoading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading task...
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center gap-2 text-center">
        <TriangleAlert className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium">Something went wrong</p>
        <p className="text-sm text-muted-foreground">
          This task could not be loaded. Try again.
        </p>
      </div>
    )
  }

  function onMarkAsComplete() {
    if (task && task.id) markTaskAsComplete(task.id)
  }

  // The desktop sidebar and mobile sheet share the same property sections.
  const taskInformation = (
    <div className="space-y-4">
      <TaskProperties
        task={task}
        workspaceId={task.workspace_id}
        disabled={!can('task:update')}
      />
      <TaskProjectPicker
        taskId={task.id}
        workspaceId={task.workspace_id}
        projectId={task.project_id}
        milestoneId={task.project_milestone_id}
        disabled={!can('task:update')}
      />
    </div>
  )

  return (
    <>
      <main className="flex h-dvh min-h-0 min-w-0 w-full flex-col overflow-hidden bg-background">
        <div className="shrink-0 border-b px-4 py-3 sm:px-6">
          <nav className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {isMobile && <SidebarTrigger />}
              <Breadcrumb className="min-w-0">
                <BreadcrumbList className="flex-nowrap">
                  <BreadcrumbItem className="shrink-0">
                    <BreadcrumbLink
                      className="cursor-pointer"
                      onClick={() => {
                        navigate({
                          to: returnTo,
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

            <div className="flex shrink-0 items-center gap-2">
              {can('task:complete') && task.status !== 'done' ? (
                <Button
                  onClick={onMarkAsComplete}
                  size="sm"
                  variant="green"
                  className="shrink-0"
                  disabled={isMarkingTaskAsComplete}
                >
                  {isMarkingTaskAsComplete && <Spinner />}
                  Mark as done
                </Button>
              ) : (
                ''
              )}
              <Sheet open={propertiesOpen} onOpenChange={setPropertiesOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="lg:hidden"
                    aria-label="Open task properties"
                  >
                    <PanelRight className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="gap-0 data-[side=right]:w-[min(24rem,100vw)]"
                >
                  <SheetHeader className="shrink-0 border-b pr-12">
                    <SheetTitle>Task properties</SheetTitle>
                    <SheetDescription className="sr-only">
                      Status, priority, people, and dates for this task.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                    {taskInformation}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>

        <div className="min-h-0 flex-1">
          <div className="grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <section
              ref={activityScrollRootRef}
              className="min-h-0 min-w-0 overflow-y-auto overscroll-contain"
            >
              <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="gap-1.5 rounded-md">
                          <Tag className="size-3" />
                          {formatLabel(task.label)}
                        </Badge>
                        <span className="inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs font-medium text-muted-foreground">
                          <Dot
                            className={
                              STATUS_STYLES[task.status] ?? 'bg-zinc-400'
                            }
                          />
                          {formatLabel(task.status)}
                        </span>
                        <span className="inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs font-medium text-muted-foreground">
                          <Dot
                            className={
                              PRIORITY_STYLES[task.priority] ?? 'bg-zinc-400'
                            }
                          />
                          {formatLabel(task.priority)}
                        </span>
                      </div>
                      <h1 className="text-balance text-2xl font-semibold tracking-normal text-foreground wrap-anywhere sm:text-3xl">
                        {task.title}
                      </h1>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {can('task:update') && (
                        <EditTaskDialog
                          task={{
                            id: task.id,
                            description: task.description,
                            title: task.title,
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
                      )}
                      {can('task:delete') && (
                        <Button
                          aria-label="Delete task"
                          onClick={() => setTaskDeleteOpen(true)}
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <section className="space-y-4">
                  <h2 className="text-xs font-medium uppercase text-muted-foreground">
                    Description
                  </h2>
                  <div className="min-w-0 overflow-x-auto ">
                    <TaskDescriptionViewer
                      key={task.id}
                      value={task.description}
                    />
                  </div>
                </section>

                {task.attachments?.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                      <Paperclip className="size-3.5" />
                      Attachments ({task.attachments.length})
                    </h2>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {task.attachments.map((file) => (
                        <button
                          type="button"
                          disabled={isGettingPresignedUrl}
                          onClick={() => {
                            onClickingAttachment(file.id)
                          }}
                          key={file.id}
                          className="flex min-w-0 items-center gap-3 rounded-md border bg-background p-3 text-left transition-colors hover:bg-muted/50 disabled:cursor-wait disabled:opacity-70"
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
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                <section className="space-y-5">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h2 className="text-xs font-medium uppercase text-muted-foreground">
                      Activity
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {isTaskActivityLoading ? (
                      <ActivityEventSkeleton />
                    ) : isTaskActivityError && activities.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Could not load task activity.{' '}
                        <button
                          type="button"
                          className="underline underline-offset-2"
                          onClick={() => void refetchTaskActivity()}
                        >
                          Try again
                        </button>
                      </p>
                    ) : activities.length <= 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No activity yet.
                      </p>
                    ) : (
                      activities.map((entry) => {
                        if (entry.activityType === 'activity') {
                          return (
                            <ActivityEventRow
                              key={`activity-${entry.id}`}
                              icon={<ActivityIcon type={entry.type} />}
                              description={entry.description}
                              createdAt={entry.createdAt}
                            />
                          )
                        }
                        const comment = entry
                        const isUsersComment = comment.userId === user?.id

                        return (
                          <div
                            key={`comment-${comment.id}`}
                            className="group flex items-start justify-between gap-2"
                          >
                            <div className="flex min-w-0 flex-1 gap-3">
                              <div
                                className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ${avatarColor(comment.username)}`}
                              >
                                {getInitials(comment.username)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-baseline gap-2">
                                  <span className="text-sm font-medium wrap-anywhere">
                                    {comment.username}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDateTime(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground wrap-anywhere">
                                  {comment.content}
                                </p>
                              </div>
                            </div>

                            {(can('comment:update') || can('comment:delete')) &&
                              isUsersComment && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      aria-label="Comment actions"
                                      className="shrink-0 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                                    >
                                      <Ellipsis />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    side="bottom"
                                    className="mr-3"
                                  >
                                    {can('comment:delete') && (
                                      <DropdownMenuItem
                                        variant="destructive"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setSelectedComment(comment)
                                        }}
                                        onSelect={() => {
                                          setCommentDeleteOpen(true)
                                        }}
                                      >
                                        <Trash2 />
                                        Delete
                                      </DropdownMenuItem>
                                    )}
                                    {can('comment:update') && (
                                      <DropdownMenuItem
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setSelectedComment(comment)
                                        }}
                                        onSelect={() => {
                                          setCommentUpdateOpen(true)
                                        }}
                                      >
                                        <Pencil />
                                        Edit
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                          </div>
                        )
                      })
                    )}
                    {hasNextPage && (
                      <div ref={activityLoadMoreRef} className="py-2">
                        {isFetchingNextPage && <ActivityEventSkeleton />}
                        {isFetchNextPageError && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void loadNextActivityPage()}
                          >
                            Retry loading activity
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </section>

            <aside
              aria-label="Task information"
              className="hidden min-h-0 min-w-0 overflow-y-auto overscroll-contain border-l p-4 lg:block"
            >
              {taskInformation}
            </aside>
          </div>
        </div>

        {can('comment:create') && (
          <div className="shrink-0 border-t bg-background px-4 py-3 sm:px-6">
            <form
              onSubmit={handleSubmit(onComment)}
              className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Controller
                control={control}
                name="content"
                render={({ field, fieldState }) => (
                  <Field
                    className="min-w-0 flex-1"
                    data-invalid={fieldState.invalid}
                  >
                    <Textarea
                      disabled={isCommenting}
                      aria-invalid={fieldState.invalid}
                      {...field}
                      placeholder="Leave a comment..."
                      rows={2}
                      className="max-h-32 resize-none"
                    />
                  </Field>
                )}
              />
              <Button size="sm" disabled={isCommenting}>
                {isCommenting ? 'Commenting...' : 'Add comment'}
              </Button>
            </form>
          </div>
        )}
      </main>

      <DeleteTaskDialog
        open={can('task:delete') && taskDeleteOpen}
        onOpenChange={setTaskDeleteOpen}
        onDelete={onTaskDelete}
        isDeleting={isDeletingTask}
      />
      <DeleteCommentDialog
        open={can('comment:delete') && commentDeleteOpen}
        onOpenChange={setCommentDeleteOpen}
        isDeleting={isDeletingComment}
        onDelete={onCommentDelete}
      />
      <UpdateCommentDialog
        open={can('comment:update') && commentUpdateOpen}
        onOpenChange={setCommentUpdateOpen}
        isUpdating={isUpdatingComment}
        onUpdate={onUpdate}
        comment={selectedCommment!!}
      />
    </>
  )
}
