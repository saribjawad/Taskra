import { SettingSidebar } from '#/components/sidebar/setting-sidebar'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/$workspaceId/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <SettingSidebar />
      <Outlet />
    </>
  )
}
