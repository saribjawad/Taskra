import { AppSidebar } from '#/components/app-sidebar'
import { SidebarProvider } from '#/components/ui/sidebar'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/$workspaceId')({
  component: WorkspaceLayout,
})

function WorkspaceLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <Outlet />
    </SidebarProvider>
  )
}
