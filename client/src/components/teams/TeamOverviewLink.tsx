import { Link } from '@tanstack/react-router'
import { Users } from 'lucide-react'

export function TeamOverviewLink({
  team,
  workspaceId,
}: {
  team: { id: string; name: string }
  workspaceId: string
}) {
  return (
    <Link
      to="/$workspaceId/teams/$teamId"
      params={{ workspaceId, teamId: team.id }}
      search={{ tab: 'overview' }}
      className="inline-flex max-w-full items-center gap-2 rounded-sm text-xs hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      aria-label={`Open ${team.name} team overview`}
    >
      <Users className="size-3.5 shrink-0 text-purple-500" />
      <span className="truncate">{team.name}</span>
    </Link>
  )
}
