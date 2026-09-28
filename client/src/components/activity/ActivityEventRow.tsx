import type { ReactNode } from 'react'
import { formatDateTime } from '#/lib/utils'
import { Skeleton } from '#/components/ui/skeleton'

export interface ActivityEventItem {
  description: string
  createdAt: string | Date
}

export function ActivityEventRow({
  icon,
  description,
  createdAt,
}: ActivityEventItem & { icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
        {icon}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <p className="wrap-anywhere text-xs leading-6 text-muted-foreground">
          {description}
        </p>
        <span className="text-xs text-muted-foreground">·</span>
        <time className="shrink-0 text-xs text-muted-foreground">
          {formatDateTime(createdAt)}
        </time>
      </div>
    </div>
  )
}

export function ActivityEventSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2 pt-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      ))}
    </div>
  )
}
