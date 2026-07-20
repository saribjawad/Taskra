import * as React from 'react'
import { NavUser } from '@/components/nav-user'
import { WorkspaceSwitcher } from '#/components/workspace-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  GalleryVerticalEndIcon,
  AudioLinesIcon,
  TerminalIcon,
  Inbox,
  CircleDotDashed,
} from 'lucide-react'
import MyNav from './my-nav'
import { useGetUserWorkspace } from '#/hooks/workspace.hooks'

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  workspaces: [
    {
      name: 'Acme Inc',
      logo: <GalleryVerticalEndIcon />,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: <AudioLinesIcon />,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: <TerminalIcon />,
      plan: 'Free',
    },
  ],
  workspaceNav: [
    {
      name: 'Acme Inc',
      logo: <GalleryVerticalEndIcon />,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: <AudioLinesIcon />,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: <TerminalIcon />,
      plan: 'Free',
    },
  ],
  myNav: [
    {
      title: 'Inbox',
      url: '#',
      icon: <Inbox />,
    },
    {
      title: 'My Tasks',
      url: '/$workspaceId/tasks',
      icon: <CircleDotDashed />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: userWorkspaces } = useGetUserWorkspace()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {userWorkspaces && <WorkspaceSwitcher workspaces={userWorkspaces} />}
      </SidebarHeader>
      <SidebarContent>
        <MyNav items={data.myNav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
