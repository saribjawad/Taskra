import * as React from 'react'
import { Bell, Palette, Settings, Shield, User, ArrowLeft } from 'lucide-react'
import { Link, useParams } from '@tanstack/react-router'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const data = {
  settings: [
    {
      title: 'General',
      url: '#',
      icon: <Settings />,
    },
    {
      title: 'Profile',
      url: '#',
      icon: <User />,
    },
    {
      title: 'Notifications',
      url: '#',
      icon: <Bell />,
    },
    {
      title: 'Appearance',
      url: '#',
      icon: <Palette />,
    },
    {
      title: 'Security',
      url: '#',
      icon: <Shield />,
    },
  ],
}

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
              {data.settings.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      {item.icon}
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
