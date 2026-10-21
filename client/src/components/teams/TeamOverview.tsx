import { ExternalLink, Link2, Users } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarGroup } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { useGetTeamLinks, useGetTeamMembers } from '#/hooks/team.hooks'
import { getInitials } from '#/lib/utils'
import type { Team } from '#/type/team'
import { DeleteTeamDialog } from './DeleteTeamDialog'
import { AddTeamLinkDialog } from './TeamResourceDialogs'

export function TeamOverview({
  team,
  workspaceId,
  isLastTeam,
  onDeleted,
}: {
  team: Team
  workspaceId: string
  isLastTeam: boolean
  onDeleted: () => void
}) {
  const { data: links, isPending, isError, refetch } = useGetTeamLinks(team.id)
  const { data: members = [] } = useGetTeamMembers(team.id)

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-16">
      <section className="min-w-0">
        <div className="mb-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
                <Users className="size-5" />
              </div>
              <h1 className="truncate text-xl font-semibold">{team.name}</h1>
            </div>
            <DeleteTeamDialog
              team={team}
              workspaceId={workspaceId}
              isLastTeam={isLastTeam}
              onDeleted={onDeleted}
            />
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
            {team.description || 'Add a description…'}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-medium">Team resources</h2>
          <AddTeamLinkDialog teamId={team.id} />
        </div>
        <div className="mt-3 divide-y divide-border/50">
          {isPending ? (
            Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center gap-3 py-3">
                <Skeleton className="size-4" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))
          ) : isError ? (
            <div role="alert" className="py-6 text-sm text-muted-foreground">
              <p>Unable to load team links.</p>
              <Button variant="link" size="sm" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : links?.length ? (
            links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-2.5 rounded-md px-2 py-3 text-sm transition-colors hover:bg-muted/50"
              >
                <Link2 className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{link.title}</span>
                <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
              </a>
            ))
          ) : (
            <p className="py-6 text-sm text-muted-foreground">
              No team links yet.
            </p>
          )}
        </div>
      </section>

      <aside className="space-y-8">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-sm text-muted-foreground">Members</h2>
            <Link
              to="/$workspaceId/teams/$teamId"
              params={{ workspaceId, teamId: team.id }}
              search={{ tab: 'members' }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Manage
            </Link>
          </div>
          <Link
            to="/$workspaceId/teams/$teamId"
            params={{ workspaceId, teamId: team.id }}
            search={{ tab: 'members' }}
            className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            aria-label={`${members.length} team members`}
          >
            {members.length ? (
              <AvatarGroup className="*:data-[slot=avatar]:size-6">
                {members.slice(0, 5).map((member) => (
                  <Avatar key={member.id} size="sm">
                    <AvatarFallback>
                      {getInitials(member.fullName || member.username)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </AvatarGroup>
            ) : (
              <Users className="size-4" />
            )}
            <span>
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
          </Link>
        </section>
      </aside>
    </div>
  )
}
