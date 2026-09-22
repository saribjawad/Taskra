import { useWorkspacePermissions } from '#/hooks/use-workspace-permissions'
import CreateTaskDialog from '#/components/tasks/CreateTaskDialog'
import { Button } from '#/components/ui/button'
import { PageLayout, PageTabs, PageTab } from '#/components/layout/PageLayout'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
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
  const { workspaceId } = Route.useParams()

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

  return (
    <PageLayout
      title="My tasks"
      actions={
        can('task:create') && (
          <CreateTaskDialog
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            trigger={
              <Button
                aria-label="Create task"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="size-4" />
                New task
              </Button>
            }
          />
        )
      }
      tabs={
        <PageTabs aria-label="Task views">
          {filterButtons.map((btn) => (
            <PageTab key={btn.name}>
              <Link to={btn.to} params={{ workspaceId }}>
                {btn.name}
              </Link>
            </PageTab>
          ))}
        </PageTabs>
      }
    >
      <Outlet />
    </PageLayout>
  )
}
