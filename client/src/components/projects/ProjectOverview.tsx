import type { ProjectDetail } from '#/type/project'
import TaskDescriptionViewer from '#/components/tasks/TaskDescriptionViewer'
import ProjectMilestones from './ProjectMilestones'

export default function ProjectOverview({
  project,
}: {
  project: ProjectDetail
}) {
  return (
    <div className="space-y-10">
      {/* Summary and description */}
      {project.short_summary && (
        <p className="max-w-prose wrap-break-word text-sm leading-7 text-muted-foreground">
          {project.short_summary}
        </p>
      )}
      <section aria-labelledby="project-description">
        <h2 id="project-description" className="mb-4 text-sm font-medium">
          Description
        </h2>
        <div className="min-w-0 overflow-x-auto [&_.bn-editor]:px-0">
          <TaskDescriptionViewer
            key={project.description}
            value={project.description ?? ''}
          />
        </div>
      </section>
      <ProjectMilestones project={project} />
    </div>
  )
}
