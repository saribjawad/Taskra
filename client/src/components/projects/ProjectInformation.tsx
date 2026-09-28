import type { ProjectDetail } from '#/type/project'
import ProjectProperties from './ProjectProperties'
import ProjectMilestones from './ProjectMilestones'
import ProjectActivity from './ProjectActivity'
import { formatProjectDate } from './project-presentation'
import { useLocation } from '@tanstack/react-router'
import { useGetProjectTaskProgress } from '#/hooks/project.hooks'
import ProjectPersonAvatar from './ProjectPersonAvatar'
import { Skeleton } from '#/components/ui/skeleton'

// Shared content for the desktop sidebar and mobile sheet.
export default function ProjectInformation({
  project,
  onSeeAll,
}: {
  project: ProjectDetail
  onSeeAll: () => void
}) {
  const view = useLocation().search.view
  const {
    data: progress,
    isPending,
    isError,
  } = useGetProjectTaskProgress(project.id)

  return (
    <div className="space-y-4 p-4">
      <ProjectProperties project={project} />
      <ProjectMilestones project={project} compact />
      <section className="rounded-xl border bg-muted/20 p-4">
        <h2 className="text-sm font-medium">Progress</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <dt className="text-muted-foreground">Scope</dt>
            <dd className="mt-1 font-medium">
              {isPending ? (
                <Skeleton className="h-4 w-8" />
              ) : isError ? (
                '—'
              ) : (
                (progress?.scope ?? 0)
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Completed</dt>
            <dd className="mt-1 font-medium">
              {isPending ? (
                <Skeleton className="h-4 w-8" />
              ) : isError ? (
                '—'
              ) : (
                (progress?.completed ?? 0)
              )}
            </dd>
          </div>
        </dl>
        <div className="mt-4 border-t pt-3">
          <h3 className="mb-3 text-xs text-muted-foreground">Assignees</h3>
          {isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : isError ? (
            <p className="text-xs text-muted-foreground">
              Could not load assignee totals.
            </p>
          ) : progress?.assignees.length ? (
            <ul className="space-y-3">
              {progress.assignees.map((assignee) => (
                <li
                  key={assignee.id}
                  className="flex min-w-0 items-center gap-2 text-xs"
                >
                  <ProjectPersonAvatar
                    name={assignee.username || assignee.email}
                    className="size-5 shrink-0"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {assignee.username || assignee.email}
                  </span>
                  <span className="text-muted-foreground">
                    {assignee.taskCount}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No assigned tasks.</p>
          )}
        </div>
      </section>
      {/* Open the full activity tab from the sidebar summary. */}
      {view !== 'activity' && (
        <ProjectActivity project={project} compact onSeeAll={onSeeAll} />
      )}
      <p className="px-1 text-xs text-muted-foreground">
        Last updated {formatProjectDate(project.updated_at)}
      </p>
    </div>
  )
}
