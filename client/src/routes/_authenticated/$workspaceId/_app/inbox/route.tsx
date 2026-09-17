import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { Bell, MessageSquare } from 'lucide-react'
import { SidebarTrigger } from '#/components/ui/sidebar'

export const Route = createFileRoute('/_authenticated/$workspaceId/_app/inbox')(
  {
    component: InboxLayout,
  },
)

const inboxTabs = [
  {
    label: 'Notifications',
    to: '/$workspaceId/inbox/notifications',
    icon: Bell,
  },
  { label: 'Chats', to: '/$workspaceId/inbox/chats', icon: MessageSquare },
] as const

function InboxLayout() {
  const { workspaceId } = Route.useParams()

  return (
    <main
      data-slot="inbox-layout"
      className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
    >
      <header className="shrink-0 border-b px-4 sm:px-6">
        <div className="flex min-h-14 items-center gap-3">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-sm font-medium">Inbox</h1>
        </div>
        <nav className="flex gap-5" aria-label="Inbox sections">
          {inboxTabs.map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              params={{ workspaceId }}
              className="inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              activeProps={{ className: 'border-foreground text-foreground' }}
              inactiveProps={{
                className:
                  'border-transparent text-muted-foreground hover:text-foreground',
              }}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <Outlet />
    </main>
  )
}
