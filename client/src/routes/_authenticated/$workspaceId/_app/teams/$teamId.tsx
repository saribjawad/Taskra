import { createFileRoute, Link } from '@tanstack/react-router'
import { FileText, Store, Users } from 'lucide-react'
import { SidebarTrigger } from '#/components/ui/sidebar'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { TeamDocumentsPanel } from '#/components/teams/TeamDocumentsPanel'
import { TeamMembersPanel } from '#/components/teams/TeamMembersPanel'
import { TeamOverview } from '#/components/teams/TeamOverview'
import { TeamProjectsPanel } from '#/components/teams/TeamProjectsPanel'
import { TeamIssuesPanel } from '#/components/teams/TeamIssuesPanel'
import { useGetTeams } from '#/hooks/team.hooks'

const teamTabs = ['overview', 'documents', 'members'] as const
type TeamTab = (typeof teamTabs)[number] | 'issues' | 'projects'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/_app/teams/$teamId',
)({
  validateSearch: (search: Record<string, unknown>): { tab: TeamTab } => ({
    tab: [...teamTabs, 'issues', 'projects'].includes(search.tab as TeamTab)
      ? (search.tab as TeamTab)
      : 'overview',
  }),
  component: TeamPage,
})

function TeamPage() {
  const { workspaceId, teamId } = Route.useParams()
  const { tab } = Route.useSearch()
  const {
    data: teams = [],
    isPending,
    isError,
    refetch,
  } = useGetTeams(workspaceId)
  const team = teams.find((item) => item.id === teamId)

  return (
    <main className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b">
        <div className="flex min-h-12 items-center gap-2 px-4 sm:px-6">
          <SidebarTrigger className="mr-1 md:hidden" />
          <Store className="size-4 shrink-0 text-purple-500" />
          <h1 className="truncate text-sm font-medium">
            {team?.name ?? 'Team'}
          </h1>
        </div>
        <nav
          aria-label="Team sections"
          className="flex gap-2 px-4 pb-2 sm:px-6"
        >
          {teamTabs.map((value) => {
            const label = value[0].toUpperCase() + value.slice(1)
            const Icon =
              value === 'documents'
                ? FileText
                : value === 'members'
                  ? Users
                  : Store

            return (
              <Link
                key={value}
                to="/$workspaceId/teams/$teamId"
                params={{ workspaceId, teamId }}
                search={{ tab: value }}
                aria-current={tab === value ? 'page' : undefined}
                className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
              >
                <Icon className="size-3.5" />
                {label}
              </Link>
            )
          })}
        </nav>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isPending ? (
          <div className="mx-auto w-full max-w-5xl space-y-5 px-5 py-8 sm:px-8">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-4 w-96 max-w-full" />
            <Skeleton className="mt-12 h-6 w-40" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="flex min-h-64 flex-col items-center justify-center gap-2 p-6 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Unable to load this team.
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : !team ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-2 p-6 text-center">
            <h2 className="text-sm font-medium">Team not found</h2>
            <p className="text-sm text-muted-foreground">
              This team may have been removed or may belong to another
              workspace.
            </p>
          </div>
        ) : tab === 'documents' ? (
          <TeamDocumentsPanel team={team} />
        ) : tab === 'members' ? (
          <TeamMembersPanel team={team} workspaceId={workspaceId} />
        ) : tab === 'projects' ? (
          <TeamProjectsPanel team={team} workspaceId={workspaceId} />
        ) : tab === 'issues' ? (
          <TeamIssuesPanel team={team} workspaceId={workspaceId} />
        ) : (
          <TeamOverview team={team} workspaceId={workspaceId} />
        )}
      </div>
    </main>
  )
}
