import type { ComponentProps, ReactNode } from 'react'
import { Slot } from 'radix-ui'
import { SidebarTrigger } from '#/components/ui/sidebar'
import { cn } from '#/lib/utils'

interface PageLayoutProps extends ComponentProps<'main'> {
  title: string
  actions?: ReactNode
  tabs?: ReactNode
  contained?: boolean
}

// Contained pages let their content own scrolling (for example, the inbox).
export function PageLayout({
  title,
  actions,
  tabs,
  contained = false,
  children,
  className,
  ...props
}: PageLayoutProps) {
  return (
    <main
      {...props}
      className={cn(
        'flex min-w-0 w-full flex-col',
        contained
          ? 'h-dvh min-h-0 overflow-hidden'
          : 'mx-auto min-h-dvh max-w-6xl px-4 py-6 sm:px-8 sm:py-10 lg:px-12',
        className,
      )}
    >
      <div
        className={cn(
          'shrink-0',
          contained &&
            'mx-auto w-full max-w-6xl px-4 pt-6 sm:px-8 sm:pt-10 lg:px-12',
        )}
      >
        <header className="mb-7 flex shrink-0 flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          </div>
          {actions}
        </header>
        {tabs}
      </div>
      {children}
    </main>
  )
}

export function PageTabs({ className, ...props }: ComponentProps<'nav'>) {
  return (
    <nav
      {...props}
      className={cn(
        'mb-5 flex shrink-0 items-center gap-6 border-b',
        className,
      )}
    />
  )
}

// Compose with a router Link so navigation and route typing stay with the page.
export function PageTab({ children }: { children: ReactNode }) {
  return (
    <Slot.Root className="-mb-px shrink-0 border-b-2 border-transparent py-3 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-[current=page]:border-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground">
      {children}
    </Slot.Root>
  )
}
