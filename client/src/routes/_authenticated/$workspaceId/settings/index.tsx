import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Bell, Palette, Settings, Shield, User } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/_authenticated/$workspaceId/settings/')({
  component: SettingsOverviewPage,
})

const comingSoonSettings = [
  {
    title: 'General',
    description: 'Workspace name and basic details.',
    icon: Settings,
  },
  {
    title: 'Profile',
    description: 'Your personal details and preferences.',
    icon: User,
  },
  {
    title: 'Notifications',
    description: 'Choose which updates you receive.',
    icon: Bell,
  },
  {
    title: 'Appearance',
    description: 'Adjust the look of your workspace.',
    icon: Palette,
  },
  {
    title: 'Security',
    description: 'Manage sign-in and security options.',
    icon: Shield,
  },
]

function SettingsOverviewPage() {
  const { workspaceId } = Route.useParams()

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-5 py-8 sm:px-8">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Workspace settings are being built. You can manage members and
          invitations now.
        </p>
      </header>

      <section className="rounded-xl border">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium">Members</h2>
              <Badge variant="secondary">Available</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              View workspace members and manage invitations.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/$workspaceId/settings/members" params={{ workspaceId }}>
              Open members
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-sm font-medium">More settings</h2>
          <p className="text-sm text-muted-foreground">
            These sections aren’t ready yet.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {comingSoonSettings.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="flex items-start gap-3 rounded-xl border p-4"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-medium">{title}</h3>
                  <Badge variant="outline" className="text-muted-foreground">
                    In progress
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
