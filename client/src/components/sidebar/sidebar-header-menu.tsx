import { useWorkspacePermissions } from '#/hooks/use-workspace-permissions'
import { Check, ChevronsUpDownIcon, PlusIcon, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { SidebarMenuButton } from '../ui/sidebar'
import {
  useDeleteWorkspace,
  useGetUserWorkspace,
  useSwitchWorkspace,
} from '#/hooks/workspace.hooks'
import { useAuth } from '#/context/auth/auth-hook'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Spinner } from '../ui/spinner'
import { useIsMobile } from '#/hooks/use-mobile'

export function SidebarHeaderMenu() {
  const { can } = useWorkspacePermissions()
  const params = useParams({
    strict: false,
  })
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useIsMobile()

  const { data: userWorkspaces } = useGetUserWorkspace()
  const { mutate: deleteWorkspace, isPending: isDeleteingWorkspacePending } =
    useDeleteWorkspace()
  const { mutate: switchWorkspace, isPending: isSwitchingWorkspace } =
    useSwitchWorkspace()

  return (
    <DropdownMenu>
      {/* DROP DOWN MENU TRIGGER */}
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground capitalize">
            {user?.username[0]}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user?.username}</span>
          </div>
          <ChevronsUpDownIcon className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      {/* DROP DOWN MENU CONTENT */}
      <DropdownMenuContent>
        <DropdownMenuGroup>
          {/*  Setting  */}
          <DropdownMenuItem
            onClick={() => {
              navigate({
                to: '/$workspaceId/settings',
                params: { workspaceId: params.workspaceId!! },
              })
            }}
          >
            Settings
          </DropdownMenuItem>
          {/* Invite people */}
          <DropdownMenuItem
            onClick={() => {
              navigate({
                to: '/$workspaceId/settings/members',
                params: { workspaceId: params.workspaceId!! },
              })
            }}
          >
            {can('invitation:manage') ? 'Invite and manage members' : 'Members'}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* Workspace switcher */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Switch Workspace</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent
              alignOffset={isMobile ? 100 : 0}
              sideOffset={isMobile ? -200 : 0}
            >
              {userWorkspaces &&
                userWorkspaces.map((w, index) => {
                  const initials = w.name[0]

                  return (
                    <DropdownMenuItem
                      disabled={isSwitchingWorkspace}
                      key={index}
                      onClick={() => switchWorkspace(w.id)}
                      className="gap-2 p-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-md border">
                        {initials}
                      </div>
                      {w.name}
                      {w.id === user?.activeWorkspace && <Check />}
                      {can('workspace:delete') &&
                        w.id === user?.activeWorkspace && (
                          <DropdownMenuShortcut
                            className="text-red-500"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteWorkspace(w.id)
                            }}
                          >
                            {isDeleteingWorkspacePending ? (
                              <Spinner />
                            ) : (
                              <Trash2 />
                            )}
                          </DropdownMenuShortcut>
                        )}
                    </DropdownMenuItem>
                  )
                })}
              <DropdownMenuItem
                disabled={isSwitchingWorkspace}
                className="gap-2 p-2"
                onClick={() => {
                  navigate({
                    to: '/create-workspace',
                  })
                }}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <PlusIcon className="size-4" />
                </div>

                <div className="font-medium text-muted-foreground">
                  Create workspace
                </div>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuGroup>
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
