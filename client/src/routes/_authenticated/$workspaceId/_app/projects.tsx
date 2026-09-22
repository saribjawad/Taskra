import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, FolderOpen, Plus } from 'lucide-react'
import CreateProjectDialog from '#/components/projects/CreateProjectDialog'
import { PageLayout } from '#/components/layout/PageLayout'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { useGetProjects } from '#/hooks/project.hooks'
import { useGetWorkspaceUsers } from '#/hooks/workspace.hooks'
import { PRIORITY_ITEMS } from '#/constants'
import type { ProjectStatus } from '#/type/project'
import { cn } from '#/lib/utils'

const pageSizes = [10, 20, 50]
const statuses: Record<ProjectStatus, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: 'bg-muted-foreground/50' },
  planned: { label: 'Planned', color: 'bg-blue-500' },
  in_progress: { label: 'In progress', color: 'bg-amber-500' },
  completed: { label: 'Completed', color: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', color: 'bg-muted-foreground/50' },
}

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/_app/projects',
)({
  validateSearch: (search: Record<string, unknown>) => ({
    page:
      Number.isSafeInteger(Number(search.page)) && Number(search.page) > 0
        ? Number(search.page)
        : 1,
    limit: pageSizes.includes(Number(search.limit)) ? Number(search.limit) : 10,
  }),
  component: ProjectsPage,
})

function formatDate(value: string | null) {
  if (!value) return 'Not set'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Not set'
    : date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
}

function ProjectsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { workspaceId } = Route.useParams()
  const { page, limit } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data, isPending, isError, isFetching, refetch } = useGetProjects(
    workspaceId,
    page,
    limit,
  )
  const { data: members } = useGetWorkspaceUsers(workspaceId)

  return (
    <PageLayout
      title="Projects"
      actions={
        <CreateProjectDialog
          key={workspaceId}
          workspaceId={workspaceId}
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          trigger={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="size-4" />
              New project
            </Button>
          }
          onCreated={() => {
            void navigate({ search: { page: 1, limit } })
          }}
        />
      }
    >
      <p className="mb-6 text-sm text-muted-foreground">
        Projects in this workspace
      </p>
      {isPending ? (
        <div
          role="status"
          aria-label="Loading projects"
          className="divide-y divide-border/60"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-3 py-5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="flex min-h-64 flex-col items-center justify-center gap-3"
        >
          <p className="text-sm text-muted-foreground">
            Unable to load projects.
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : !data?.projects.length ? (
        <div
          role="status"
          className="flex min-h-64 flex-col items-center justify-center text-center"
        >
          <FolderOpen className="mb-4 size-6 text-muted-foreground" />
          <h2 className="text-sm font-medium">
            {page > 1 ? 'No projects on this page' : 'No projects yet'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {page > 1
              ? 'Go back to see earlier projects.'
              : 'Created projects will appear here.'}
          </p>
          {page > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => navigate({ search: { page: 1, limit } })}
            >
              Back to first page
            </Button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-border/60 border-y border-border/60">
          {data.projects.map((project) => {
            const status = statuses[project.status]
            const lead = project.lead_id
              ? (members?.find((member) => member.id === project.lead_id)
                  ?.username ?? 'Unknown member')
              : 'Unassigned'
            const priority = PRIORITY_ITEMS.find(
              (item) => item.value === project.priority,
            )?.label
            return (
              <li key={project.id} className="py-5 sm:px-2">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                  <h2 className="min-w-0 break-words text-sm font-medium">
                    {project.name}
                  </h2>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className={cn('size-1.5 rounded-full', status.color)}
                    />
                    {status.label}
                  </span>
                </div>
                {project.short_summary && (
                  <p className="mt-1.5 max-w-prose break-words text-sm leading-6 text-muted-foreground">
                    {project.short_summary}
                  </p>
                )}
                <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4">
                  {[
                    ['Lead', lead],
                    ['Priority', priority],
                    ['Start date', formatDate(project.start_date)],
                    ['Target date', formatDate(project.target_date)],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="mt-1 break-words">{value}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            )
          })}
        </ul>
      )}
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <Select
            value={String(limit)}
            onValueChange={(value) =>
              navigate({ search: { page: 1, limit: Number(value) } })
            }
          >
            <SelectTrigger
              size="sm"
              aria-label="Projects per page"
              className="w-16 border-transparent shadow-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizes.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>projects</span>
          {isFetching && !isPending && <span role="status">Updating…</span>}
        </div>
        <div className="flex items-center gap-2">
          <span>Page {page}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous page"
            disabled={page <= 1 || isFetching}
            onClick={() => navigate({ search: { page: page - 1, limit } })}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next page"
            disabled={!data?.metadata.hasNextPage || isFetching || isError}
            onClick={() => navigate({ search: { page: page + 1, limit } })}
          >
            <ChevronRight />
          </Button>
        </div>
      </footer>
    </PageLayout>
  )
}
