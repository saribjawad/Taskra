import { SidebarGroup, SidebarMenu, SidebarMenuButton } from './ui/sidebar'

function WorkspaceNav({
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
          <SidebarMenuButton>
            {item.icon}
            <span>{item.title}</span>
          </SidebarMenuButton>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export default WorkspaceNav
