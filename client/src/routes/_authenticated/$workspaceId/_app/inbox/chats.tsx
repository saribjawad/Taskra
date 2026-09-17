import { createFileRoute } from '@tanstack/react-router'
import { MessageSquare } from 'lucide-react'

export const Route = createFileRoute(
  '/_authenticated/$workspaceId/_app/inbox/chats',
)({
  component: ChatsPage,
})

function ChatsPage() {
  return (
    <section className="min-h-0 flex-1 overflow-y-auto" aria-label="Chats">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
        <h2 className="text-xl font-semibold tracking-tight">
          Your conversations
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          A place to talk with your workspace.
        </p>
        <div className="flex flex-col items-center px-4 py-20 text-center">
          <div className="mb-4 rounded-full bg-muted p-3">
            <MessageSquare
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <h3 className="text-sm font-medium">No conversations yet</h3>
          <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
            Workspace messaging is coming soon. Your conversations will appear
            here.
          </p>
        </div>
      </div>
    </section>
  )
}
