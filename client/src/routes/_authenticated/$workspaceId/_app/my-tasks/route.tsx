import { useWorkspacePermissions } from '#/hooks/use-workspace-permissions'
import CreateTaskDialog from '#/components/tasks/CreateTaskDialog'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { SidebarTrigger } from '#/components/ui/sidebar'
import { useIsMobile } from '#/hooks/use-mobile'
import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/_app/my-tasks',
)({
  component: RouteComponent,
})

const filterButtons = [
  { name: 'Assigned', to: '/$workspaceId/my-tasks/assigned' },
  { name: 'Created', to: '/$workspaceId/my-tasks/created' },
  { name: 'All', to: '/$workspaceId/my-tasks/all' },
]

function RouteComponent() {
  const { can } = useWorkspacePermissions()
  const isMobile = useIsMobile()
  const { workspaceId } = Route.useParams()
  const { pathname } = useLocation()

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

  return (
    <main className="h-screen w-full p-3 flex flex-col gap-2">
      {/* Header */}
      <nav className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          {isMobile && <SidebarTrigger />}
          <h5 className="text-sm">My tasks</h5>
        </div>
        {can('task:create') && (
          <CreateTaskDialog
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            trigger={
              <Button
                aria-label="Create task"
                variant="ghost"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus />
              </Button>
            }
          />
        )}
      </nav>
      <Separator />

      {/* Filter Buttons */}
      <div className="flex items-center gap-1">
        {filterButtons.map((btn) => {
          const btnPathname = btn.to.split('/').pop()

          return (
            <Button
              asChild
              key={btn.name}
              variant="secondary"
              size="sm"
              className={
                pathname.split('/').pop() === btnPathname
                  ? 'bg-accent text-foreground'
                  : 'bg-transparent text-muted-foreground'
              }
            >
              {/* {btn.name} */}
              <Link to={btn.to} params={{ workspaceId }}>
                {btn.name}
              </Link>
            </Button>
          )
        })}
      </div>
      <Outlet />
    </main>
  )
}
