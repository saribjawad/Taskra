import { useId } from 'react'
import { cn } from '#/lib/utils'
import { Button } from '#/components/ui/button'
import { Box } from 'lucide-react'
import type { ProjectDetail } from '#/type/project'
import { formatProjectDate } from './project-presentation'

export default function ProjectActivity({
  project,
  compact = false,
  onSeeAll,
}: {
  project: ProjectDetail
  compact?: boolean
  onSeeAll?: () => void
}) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className={cn(compact && 'rounded-xl border bg-muted/20 p-4')}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-sm font-medium">
          Activity
        </h2>
        {onSeeAll && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground"
            onClick={onSeeAll}
          >
            See all
          </Button>
        )}
      </div>
      {/* Creation is known from the API; a full event history is not available yet. */}
      <div className="flex items-start gap-3">
        <span className="rounded-full bg-muted p-2">
          <Box className="size-4 text-muted-foreground" />
        </span>
        <div>
          <p className={compact ? 'text-xs' : 'text-sm'}>Project created</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatProjectDate(project.created_at)}
          </p>
        </div>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        A full activity history is coming soon.
      </p>
    </section>
  )
}
