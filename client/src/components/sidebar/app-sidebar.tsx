import * as React from 'react'
import { NavUser } from '#/components/sidebar/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Inbox, CircleDotDashed } from 'lucide-react'
import MyNav from './my-nav'
import { SidebarHeaderMenu } from './sidebar-header-menu'

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  myNav: [
    {
      title: 'Inbox',
      url: '/$workspaceId/inbox',
      icon: <Inbox />,
    },
    {
      title: 'My Tasks',
      url: '/$workspaceId/my-tasks',
      icon: <CircleDotDashed />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarHeaderMenu />
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
