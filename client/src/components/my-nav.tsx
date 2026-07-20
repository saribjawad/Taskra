import { useMatchRoute } from '@tanstack/react-router'
import { SidebarGroup, SidebarMenu, SidebarMenuButton } from './ui/sidebar'

function MyNav({
  items,
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
  }[]
}) {
  const matchRoute = useMatchRoute()

  return (
    <SidebarGroup>
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
