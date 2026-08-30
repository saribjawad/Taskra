import { AppSidebar } from '#/components/sidebar/app-sidebar'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/$workspaceId/_app')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <AppSidebar />
      <Outlet />
    </>
  )
}
