import { useMatchRoute, useNavigate, useParams } from '@tanstack/react-router'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
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
          <SidebarMenuButton
            key={item.title}
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
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export default MyNav
