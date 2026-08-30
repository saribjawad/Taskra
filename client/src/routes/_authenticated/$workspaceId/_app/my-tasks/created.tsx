import TaskCard from '#/components/tasks/TaskCard'
import { Button } from '#/components/ui/button'
import { useGetTasks } from '#/hooks/task.hook'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/_app/my-tasks/created',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { data, isLoading } = useGetTasks({ filter: 'created' })

  if (isLoading) {
    return <div>loading</div>
  }

  if (!data?.tasks.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">No tasks created by you.</p>
        <Button variant="default" size="sm">
          Create new task
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.tasks.map((task) => (
        <TaskCard key={task.id} {...task} />
      ))}
    </div>
  )
}
