import * as React from 'react'
import { NavUser } from '#/components/sidebar/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  Inbox,
  CircleDotDashed,
  FolderOpen,
  LayoutDashboard,
} from 'lucide-react'
import MyNav from './my-nav'
import { SidebarHeaderMenu } from './sidebar-header-menu'
import { TeamNav } from './team-nav'
import { useAuth } from '#/context/auth/auth-hook'
import { useGetUserNotifications } from '#/hooks/notification.hooks'

const data = {
  myNav: [
    {
      title: 'Dashboard',
      url: '/$workspaceId/dashboard',
      icon: <LayoutDashboard />,
    },
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
  workspaceNav: [
    {
      title: 'Projects',
      url: '/$workspaceId/projects',
      icon: <FolderOpen />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const notificationsQuery = useGetUserNotifications()
  const unreadCount =
    notificationsQuery.data?.pages[0]?.notifications.filter(
      (notification) => !notification.seen,
    ).length ?? 0
  const myNavItems = data.myNav.map((item) =>
    item.title === 'Inbox' ? { ...item, badgeCount: unreadCount } : item,
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarHeaderMenu />
      </SidebarHeader>
      <SidebarContent>
        <MyNav items={myNavItems} />
        <MyNav label="Workspace" items={data.workspaceNav} />
        <TeamNav />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.fullName || user?.username || 'Account',
            email: user?.email || '',
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
