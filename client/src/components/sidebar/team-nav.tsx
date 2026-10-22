import { useLocation, useNavigate, useParams } from '@tanstack/react-router'
import {
  ChevronDown,
  FolderOpen,
  House,
  Plus,
  Users,
  CircleDotDashed,
} from 'lucide-react'
import { useState } from 'react'
import { useGetTeams } from '#/hooks/team.hooks'
import { CreateTeamDialog } from '#/components/teams/CreateTeamDialog'
import { useWorkspacePermissions } from '#/hooks/use-workspace-permissions'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '#/components/ui/sidebar'

const teamLinks = [
  { title: 'Home', icon: House, tab: 'overview' },
  { title: 'Issues', icon: CircleDotDashed, tab: 'issues' },
  { title: 'Projects', icon: FolderOpen, tab: 'projects' },
] as const

export function TeamNav() {
  const params = useParams({ strict: false })
  const { search } = useLocation()
  const navigate = useNavigate()
  const workspaceId = params.workspaceId as string
  const activeTeamId =
    'teamId' in params ? (params.teamId as string) : undefined
  const activeSection =
    'tab' in search ? (search.tab as string | undefined) : undefined
  const { data: teams = [] } = useGetTeams(workspaceId)
  const { can } = useWorkspacePermissions()
  const [openTeamId, setOpenTeamId] = useState<string | undefined>(activeTeamId)

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Your teams</SidebarGroupLabel>
      {can('team:create') && (
        <CreateTeamDialog
          workspaceId={workspaceId}
          trigger={
            <SidebarGroupAction aria-label="Create team" title="Create team">
              <Plus />
            </SidebarGroupAction>
          }
        />
      )}
      <SidebarMenu>
        {teams.map((team) => (
          <Collapsible
            key={team.id}
            asChild
            open={openTeamId === team.id}
            onOpenChange={(open) => setOpenTeamId(open ? team.id : undefined)}
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={team.name}>
                  <Users className="text-purple-500" />
                  <span>{team.name}</span>
                  <ChevronDown className="ml-auto size-3.5 transition-transform data-[state=closed]:-rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {teamLinks.map(({ title, icon: Icon, tab }) => {
                    const isActive =
                      activeTeamId === team.id &&
                      ((tab === 'overview' &&
                        (!activeSection ||
                          ['overview', 'documents', 'members'].includes(
                            activeSection,
                          ))) ||
                        (tab === 'issues' && activeSection === 'issues') ||
                        (tab === 'projects' && activeSection === 'projects'))

                    return (
                      <SidebarMenuSubItem key={title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActive}
                          className="w-full"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (tab === 'overview') {
                                navigate({
                                  to: '/$workspaceId/teams/$teamId',
                                  params: { workspaceId, teamId: team.id },
                                  search: { tab: 'overview' },
                                })
                              } else if (tab === 'issues') {
                                navigate({
                                  to: '/$workspaceId/teams/$teamId',
                                  params: { workspaceId, teamId: team.id },
                                  search: { tab: 'issues' },
                                })
                              } else {
                                navigate({
                                  to: '/$workspaceId/teams/$teamId',
                                  params: { workspaceId, teamId: team.id },
                                  search: { tab: 'projects' },
                                })
                              }
                            }}
                          >
                            <Icon />
                            <span>{title}</span>
                          </button>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
