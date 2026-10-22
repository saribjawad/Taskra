import { Link as RouterLink } from '@tanstack/react-router'
import { FolderOpen } from 'lucide-react'
import { useGetTeamProjects } from '#/hooks/team.hooks'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { PRIORITY_ITEMS } from '#/constants'
import {
  formatProjectDate,
  projectStatuses,
} from '#/components/projects/project-presentation'
import { cn } from '#/lib/utils'
import type { Team } from '#/type/team'
import { useGetWorkspaceUsers } from '#/hooks/workspace.hooks'

export function TeamProjectsPanel({
  team,
  workspaceId,
}: {
  team: Team
  workspaceId: string
}) {
  const { data, isPending, isError, refetch } = useGetTeamProjects(
    team.id,
    1,
    50,
  )
  const { data: members } = useGetWorkspaceUsers(workspaceId)

  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">{team.name} projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Projects assigned to this team.
        </p>
      </div>

      {isPending ? (
        <div className="divide-y divide-border/60">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-3 py-5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
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
        <div className="flex min-h-64 flex-col items-center justify-center text-center">
          <FolderOpen className="mb-4 size-6 text-muted-foreground" />
          <h2 className="text-sm font-medium">No projects yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Projects created for this team will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60 border-y border-border/60">
          {data.projects.map((project) => {
            const status = projectStatuses[project.status]
            const lead = project.lead_id
              ? (members?.find((member) => member.id === project.lead_id)
                  ?.username ?? 'Unknown member')
              : 'Unassigned'
            const priority = PRIORITY_ITEMS.find(
              (item) => item.value === project.priority,
            )?.label

            return (
              <li key={project.id}>
                <RouterLink
                  to="/$workspaceId/projects/$projectId"
                  search={{ view: 'overview' }}
                  params={{ workspaceId, projectId: project.id }}
                  className="block rounded-sm px-2 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring sm:px-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                    <h2 className="min-w-0 wrap-break-word text-sm font-medium">
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
                  <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4">
                    {[
                      ['Lead', lead],
                      ['Priority', priority],
                      ['Start date', formatProjectDate(project.start_date)],
                      ['Target date', formatProjectDate(project.target_date)],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex min-w-0 flex-wrap gap-x-1.5"
                      >
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="wrap-break-words">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </RouterLink>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
