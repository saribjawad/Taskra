import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/tasks/all',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/$workspaceId/issues/activity"!</div>
}
