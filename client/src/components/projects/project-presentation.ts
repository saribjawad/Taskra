import type { ProjectStatus } from '#/type/project'

export const projectStatuses: Record<
  ProjectStatus,
  { label: string; color: string }
> = {
  backlog: { label: 'Backlog', color: 'bg-muted-foreground/50' },
  planned: { label: 'Planned', color: 'bg-blue-500' },
  in_progress: { label: 'In progress', color: 'bg-amber-500' },
  completed: { label: 'Completed', color: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', color: 'bg-muted-foreground/50' },
}

export function formatProjectDate(value: string | null) {
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
