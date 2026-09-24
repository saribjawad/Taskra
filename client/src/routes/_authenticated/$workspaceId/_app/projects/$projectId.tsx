import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#/components/ui/tabs'
import { Box, ChevronRight, CircleDot, Link2, PanelRight } from 'lucide-react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { SidebarTrigger } from '#/components/ui/sidebar'
import { useAuth } from '#/context/auth/auth-hook'
import { useGetProject } from '#/hooks/project.hooks'
import ProjectOverview from '#/components/projects/ProjectOverview'
import ProjectActivity from '#/components/projects/ProjectActivity'
import ProjectInformation from '#/components/projects/ProjectInformation'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '#/components/ui/sheet'

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
  const [propertiesOpen, setPropertiesOpen] = useState(false)

  // A panel opened on mobile must close when the fixed desktop sidebar appears.
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const closeOnDesktop = () => {
      if (desktop.matches) setPropertiesOpen(false)
    }

    desktop.addEventListener('change', closeOnDesktop)

    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [])

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
    <main className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {/* Breadcrumbs and project link */}
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-6">
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
        <Tabs
          value={view}
          className="grid min-h-0 flex-1 gap-0 grid-rows-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[minmax(0,1fr)]"
          onValueChange={(value) =>
            void navigate({ search: { view: value as ProjectView } })
          }
        >
          <div className="flex min-h-0 min-w-0 flex-col">
            {/* URL-backed tabs support keyboard navigation and browser history. */}
            <div className="flex shrink-0 items-center justify-between border-b pr-4">
              <TabsList
                variant="default"
                aria-label="Project sections"
                className="flex h-auto gap-1 rounded-none bg-transparent px-4 py-3 group-data-horizontal/tabs:h-auto sm:px-6"
              >
                {projectViews.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="h-auto flex-none rounded-full px-3 py-1.5 text-xs font-normal text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[state=active]:bg-muted data-[state=active]:font-medium data-[state=active]:text-foreground"
                  >
                    {tab === 'overview'
                      ? 'Overview'
                      : tab === 'activity'
                        ? 'Activity'
                        : 'Issues'}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Sheet open={propertiesOpen} onOpenChange={setPropertiesOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="lg:hidden"
                    aria-label="Open project properties"
                  >
                    <PanelRight className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="gap-0 data-[side=right]:w-[min(24rem,100vw)]"
                >
                  <SheetHeader className="shrink-0 border-b pr-12">
                    <SheetTitle>Project properties</SheetTitle>
                    <SheetDescription className="sr-only">
                      Project properties, milestones, progress, and activity.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <ProjectInformation
                      project={project}
                      onSeeAll={() => {
                        setPropertiesOpen(false)
                        void navigate({ search: { view: 'activity' } })
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="mx-auto max-w-4xl min-w-0 px-4 pb-14 pt-8 sm:px-8 lg:px-10 lg:pt-12">
                {/* Project identity remains visible when switching sections. */}
                <div className="mb-8">
                  <span className="mb-4 inline-flex rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                    <Box className="size-6" />
                  </span>
                  <h1 className="wrap-break-words text-2xl font-semibold tracking-tight">
                    {project.name}
                  </h1>
                </div>
                <TabsContent
                  value="overview"
                  className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ProjectOverview project={project} />
                </TabsContent>
                <TabsContent
                  value="activity"
                  className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ProjectActivity project={project} />
                </TabsContent>
                <TabsContent
                  value="issues"
                  className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <section className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center">
                    <CircleDot className="mb-4 size-6 text-muted-foreground" />
                    <h2 className="text-sm font-medium">Project issues</h2>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                      Issues linked to this project will appear here. This
                      feature is coming soon.
                    </p>
                  </section>
                </TabsContent>
              </div>
            </div>
          </div>

          <aside
            aria-label="Project information"
            className="hidden min-h-0 min-w-0 overflow-y-auto overscroll-contain border-l lg:block"
          >
            <ProjectInformation
              project={project}
              onSeeAll={() => void navigate({ search: { view: 'activity' } })}
            />
          </aside>
        </Tabs>
      )}
    </main>
  )
}
