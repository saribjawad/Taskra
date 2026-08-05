import DeleteCommentDialog from '#/components/comments/DeleteCommentDialog'
import UpdateCommentDialog from '#/components/comments/UpdateCommentDialog'
import DeleteTaskDialog from '#/components/tasks/DeleteTaskDialog'
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
import { Textarea } from '#/components/ui/textarea'
import { useAuth } from '#/context/auth/auth-hook'
import {
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from '#/hooks/comment.hooks'
import { useDeleteTask, useGetTaskById } from '#/hooks/task.hook'
import { useIsMobile } from '#/hooks/use-mobile'
import usePreviousLocation from '#/hooks/usePreviousLocation'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { Ellipsis, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import z from 'zod'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/tasks/$taskId',
)({
  component: RouteComponent,
})

function Property({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="font-medium">{value}</p>
    </div>
  )
}

const CreateCommentSchema = z.object({
  content: z.string('Invalid comment').trim().min(1),
})

function RouteComponent() {
  const { user } = useAuth()

  const [taskDeleteOpen, setTaskDeleteOpen] = useState(false)
  const [commentDeleteOpen, setCommentDeleteOpen] = useState(false)
  const [commentUpdateOpen, setCommentUpdateOpen] = useState(false)
  const [selectedCommment, setSelectedComment] = useState<{
    id: string
    content: string
  } | null>()

  const { handleSubmit, reset, control } = useForm({
    resolver: zodResolver(CreateCommentSchema),
    defaultValues: {
      content: '',
    },
  })

  // Get previous location
  const prevLocation = usePreviousLocation()

  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const isMobile = useIsMobile()

  // Mutations
  const { mutate: deleteTask, isPending: isDeletingTask } = useDeleteTask()
  const { mutate: createComment, isPending: isCommenting } = useCreateComment()
  const { mutate: deleteComment, isPending: isDeletingComment } =
    useDeleteComment()
  const { mutate: updateComment, isPending: isUpdatingComment } =
    useUpdateComment()
  const { data: task, isLoading } = useGetTaskById({ taskId: params.taskId!! })

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
    return <div>Loading</div>
  }

  // TODO: Show a nice no task page
  if (!task) {
    return <div>Something went wrong try again</div>
  }

  return (
    <>
      <main className="h-screen w-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col gap-2  p-3">
          <nav className="flex items-center gap-3">
            {isMobile && <SidebarTrigger />}
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
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
                <BreadcrumbSeparator />
                <BreadcrumbItem className="text-foreground">
                  {task.title}
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </nav>
          <Separator />
        </div>
        <div className="flex lg:flex-row flex-col flex-1 w-full justify-between min-h-0 overflow-hidden">
          {/* Main */}

          <section className="flex-1 flex flex-col min-h-0">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-4xl px-10 py-8">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-3 flex gap-2">
                      <Badge variant="outline">{task.label}</Badge>
                      <Badge>{task.status}</Badge>
                      <Badge variant="secondary">{task.priority}</Badge>
                    </div>
                    <h1 className="text-4xl font-semibold tracking-tight">
                      {task.title}
                    </h1>
                  </div>

                  <div className="flex gap-2">
                    <EditTaskDialog
                      task={{
                        id: task.id,
                        description: task.description,
                        label: task.label,
                        priority: task.priority,
                        status: task.status,
                        title: task.title,
                        assignee: task.assignee,
                      }}
                      trigger={
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      }
                    />
                    <Button
                      onClick={() => setTaskDeleteOpen(true)}
                      variant="destructive"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <Separator className="my-8" />

                {/* Description */}
                <section>
                  <h2 className="mb-4 text-lg font-semibold">Description</h2>
                  <div className="prose prose-invert max-w-none text-muted-foreground">
                    {task.description}
                  </div>
                </section>

                <Separator className="my-10" />

                {/* Activity */}
                <section>
                  <h2 className="mb-6 text-lg font-semibold">Activity</h2>

                  <div className="space-y-8">
                    {task.comments.length <= 0 ? (
                      <p className="text-muted-foreground">No activity yet.</p>
                    ) : (
                      task.comments.map((comment) => {
                        const isUsersComment = comment.user.id === user?.id

                        return (
                          <div
                            key={comment.id}
                            className="flex justify-between items-start"
                          >
                            <div className="flex gap-4 min-w-0 flex-1">
                              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium">
                                {comment.user.username[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="mb-1 flex items-center gap-3">
                                  <span className="font-medium">
                                    {comment.user.username}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(
                                      comment.created_at,
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-muted-foreground wrap-break-word">
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
                                    className="shrink-0"
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

            {/* Add comment — fixed footer, never scrolls */}
            <div className="border-t bg-background px-10 py-4">
              <form
                onSubmit={handleSubmit(onComment)}
                className="mx-auto max-w-4xl"
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
                        placeholder="Leave a comment..."
                        rows={3}
                      />
                    </Field>
                  )}
                />
                <div className="mt-3 flex justify-end">
                  <Button disabled={isCommenting}>
                    {isCommenting ? 'Commenting...' : 'Add comment'}
                  </Button>
                </div>
              </form>
            </div>
          </section>

          {/* TODO: hide on mobile screen and show small buttons below title */}
          {/* Right Panel */}
          <aside className="lg:w-80 w-full border-l bg-background px-6 py-8 border border-t-0 lg:block hidden ">
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Properties
            </h3>

            <div className="space-y-6">
              <Property label="Assignee" value={task.assignee?.username} />

              <Property label="Email" value={task.assignee?.email} />

              <Property label="Status" value={task.status} />

              <Property label="Priority" value={task.priority} />

              <Property label="Label" value={task.label} />

              <Property
                label="Created"
                value={new Date(task.created_at).toLocaleDateString()}
              />

              <Property
                label="Updated"
                value={new Date(task.updated_at).toLocaleDateString()}
              />
            </div>
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
