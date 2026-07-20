import { Button } from '#/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/tasks/created',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full gap-3">
      <p>No tasks has been created by you</p>
      <Button variant="default" size="sm">
        Create new task
      </Button>
    </div>
  )
}
