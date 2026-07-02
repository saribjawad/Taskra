import * as React from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Check, ChevronsUpDownIcon, PlusIcon } from 'lucide-react'
import { useAuth } from '#/context/authContext'
import { useNavigate } from '@tanstack/react-router'
import { useSwitchWorkspace } from '#/hooks/workspace.hooks'

interface WorkspaceSwitcherProps {
  workspaces: {
    id: string
    name: string
  }[]
}

export function WorkspaceSwitcher({ workspaces }: WorkspaceSwitcherProps) {
  const { user } = useAuth()
  const { isMobile } = useSidebar()
  const activeWorkspace = workspaces.find((w) => w.id === user?.activeWorkspace)

  // TODO: add loading indicator
  const { mutate: switchWorkspace, isPending } = useSwitchWorkspace()
  const navigate = useNavigate()

  if (!activeWorkspace) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {activeWorkspace.name[0]}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeWorkspace.name}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Workspaces
            </DropdownMenuLabel>
            {workspaces.map((w, index) => {
              const initials = w.name[0]

              return (
                <DropdownMenuItem
                  key={w.name}
                  onClick={() => switchWorkspace(w.id)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    {initials}
                  </div>
                  {w.name}
                  {w.id === user?.activeWorkspace && <Check />}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
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
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
