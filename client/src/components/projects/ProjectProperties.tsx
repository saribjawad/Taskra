import ProjectMemberPicker from './ProjectMemberPicker'
import { CalendarDays, Flag, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ProjectDetail } from '#/type/project'
import { PRIORITY_ITEMS } from '#/constants'
import { cn } from '#/lib/utils'
import { formatProjectDate, projectStatuses } from './project-presentation'

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 wrap-break-word">{children}</dd>
    </div>
  )
}

export default function ProjectProperties({
  project,
}: {
  project: ProjectDetail
}) {
  const status = projectStatuses[project.status]
  const priority = PRIORITY_ITEMS.find(
    (item) => item.value === project.priority,
  )?.label

  return (
    <section
      aria-labelledby="project-properties"
      className="rounded-xl border bg-muted/20 p-4"
    >
      <h2 id="project-properties" className="mb-3 text-sm font-medium">
        Properties
      </h2>
      <dl className="text-xs leading-5">
        {/* Project status and priority */}
        <Property label="Status">
          <span className="flex items-center gap-2">
            <span className={cn('size-2 rounded-full', status.color)} />
            {status.label}
          </span>
        </Property>
        <Property label="Priority">
          <span className="flex items-center gap-2">
            <Flag className="size-3.5 text-muted-foreground" />
            {priority}
          </span>
        </Property>
        {/* People returned by the project API */}
        <Property label="Lead">
          <span className="flex items-start gap-2">
            <UserRound className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            {project.lead?.username || 'Unassigned'}
          </span>
        </Property>
        <Property label="Members">
          <ProjectMemberPicker project={project} />
        </Property>
        {/* Project timeline */}
        <Property label="Start date">
          <span className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            {formatProjectDate(project.start_date)}
          </span>
        </Property>
        <Property label="Target date">
          <span className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            {formatProjectDate(project.target_date)}
          </span>
        </Property>
      </dl>
    </section>
  )
}
