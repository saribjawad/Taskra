import { Button } from '#/components/ui/button'
import {
  useGetUserWorkspace,
  useSwitchWorkspace,
} from '#/hooks/workspace.hooks'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/workspace-removed')({
  component: WorkspaceRemovedPage,
})

function WorkspaceRemovedPage() {
  const navigate = useNavigate()
  const { data: workspaces = [], isLoading } = useGetUserWorkspace()
  const switchWorkspace = useSwitchWorkspace()

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-md space-y-5 text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Workspace access removed</h1>
          <p className="text-sm text-muted-foreground">
            You have been removed from this workspace. Contact its owner if you
            think this is a mistake.
          </p>
        </div>

        {!isLoading && workspaces.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You still have access to these workspaces:
            </p>
            <div className="space-y-2 text-left">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="flex items-center justify-between gap-4 rounded-md border p-3"
                >
                  <span className="truncate text-sm font-medium">
                    {workspace.name}
                  </span>
                  <Button
                    size="sm"
                    disabled={switchWorkspace.isPending}
                    onClick={() => switchWorkspace.mutate(workspace.id)}
                  >
                    Join
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : !isLoading ? (
          <Button onClick={() => navigate({ to: '/create-workspace' })}>
            Create a workspace
          </Button>
        ) : null}
      </section>
    </main>
  )
}
