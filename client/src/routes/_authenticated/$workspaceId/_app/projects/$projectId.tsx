import { createFileRoute, Link } from '@tanstack/react-router'
import { Tabs } from 'radix-ui'
import { Box, ChevronRight, CircleDot, Link2 } from 'lucide-react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { SidebarTrigger } from '#/components/ui/sidebar'
import { useAuth } from '#/context/auth/auth-hook'
import { useGetProject } from '#/hooks/project.hooks'
import ProjectOverview from '#/components/projects/ProjectOverview'
import ProjectProperties from '#/components/projects/ProjectProperties'
import ProjectMilestones from '#/components/projects/ProjectMilestones'
import ProjectActivity from '#/components/projects/ProjectActivity'
import { formatProjectDate } from '#/components/projects/project-presentation'

const projectViews = ['overview', 'activity', 'issues'] as const
type ProjectView = (typeof projectViews)[number]

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/_app/projects/$projectId',
)({
  validateSearch: (search: Record<string, unknown>): { view: ProjectView } => ({
    view: projectViews.includes(search.view as ProjectView)
      ? (search.view as ProjectView)
      : 'overview',
  }),
  component: ProjectDetailPage,
})

function ProjectDetailPage() {
  const { workspaceId, projectId } = Route.useParams()
  const { view } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { user } = useAuth()
  const {
    data: project,
    isPending,
    isError,
    error,
    refetch,
  } = useGetProject(workspaceId, projectId)
  const wrongWorkspace = user?.activeWorkspace !== workspaceId
  const notFound = isAxiosError(error) && error.response?.status === 404

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Project link copied')
    } catch {
      toast.error('Unable to copy the link')
    }
  }

  return (
    <main className="min-h-dvh min-w-0 flex-1">
      {/* Breadcrumbs and project link */}
      <header className="flex min-h-14 items-center justify-between gap-4 border-b px-4 sm:px-6">
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-2 text-sm"
        >
          <SidebarTrigger className="mr-1 md:hidden" />
          <Link
            to="/$workspaceId/projects"
            params={{ workspaceId }}
            search={{ page: 1, limit: 10 }}
            className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            Projects
          </Link>
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          <Box className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span aria-current="page" className="truncate">
            {project?.name ?? 'Project details'}
          </span>
        </nav>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Copy project link"
          onClick={() => void copyLink()}
        >
          <Link2 className="size-4" />
        </Button>
      </header>

      {/* Loading and access errors */}
      {wrongWorkspace ? (
        <div
          role="alert"
          className="px-6 py-16 text-center text-sm text-muted-foreground"
        >
          Switch to this workspace to view the project.
        </div>
      ) : isPending ? (
        <div
          role="status"
          aria-label="Loading project"
          className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[minmax(0,1fr)_20rem]"
        >
          <div className="space-y-5">
            <Skeleton className="size-10" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      ) : isError || !project ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-4 px-6 py-16"
        >
          <h1 className="text-lg font-medium">
            {notFound ? 'Project not found' : 'Unable to load project'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {notFound
              ? 'This project may have been removed or is not in your active workspace.'
              : 'Please try again.'}
          </p>
          {!notFound && (
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          )}
          <Link
            to="/$workspaceId/projects"
            params={{ workspaceId }}
            search={{ page: 1, limit: 10 }}
            className="text-sm underline underline-offset-4"
          >
            Back to projects
          </Link>
        </div>
      ) : (
        <Tabs.Root
          value={view}
          onValueChange={(value) =>
            void navigate({ search: { view: value as ProjectView } })
          }
        >
          {/* URL-backed tabs support keyboard navigation and browser history. */}
          <Tabs.List
            aria-label="Project sections"
            className="flex gap-1 px-4 py-3 sm:px-6"
          >
            {projectViews.map((tab) => (
              <Tabs.Trigger
                key={tab}
                value={tab}
                className="rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[state=active]:bg-muted data-[state=active]:font-medium data-[state=active]:text-foreground"
              >
                {tab === 'overview'
                  ? 'Overview'
                  : tab === 'activity'
                    ? 'Activity'
                    : 'Issues'}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12 lg:px-10">
            <div className="min-w-0 lg:pt-8">
              {/* Project identity remains visible when switching sections. */}
              <div className="mb-8">
                <span className="mb-4 inline-flex rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                  <Box className="size-6" />
                </span>
                <h1 className="break-words text-2xl font-semibold tracking-tight">
                  {project.name}
                </h1>
              </div>
              <Tabs.Content
                value="overview"
                className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ProjectOverview project={project} />
              </Tabs.Content>
              <Tabs.Content
                value="activity"
                className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ProjectActivity project={project} />
              </Tabs.Content>
              <Tabs.Content
                value="issues"
                className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <section className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center">
                  <CircleDot className="mb-4 size-6 text-muted-foreground" />
                  <h2 className="text-sm font-medium">Project issues</h2>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                    Issues linked to this project will appear here. This feature
                    is coming soon.
                  </p>
                </section>
              </Tabs.Content>
            </div>

            {/* Project properties use live data; progress is a future feature. */}
            <aside
              aria-label="Project information"
              className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start"
            >
              <ProjectProperties project={project} />
              {/* Milestone preview uses the same data as the overview. */}
              <ProjectMilestones compact />
              <section className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-medium">Progress</h2>
                  <span className="text-xs text-muted-foreground">
                    Coming soon
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Track completion here once project issues are available.
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Scope</dt>
                    <dd className="mt-1" aria-label="Not available">
                      —
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Completed</dt>
                    <dd className="mt-1" aria-label="Not available">
                      —
                    </dd>
                  </div>
                </dl>
              </section>
              {/* Open the full activity tab from the sidebar summary. */}
              <ProjectActivity
                project={project}
                compact
                onSeeAll={() => void navigate({ search: { view: 'activity' } })}
              />
              <p className="px-1 text-xs text-muted-foreground">
                Last updated {formatProjectDate(project.updated_at)}
              </p>
            </aside>
          </div>
        </Tabs.Root>
      )}
    </main>
  )
}
