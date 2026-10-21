import { useMatchRoute, useNavigate, useParams } from '@tanstack/react-router'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuItem,
} from '../ui/sidebar'

function MyNav({
  items,
  label,
}: {
  label?: string
  items: {
    title: string
    url: string
    icon: React.ReactNode
    badgeCount?: number
  }[]
}) {
  const matchRoute = useMatchRoute()
  const params = useParams({
    strict: false,
  })
  const navigate = useNavigate()

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              className={
                matchRoute({
                  to: item.url,
                  fuzzy: true,
                })
                  ? 'bg-zinc-800'
                  : ''
              }
              onClick={() => {
                navigate({
                  to: item.url,
                  params: {
                    workspaceId: params.workspaceId,
                  },
                })
              }}
            >
              {item.icon}
              <span>{item.title}</span>
            </SidebarMenuButton>
            {!!item.badgeCount && (
              <SidebarMenuBadge className="min-w-5 rounded-full bg-red-500 px-1.5 text-white">
                {item.badgeCount > 9 ? '9+' : item.badgeCount}
              </SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export default MyNav
