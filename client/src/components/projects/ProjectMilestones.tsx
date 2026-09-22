import { useId } from 'react'
import { cn } from '#/lib/utils'
import { Diamond } from 'lucide-react'

// Preview data only. Replace with project milestones when the endpoint exists.
const previewMilestones = ['Planning', 'Implementation', 'Launch']

export default function ProjectMilestones({
  compact = false,
}: {
  compact?: boolean
}) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className={cn(compact && 'rounded-xl border bg-muted/20 p-4')}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-sm font-medium">
          Milestones
        </h2>
        <span className="text-xs text-muted-foreground">
          {compact ? 'Preview' : 'Preview · Coming soon'}
        </span>
      </div>
      {!compact && (
        <p className="mb-3 text-xs text-muted-foreground">
          Example milestones for the upcoming planning feature.
        </p>
      )}
      <ul className="divide-y divide-border/60">
        {previewMilestones.map((name) => (
          <li
            key={name}
            className={cn(
              'flex items-center gap-3 text-muted-foreground',
              compact ? 'py-3 text-xs' : 'py-4 text-sm',
            )}
          >
            <Diamond className="size-3.5 shrink-0" />
            <span>{name}</span>
            <span className="ml-auto text-xs">
              {compact ? '—' : 'Not connected'}
            </span>
          </li>
        ))}
      </ul>
      {compact && (
        <p className="mt-3 text-xs text-muted-foreground">
          Milestone tracking is coming soon.
        </p>
      )}
    </section>
  )
}
