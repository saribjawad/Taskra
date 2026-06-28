import { AppSidebar } from '#/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '#/components/ui/sidebar'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/$workspaceId/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger />
      <div>Hello "/dashboard"!</div>
    </SidebarProvider>
  )
}
