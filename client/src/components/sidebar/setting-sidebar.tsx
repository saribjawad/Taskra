import * as React from 'react'
import {
  ArrowLeft,
  Bell,
  Palette,
  Settings,
  Shield,
  User,
  Users,
} from 'lucide-react'
import { Link, useParams } from '@tanstack/react-router'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const settings = [
  { title: 'Members', icon: <Users />, available: true },
  { title: 'General', icon: <Settings /> },
  { title: 'Profile', icon: <User /> },
  { title: 'Notifications', icon: <Bell /> },
  { title: 'Appearance', icon: <Palette /> },
  { title: 'Security', icon: <Shield /> },
]

export function SettingSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const params = useParams({ strict: false })

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        {/* Back to app */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  to="/$workspaceId/my-tasks"
                  params={{
                    workspaceId: params.workspaceId!!,
                  }}
                >
                  <ArrowLeft />
                  <span>Back to app</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {settings.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.available ? (
                    <SidebarMenuButton asChild>
                      <Link
                        to="/$workspaceId/settings/members"
                        params={{ workspaceId: params.workspaceId!! }}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton disabled>
                      {item.icon}
                      <span>{item.title}</span>
                      <SidebarMenuBadge>In progress</SidebarMenuBadge>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
