import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { PageLayout, PageTabs, PageTab } from '#/components/layout/PageLayout'

export const Route = createFileRoute('/_authenticated/$workspaceId/_app/inbox')(
  {
    component: InboxLayout,
  },
)

const inboxTabs = [
  {
    label: 'Notifications',
    to: '/$workspaceId/inbox/notifications',
  },
  { label: 'Chats', to: '/$workspaceId/inbox/chats' },
] as const

function InboxLayout() {
  const { workspaceId } = Route.useParams()

  return (
    <PageLayout
      title="Inbox"
      contained
      data-slot="inbox-layout"
      tabs={
        <PageTabs aria-label="Inbox sections" className="mb-0">
          {inboxTabs.map(({ label, to }) => (
            <PageTab key={to}>
              <Link to={to} params={{ workspaceId }}>
                {label}
              </Link>
            </PageTab>
          ))}
        </PageTabs>
      }
    >
      <Outlet />
    </PageLayout>
  )
}
