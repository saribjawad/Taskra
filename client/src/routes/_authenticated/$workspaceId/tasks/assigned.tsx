import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { useGetTasks } from '#/hooks/task.hook'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/tasks/assigned',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { data, isLoading } = useGetTasks()

  if (isLoading) {
    return <div>loading</div>
  }

  if (!data?.tasks.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">No tasks assigned to you.</p>

        <Button size="sm">Create new task</Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.tasks.map((task) => (
        <div
          key={task.id}
          className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-medium">{task.title}</h3>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            </div>
            <Badge>{task.status}</Badge>
          </div>

          <Separator className="my-3" />

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{task.priority}</Badge>

            <Badge variant="outline">{task.label}</Badge>

            <span>Assigned: {task.assignee}</span>

            <span className="ml-auto">
              Updated {new Date(task.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
