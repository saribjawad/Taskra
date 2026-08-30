import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/$workspaceId/settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/$workspaceId/settings/"!</div>
}
