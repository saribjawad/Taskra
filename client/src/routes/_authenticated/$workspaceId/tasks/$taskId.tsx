import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { SidebarTrigger } from '#/components/ui/sidebar'
import { Textarea } from '#/components/ui/textarea'
import { useGetTaskById } from '#/hooks/task.hook'
import { useIsMobile } from '#/hooks/use-mobile'
import { createFileRoute, useParams } from '@tanstack/react-router'

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

function RouteComponent() {
  const params = useParams({ strict: false })
  const isMobile = useIsMobile()
  const { data: task, isLoading } = useGetTaskById({ taskId: params.taskId!! })

  if (isLoading) {
    return <div>Loading</div>
  }

  if (!task) {
    return <div>Something went wrong try again</div>
  }

  return (
    <main className="h-screen w-full flex flex-col  ">
      {/* Bread crumbs */}
      <div className="flex flex-col gap-2  p-3">
        <nav className="flex items-center gap-3">
          {isMobile && <SidebarTrigger />}
          <h5 className="text-sm">My tasks</h5>
        </nav>
        <Separator />
      </div>

      <div className="flex lg:flex-row flex-col flex-1 w-full   justify-between ">
        {/* Main */}

        <section className="flex-1 overflow-y-auto">
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
                <Button variant="outline" size="sm">
                  Edit
                </Button>

                <Button variant="destructive" size="sm">
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
                  task.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium">
                        {comment.user.username[0].toUpperCase()}
                      </div>

                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-3">
                          <span className="font-medium">
                            {comment.user.username}
                          </span>

                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-muted-foreground">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment */}

              <div className="mt-10">
                <Textarea placeholder="Leave a comment..." rows={5} />

                <div className="mt-3 flex justify-end">
                  <Button>Add comment</Button>
                </div>
              </div>
            </section>
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
  )
}
