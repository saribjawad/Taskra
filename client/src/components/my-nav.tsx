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
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuButton key={item.title}>
            {item.icon}
            <span>{item.title}</span>
          </SidebarMenuButton>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export default MyNav
