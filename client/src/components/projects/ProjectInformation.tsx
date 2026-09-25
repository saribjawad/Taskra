import type { ProjectDetail } from '#/type/project'
import ProjectProperties from './ProjectProperties'
import ProjectMilestones from './ProjectMilestones'
import ProjectActivity from './ProjectActivity'
import { formatProjectDate } from './project-presentation'

// Shared content for the desktop sidebar and mobile sheet.
export default function ProjectInformation({
  project,
  onSeeAll,
}: {
  project: ProjectDetail
  onSeeAll: () => void
}) {
  return (
    <div className="space-y-4 p-4">
      <ProjectProperties project={project} />
      <ProjectMilestones project={project} compact />
      <section className="rounded-xl border bg-muted/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">Progress</h2>
          <span className="text-xs text-muted-foreground">Coming soon</span>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Project task completion tracking is coming soon.
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
      <ProjectActivity project={project} compact onSeeAll={onSeeAll} />
      <p className="px-1 text-xs text-muted-foreground">
        Last updated {formatProjectDate(project.updated_at)}
      </p>
    </div>
  )
}
