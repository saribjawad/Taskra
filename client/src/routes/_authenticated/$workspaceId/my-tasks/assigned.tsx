import TaskCard from '#/components/tasks/TaskCard'
import { useGetTasks } from '#/hooks/task.hook'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/my-tasks/assigned',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { data, isLoading } = useGetTasks({ filter: 'assigned' })

  if (isLoading) {
    return <div>loading</div>
  }

  if (!data?.tasks.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">No tasks assigned to you.</p>
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
